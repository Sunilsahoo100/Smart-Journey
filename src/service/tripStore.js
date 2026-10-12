// Trip persistence. Uses Firestore when configured and always keeps a copy in
// localStorage, so the app works offline and without any Firebase setup.
import { collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, where } from "firebase/firestore";
import { auth, db } from "./firebaseConfig";

const COLLECTION = "AItrips";
const LOCAL_KEY = "sj:trips:v1";
const CLOUD_TIMEOUT_MS = 10000;

function readLocal() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY)) ?? {};
  } catch {
    return {};
  }
}

function writeLocal(trips) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(trips));
  } catch (error) {
    console.warn("Could not save trips locally", error);
  }
}

function withTimeout(promise) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Cloud storage timed out")), CLOUD_TIMEOUT_MS)
    ),
  ]);
}

// Older trips have no createdAt, but their id is a Date.now() timestamp.
const createdTime = (trip) => trip.createdAt ?? (Number(trip.id) || 0);
const byNewest = (a, b) => createdTime(b) - createdTime(a);

// Cloud writes need a signed-in Firebase user (see firestore.rules).
const canUseCloud = () => Boolean(db && auth?.currentUser);

const ownedBy = (trip, user) =>
  trip.userId ? trip.userId === user.uid : Boolean(user.email) && trip.userEmail === user.email;

/** Saves a trip. Resolves to { cloud: boolean } telling where it was stored. */
export async function saveTrip(input) {
  // Firestore rejects `undefined` values; a JSON round-trip drops them.
  const trip = JSON.parse(JSON.stringify(input));
  writeLocal({ ...readLocal(), [trip.id]: trip });
  if (!canUseCloud()) return { cloud: false };
  try {
    await withTimeout(setDoc(doc(db, COLLECTION, trip.id), trip));
    return { cloud: true };
  } catch (error) {
    console.warn("Cloud save failed, trip kept on this device", error);
    return { cloud: false, error };
  }
}

export async function getTrip(id) {
  const local = readLocal()[id];
  if (local) return local;
  if (!db) return null;
  const snapshot = await withTimeout(getDoc(doc(db, COLLECTION, id)));
  return snapshot.exists() ? snapshot.data() : null;
}

export async function getUserTrips(user) {
  const trips = new Map(
    Object.values(readLocal())
      .filter((trip) => ownedBy(trip, user))
      .map((trip) => [trip.id, trip])
  );

  if (canUseCloud()) {
    try {
      const snapshot = await withTimeout(
        getDocs(query(collection(db, COLLECTION), where("userId", "==", user.uid)))
      );
      snapshot.forEach((d) => trips.set(d.id, { id: d.id, ...d.data() }));
    } catch (error) {
      console.warn("Could not load cloud trips", error);
    }
  }
  return [...trips.values()].sort(byNewest);
}

export async function deleteTrip(id) {
  const local = readLocal();
  delete local[id];
  writeLocal(local);
  if (canUseCloud()) await withTimeout(deleteDoc(doc(db, COLLECTION, id)));
}
