import { useEffect, useState } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useCountUp } from "../hooks/motion";
import { useToast } from "./Toast";
import { watchWeights, saveWeight } from "../lib/data";
import { todayKey, prettyDate } from "../lib/utils";
import WeightChart from "./WeightChart";

const signedKg = (n) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(n).toFixed(1)} kg`;

export default function WeightView() {
  const { user, userData } = useAuth();
  const toast = useToast();
  const { profile } = userData;
  const [entries, setEntries] = useState(null);
  const [kg, setKg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => watchWeights(user.uid, setEntries), [user.uid]);

  const first = entries?.[0];
  const latest = entries?.[entries.length - 1];
  const shown = useCountUp(latest?.kg ?? Number(profile.weightKg));
  const h = profile.heightCm / 100;
  const healthyMax = 24.9 * h * h;
  const change = first && latest && entries.length > 1 ? Math.round((latest.kg - first.kg) * 10) / 10 : null;
  // Going down is progress when losing, going up when gaining
  const good = change === null || change === 0 ? null : profile.goal === "gain" ? change > 0 : profile.goal === "lose" ? change < 0 : null;

  const save = async (e) => {
    e.preventDefault();
    const n = Math.round(Number(kg) * 10) / 10;
    if (!(n >= 30 && n <= 250)) return;
    setBusy(true);
    try {
      const goals = await saveWeight(user.uid, todayKey(), n, profile, userData.goals);
      setKg("");
      toast(profile.customGoals
        ? `Saved ${n} kg`
        : `Saved ${n} kg · goals now ${goals.calories.toLocaleString("en-IN")} kcal, ${goals.protein} g protein`);
    } catch (err) {
      toast(`Couldn't save: ${err.message}`, "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="history-grid">
      <section className="card">
        <div className="card-head">
          <h2>Weight</h2>
          <span className="muted small">{latest ? `Last weighed ${prettyDate(latest.date)}` : "No weigh-ins yet"}</span>
        </div>
        <p className="weight-now"><b>{shown.toFixed(1)}</b> kg</p>
        {change !== null && (
          <p className={`weight-change ${good === true ? "good" : good === false ? "bad" : ""}`}>
            {change < 0 ? <TrendingDown size={18} /> : <TrendingUp size={18} />}
            {signedKg(change)} since {prettyDate(first.date)}
          </p>
        )}
        <p className="muted small">Healthy weight for your height is up to about {Math.round(healthyMax)} kg.</p>
        <form className="weight-form" onSubmit={save}>
          <label className="field">
            <span>Today's weight</span>
            <div className="unit-input">
              <input type="number" inputMode="decimal" step="0.1" min="30" max="250" required
                value={kg} onChange={(e) => setKg(e.target.value)} placeholder={String(latest?.kg ?? profile.weightKg)} />
              <em>kg</em>
            </div>
          </label>
          <button className="btn btn-primary btn-lg" disabled={busy}>{busy ? "Saving…" : "Save"}</button>
        </form>
        <p className="muted small">
          {profile.customGoals
            ? "You set your own goals, so they stay as they are."
            : "Your daily calorie and protein goals update from your latest weight."}
        </p>
      </section>

      <section className="card">
        <div className="card-head">
          <h2>Progress</h2>
          {entries?.length > 0 && <span className="muted small">{entries.length} weigh-in{entries.length > 1 ? "s" : ""}</span>}
        </div>
        {entries === null && <div className="spinner sm" />}
        {entries?.length === 0 && <p className="muted">Log your weight once a week, before breakfast, to see your progress here.</p>}
        {entries?.length > 0 && (
          <>
            <WeightChart entries={entries} healthyMax={healthyMax} />
            <details className="weight-table">
              <summary>All weigh-ins</summary>
              <table className="items">
                <thead><tr><th>Date</th><th>Weight</th><th>Change</th></tr></thead>
                <tbody>
                  {[...entries].reverse().map((e, i, list) => {
                    const prev = list[i + 1];
                    const d = prev ? Math.round((e.kg - prev.kg) * 10) / 10 : null;
                    return (
                      <tr key={e.date}>
                        <td>{prettyDate(e.date)}</td>
                        <td>{e.kg} kg</td>
                        <td>{d === null ? "–" : signedKg(d)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </details>
          </>
        )}
      </section>
    </div>
  );
}
