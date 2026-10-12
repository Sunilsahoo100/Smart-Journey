import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  GoogleAuthProvider,
  linkWithPopup,
  onAuthStateChanged,
  signInAnonymously,
  signInWithCredential,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import SignInDialog from "@/components/custom/SignInDialog";
import { auth } from "@/service/firebaseConfig";

// Without Firebase the app falls back to a local guest stored in the browser.
const LOCAL_USER_KEY = "user";
const GUEST_ID_KEY = "sj:guest-id";

// eslint-disable-next-line react-refresh/only-export-components
export const isGoogleSignInAvailable = Boolean(auth);

const AuthContext = createContext(null);

function toProfile(firebaseUser) {
  if (!firebaseUser) return null;
  // After upgrading a guest, the Google profile may only be in providerData.
  const google = firebaseUser.providerData?.find((p) => p.providerId === "google.com");
  return {
    uid: firebaseUser.uid,
    name: firebaseUser.isAnonymous ? "Guest traveler" : firebaseUser.displayName ?? google?.displayName ?? "Traveler",
    email: firebaseUser.email ?? google?.email ?? null,
    picture: firebaseUser.photoURL ?? google?.photoURL ?? null,
    guest: firebaseUser.isAnonymous,
  };
}

function readLocalUser() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_USER_KEY));
  } catch {
    return null;
  }
}

function localGuest() {
  let id = localStorage.getItem(GUEST_ID_KEY);
  if (!id) {
    id = crypto.randomUUID?.() ?? `${Date.now()}${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(GUEST_ID_KEY, id);
  }
  return { uid: `local-${id}`, name: "Guest traveler", email: null, picture: null, guest: true };
}

function authErrorMessage(error) {
  switch (error?.code) {
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return null; // the user closed the popup – nothing to report
    case "auth/popup-blocked":
      return "Your browser blocked the sign-in popup. Allow popups for this site and try again.";
    case "auth/unauthorized-domain":
      return "This domain isn't authorised for sign-in. Add it in Firebase → Authentication → Settings → Authorized domains.";
    case "auth/operation-not-allowed":
    case "auth/admin-restricted-operation":
      return "This sign-in method is disabled. Enable it in Firebase → Authentication → Sign-in method.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    default:
      return "Sign-in failed. Please try again.";
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => (auth ? null : readLocalUser()));
  const [ready, setReady] = useState(!auth);
  const [dialogOpen, setDialogOpen] = useState(false);
  const pendingAction = useRef(null);

  const runPendingAction = useCallback((profile) => {
    setDialogOpen(false);
    const action = pendingAction.current;
    pendingAction.current = null;
    action?.(profile);
  }, []);

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, (firebaseUser) => {
      setUser(toProfile(firebaseUser));
      setReady(true);
    });
  }, []);

  /** Google sign-in. A guest is upgraded in place so their trips are kept. */
  const signInWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    try {
      let credential;
      if (auth.currentUser?.isAnonymous) {
        try {
          credential = await linkWithPopup(auth.currentUser, provider);
        } catch (error) {
          // This Google account already exists – switch to it instead.
          if (error?.code !== "auth/credential-already-in-use") throw error;
          credential = await signInWithCredential(auth, GoogleAuthProvider.credentialFromError(error));
        }
        await credential.user.reload();
      } else {
        credential = await signInWithPopup(auth, provider);
      }
      const profile = toProfile(auth.currentUser ?? credential.user);
      setUser(profile);
      runPendingAction(profile);
      return profile;
    } catch (error) {
      console.error(error);
      const message = authErrorMessage(error);
      if (message) throw new Error(message);
      return null;
    }
  }, [runPendingAction]);

  const continueAsGuest = useCallback(async () => {
    if (!auth) {
      const profile = localGuest();
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(profile));
      setUser(profile);
      runPendingAction(profile);
      return profile;
    }
    try {
      const { user: firebaseUser } = await signInAnonymously(auth);
      const profile = toProfile(firebaseUser);
      setUser(profile);
      runPendingAction(profile);
      return profile;
    } catch (error) {
      console.error(error);
      throw new Error(authErrorMessage(error) ?? "Couldn't continue as guest.");
    }
  }, [runPendingAction]);

  const logout = useCallback(async () => {
    if (auth) await signOut(auth);
    localStorage.removeItem(LOCAL_USER_KEY);
    setUser(null);
  }, []);

  /** Runs `action(user)` now, or after the user signs in. */
  const requireUser = useCallback(
    (action) => {
      if (user) return action(user);
      pendingAction.current = action;
      setDialogOpen(true);
    },
    [user]
  );

  const openSignIn = useCallback(() => setDialogOpen(true), []);

  const value = useMemo(
    () => ({ user, ready, signInWithGoogle, continueAsGuest, logout, requireUser, openSignIn }),
    [user, ready, signInWithGoogle, continueAsGuest, logout, requireUser, openSignIn]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      <SignInDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) pendingAction.current = null;
        }}
      />
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
