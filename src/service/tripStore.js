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

/** Creates or overwrites a trip. Resolves to { cloud: boolean } telling where it was stored. */
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
    return { cloud: false, error, reason: cloudErrorReason(error) };
  }
}

/** Human-readable cause for a failed cloud write (shown in the sync warning). */
export function cloudErrorReason(error) {
  switch (error?.code) {
    case "permission-denied":
      return "Firestore rules rejected the save. Publish the latest firestore.rules in the Firebase console.";
    case "unauthenticated":
      return "You're not signed in to Firebase. Sign in again and retry.";
    case "unavailable":
      return "Firestore is unreachable — check your connection.";
    case "not-found":
    case "failed-precondition":
      return "The Firestore database isn't set up for this project yet.";
    default:
      return /timed out/i.test(error?.message ?? "") ? "Firestore didn't respond in time." : error?.message ?? "";
  }
}

/** Loads a trip, preferring the cloud copy (it may have been edited elsewhere). */
export async function getTrip(id) {
  const local = readLocal()[id];
  if (db) {
    try {
      const snapshot = await withTimeout(getDoc(doc(db, COLLECTION, id)));
      if (snapshot.exists()) return snapshot.data();
    } catch (error) {
      if (!local) throw error;
      console.warn("Cloud load failed, using this device's copy", error);
    }
  }
  return local ?? null;
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
