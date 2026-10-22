import { useState } from "react";
import { LogOut } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import { useToast } from "../components/Toast";
import { logWeight } from "../lib/data";
import { todayKey } from "../lib/utils";
import { ACTIVITY, GOAL, bmi, calculateGoals } from "../lib/goals";

const THEMES = [["auto", "Auto"], ["light", "Light"], ["dark", "Dark"]];

export default function Profile() {
  const { userData, updateProfile, signOut, user } = useAuth();
  const toast = useToast();
  const [theme, setTheme] = useTheme();
  const [p, setP] = useState(userData.profile);
  const [goals, setGoals] = useState(userData.goals);
  const [custom, setCustom] = useState(Boolean(userData.profile.customGoals));
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  const set = (k, v) => {
    const next = { ...p, [k]: v };
    setP(next);
    setSaved(false);
    if (!custom && next.weightKg && next.heightCm && next.age) setGoals(calculateGoals(next));
  };
  const setGoal = (k, v) => { setGoals({ ...goals, [k]: Number(v) }); setSaved(false); };

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const weightKg = Number(p.weightKg);
      await updateProfile(
        { ...p, age: Number(p.age), weightKg, heightCm: Number(p.heightCm), customGoals: custom },
        goals
      );
      // A changed weight also goes into the weight history
      if (weightKg !== Number(userData.profile.weightKg)) await logWeight(user.uid, todayKey(), weightKg);
      setSaved(true);
      toast("Profile and goals saved");
    } catch (err) {
      toast(`Couldn't save: ${err.message}`, "error");
    } finally {
      setBusy(false);
    }
  };

  const b = bmi(Number(p.weightKg), Number(p.heightCm));

  return (
    <div className="page narrow">
      <header className="page-head">
        <h1>Profile & goals</h1>
        <button className="btn btn-ghost" onClick={signOut}><LogOut size={17} /> Sign out</button>
      </header>

      <form onSubmit={save} className="profile-grid">
        <section className="card">
          <h2>About you</h2>
          <p className="muted small">{user.email}</p>
          <div className="field-row">
            <label className="field"><span>Name</span>
              <input value={p.name} onChange={(e) => set("name", e.target.value)} /></label>
            <label className="field"><span>Sex</span>
              <select value={p.sex} onChange={(e) => set("sex", e.target.value)}>
                <option value="male">Male</option><option value="female">Female</option>
              </select></label>
          </div>
          <div className="field-row three">
            <label className="field"><span>Age</span>
              <input type="number" inputMode="numeric" min="13" max="90" value={p.age} onChange={(e) => set("age", e.target.value)} required /></label>
            <label className="field"><span>Weight (kg)</span>
              <input type="number" inputMode="decimal" step="0.1" min="30" max="250" value={p.weightKg} onChange={(e) => set("weightKg", e.target.value)} required /></label>
            <label className="field"><span>Height (cm)</span>
              <input type="number" inputMode="numeric" min="120" max="230" value={p.heightCm} onChange={(e) => set("heightCm", e.target.value)} required /></label>
          </div>
          <label className="field"><span>Activity</span>
            <select value={p.activity} onChange={(e) => set("activity", e.target.value)}>
              {Object.entries(ACTIVITY).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select></label>
          <div className="seg" role="radiogroup" aria-label="Goal">
            {Object.entries(GOAL).map(([k, v]) => (
              <button type="button" key={k} role="radio" aria-checked={p.goal === k}
                className={p.goal === k ? "on" : ""} onClick={() => set("goal", k)}>{v.label}</button>
            ))}
          </div>
          {b > 0 && <p className="muted small">BMI {b.toFixed(1)} · healthy weight for your height is about {Math.round(18.5 * (p.heightCm / 100) ** 2)}–{Math.round(24.9 * (p.heightCm / 100) ** 2)} kg</p>}
        </section>

        <section className="card">
          <div className="card-head">
            <h2>Daily goals</h2>
            <label className="switch">
              <input type="checkbox" checked={custom} onChange={(e) => {
                setCustom(e.target.checked);
                if (!e.target.checked) setGoals(calculateGoals(p));
              }} />
              <span>Set my own</span>
            </label>
          </div>
          <p className="muted small">
            {custom ? "Type your own targets." : `Calculated from your details. Maintenance is about ${goals.maintenance?.toLocaleString("en-IN")} kcal.`}
          </p>
          <div className="goal-grid">
            {[["calories", "Calories", "kcal"], ["protein", "Protein", "g"], ["carbs", "Carbs", "g"], ["fat", "Fat", "g"], ["waterMl", "Water", "ml"]].map(([k, label, unit]) => (
              <label key={k} className="field goal-field"><span>{label}</span>
                <div className="unit-input">
                  <input type="number" value={goals[k]} disabled={!custom} onChange={(e) => setGoal(k, e.target.value)} />
                  <em>{unit}</em>
                </div>
              </label>
            ))}
          </div>
          <button className="btn btn-primary btn-lg btn-block" disabled={busy}>
            {busy ? "Saving…" : saved ? "Saved" : "Save goals"}
          </button>
        </section>
      </form>

      <section className="card appearance">
        <div>
          <h2>Appearance</h2>
          <p className="muted small">Auto follows your phone or laptop setting.</p>
        </div>
        <div className="seg" role="radiogroup" aria-label="Theme">
          {THEMES.map(([k, label]) => (
            <button type="button" key={k} role="radio" aria-checked={theme === k}
              className={theme === k ? "on" : ""} onClick={() => setTheme(k)}>{label}</button>
          ))}
        </div>
      </section>
    </div>
  );
}
