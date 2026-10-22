import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";
import { watchUser, saveProfile } from "../lib/data";

const Ctx = createContext(null);
const LAST_ACCOUNT = "glowplate:lastAccount";

// The Google account last used on this device, so the login screen can offer "Continue as …"
export function lastAccount() {
  try { return JSON.parse(localStorage.getItem(LAST_ACCOUNT)) || null; } catch { return null; }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!auth) { setLoading(false); return; }
    let stopUser = () => {};
    const stopAuth = onAuthStateChanged(auth, (u) => {
      stopUser();
      stopUser = () => {};
      setUser(u);
      setUserData(null);
      setError(null);
      if (!u) { setLoading(false); return; }
      setLoading(true);
      try {
        localStorage.setItem(LAST_ACCOUNT, JSON.stringify({ email: u.email, name: u.displayName, photoURL: u.photoURL }));
      } catch { /* private mode: nothing to remember */ }
      stopUser = watchUser(
        u,
        (data) => { setUserData(data); setLoading(false); },
        (e) => { setError(e); setLoading(false); }
      );
    });
    return () => { stopAuth(); stopUser(); };
  }, []);

  const value = {
    user,
    userData,
    loading,
    error,
    // With a remembered account Google goes straight to it; otherwise it shows the account chooser
    signIn: (account) => {
      googleProvider.setCustomParameters(account ? { login_hint: account.email } : { prompt: "select_account" });
      return signInWithPopup(auth, googleProvider);
    },
    signOut: () => signOut(auth),
    // The profile listener picks up the change straight away, so no local copy to patch
    updateProfile: (profile, goals) => saveProfile(user.uid, profile, goals),
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
