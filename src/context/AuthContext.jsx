import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { googleLogout } from "@react-oauth/google";
import SignInDialog from "@/components/custom/SignInDialog";

// eslint-disable-next-line react-refresh/only-export-components
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_AUTH_CLIENT_ID;

const USER_KEY = "user";
const GUEST_ID_KEY = "sj:guest-id";

const AuthContext = createContext(null);

function readUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
}

function guestId() {
  let id = localStorage.getItem(GUEST_ID_KEY);
  if (!id) {
    id = crypto.randomUUID?.() ?? `${Date.now()}${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(GUEST_ID_KEY, id);
  }
  return id;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readUser);
  const [dialogOpen, setDialogOpen] = useState(false);
  const pendingAction = useRef(null);

  const signIn = useCallback((profile) => {
    localStorage.setItem(USER_KEY, JSON.stringify(profile));
    setUser(profile);
    setDialogOpen(false);
    const action = pendingAction.current;
    pendingAction.current = null;
    action?.(profile);
  }, []);

  const continueAsGuest = useCallback(() => {
    // A stable id per browser, so a returning guest still sees their trips.
    signIn({ name: "Guest traveler", email: `guest-${guestId()}@guest.local`, guest: true });
  }, [signIn]);

  const logout = useCallback(() => {
    if (GOOGLE_CLIENT_ID) googleLogout();
    localStorage.removeItem(USER_KEY);
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
    () => ({ user, signIn, continueAsGuest, logout, requireUser, openSignIn }),
    [user, signIn, continueAsGuest, logout, requireUser, openSignIn]
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
