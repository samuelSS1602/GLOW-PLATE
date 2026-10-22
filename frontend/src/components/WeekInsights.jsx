import { Check, Minus, X } from "lucide-react";
import { prettyDate } from "../lib/utils";

const ROWS = ["Calories", "Protein", "Water"];

// Hit / miss for each target over the last 7 completed days, plus the target to focus on.
// `entries` come oldest first as { date, status, checks }; `insight` is weekInsights(entries).
export default function WeekInsights({ entries, insight }) {
  return (
    <section className="card">
      <div className="card-head">
        <h2>Last 7 full days</h2>
        <span className="muted small">{prettyDate(entries[0].date)} – {prettyDate(entries[entries.length - 1].date)}</span>
      </div>

      {insight.days === 0 ? (
        <p className="muted">Insights start after your first full day.</p>
      ) : (
        <>
          <p className="insight-big"><b>{insight.finished}</b> of {insight.days} days finished</p>
          <div className="insights" role="table" aria-label="Goals hit each day">
            <div className="insight-row head" role="row">
              <span role="columnheader"><span className="sr-only">Goal</span></span>
              {entries.map((e) => <span key={e.date} role="columnheader">{Number(e.date.slice(8))}</span>)}
              <span role="columnheader">Hit</span>
            </div>
            {ROWS.map((label) => (
              <div key={label} className="insight-row" role="row">
                <span role="rowheader">{label}</span>
                {entries.map((e, i) => {
                  const state = e.status === "before" ? "na" : e.checks.find((c) => c.label === label)?.ok ? "ok" : "miss";
                  const text = { na: "before you joined", ok: "hit", miss: "missed" }[state];
                  return (
                    <span key={e.date} role="cell" className={`hit ${state}`} style={{ "--i": i }} title={`${prettyDate(e.date)}: ${text}`}>
                      {state === "ok" ? <Check size={13} strokeWidth={3} /> : state === "miss" ? <X size={13} strokeWidth={3} /> : <Minus size={12} />}
                      <span className="sr-only">{prettyDate(e.date)}: {text}</span>
                    </span>
                  );
                })}
                <b role="cell">{insight.hits[label]}/{insight.days}</b>
              </div>
            ))}
          </div>
          <p className="nudge">{insight.focus ? insight.focus.tip : "Every target hit on every day. Keep it going!"}</p>
        </>
      )}
    </section>
  );
}
