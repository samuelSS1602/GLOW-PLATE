import { Credit } from "../components/Layout";
import { useAuth } from "../hooks/useAuth";

// Shown when signed in but Firestore refuses to load the profile (usually unpublished rules).
export function LoadError({ error }) {
  const { signOut } = useAuth();
  const denied = error.code === "permission-denied";
  return (
    <div className="login">
      <div className="login-copy">
        <h1>{denied ? "Firestore blocked your data" : "Couldn't load your data"}</h1>
        <p>
          {denied
            ? <>The database is refusing access. Publish the rules in <code>firestore.rules</code> (Firebase console &gt; Firestore Database &gt; Rules), then reload this page.</>
            : error.message}
        </p>
        <div className="picker-btns">
          <button className="btn btn-primary" onClick={() => location.reload()}>Reload</button>
          <button className="btn btn-ghost" onClick={signOut}>Sign out</button>
        </div>
        <Credit />
      </div>
    </div>
  );
}

export default function SetupNotice() {
  return (
    <div className="login">
      <div className="login-copy">
        <h1>Connect Firebase to start</h1>
        <p>
          Copy <code>.env.example</code> to <code>.env</code> in the <code>frontend</code> folder,
          paste your Firebase web app keys, then restart <code>npm run dev</code>.
          The README walks through each step.
        </p>
        <Credit />
      </div>
    </div>
  );
}
