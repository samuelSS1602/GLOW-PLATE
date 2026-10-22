import { useState } from "react";
import { Credit } from "../components/Layout";
import { useAuth, lastAccount } from "../hooks/useAuth";

const MESSAGES = {
  "auth/popup-closed-by-user": "Sign-in was closed. Try again.",
  "auth/cancelled-popup-request": "Sign-in was closed. Try again.",
  "auth/popup-blocked": "Your browser blocked the Google sign-in window. Allow pop-ups for this site and try again.",
  "auth/network-request-failed": "No internet connection. Check it and try again.",
  "auth/unauthorized-domain": `This address (${location.hostname}) isn't allowed to sign in. Open http://localhost:5173 instead, or add it in Firebase console > Authentication > Settings > Authorized domains.`,
};

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
  );
}

export default function Login() {
  const { signIn } = useAuth();
  const [account] = useState(lastAccount);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const first = account?.name?.split(" ")[0];

  const go = async (acc) => {
    setBusy(true); setError("");
    try { await signIn(acc); }
    catch (e) { setError(MESSAGES[e.code] || e.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="login">
      <div className="login-art" aria-hidden="true">
        <svg viewBox="-110 -110 220 220">
          <circle r="104" fill="#f3efe2" />
          <circle r="92" fill="none" stroke="#2c6b4c" strokeWidth="11" strokeDasharray="420 600" transform="rotate(-90)" strokeLinecap="round" />
          <circle r="74" fill="none" stroke="#e8a530" strokeWidth="7" strokeDasharray="120 600" transform="rotate(-80)" strokeLinecap="round" />
          <circle r="74" fill="none" stroke="#9b5a3c" strokeWidth="7" strokeDasharray="100 600" transform="rotate(45)" strokeLinecap="round" />
          <circle r="74" fill="none" stroke="#c9b48a" strokeWidth="7" strokeDasharray="70 600" transform="rotate(160)" strokeLinecap="round" />
        </svg>
      </div>
      <div className="login-copy">
        {account ? (
          <>
            <h1>Welcome back{first ? `, ${first}` : ""}.</h1>
            <p>Your meals, water and goals are saved to your Google account. Continue to pick up where you left off.</p>
            <div className="account-chip">
              {account.photoURL && <img src={account.photoURL} alt="" referrerPolicy="no-referrer" />}
              <span>{account.email}</span>
            </div>
            <button className="btn btn-primary btn-lg" onClick={() => go(account)} disabled={busy}>
              <GoogleIcon /> {busy ? "Signing in…" : `Continue as ${first || "you"}`}
            </button>
            <button className="link-btn" onClick={() => go(null)} disabled={busy}>Use another account</button>
          </>
        ) : (
          <>
            <h1>Know what's on your plate.</h1>
            <p>
              Pick what you ate from a list of everyday South Indian foods and GlowPlate counts the calories,
              protein, carbs and fat, then tracks them with your water against the goals in your plan.
            </p>
            <button className="btn btn-primary btn-lg" onClick={() => go(null)} disabled={busy}>
              <GoogleIcon /> {busy ? "Signing in…" : "Continue with Google"}
            </button>
          </>
        )}
        {error && <p className="error">{error}</p>}
        <Credit />
      </div>
    </div>
  );
}
