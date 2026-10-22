import { ChevronLeft, ChevronRight } from "lucide-react";
import { monthDays, shiftMonth, prettyDate, todayKey } from "../lib/utils";

export const STATUS_LABEL = { done: "Finished", missed: "Not finished", empty: "Not logged", today: "In progress" };
const LEGEND = ["done", "missed", "empty"];
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Month grid where each past day is coloured by whether it hit the calorie, protein and water goals.
export default function MonthCalendar({ month, onMonth, status, selected, onSelect }) {
  const today = todayKey();
  const [y, m] = month.split("-").map(Number);
  const counts = {};
  Object.values(status || {}).forEach((s) => { counts[s] = (counts[s] || 0) + 1; });

  return (
    <section className="card">
      <div className="cal-head">
        <button className="btn btn-ghost icon" onClick={() => onMonth(shiftMonth(month, -1))} aria-label="Previous month">
          <ChevronLeft size={18} />
        </button>
        <h2 aria-live="polite">{new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</h2>
        <button className="btn btn-ghost icon" onClick={() => onMonth(shiftMonth(month, 1))}
          disabled={month >= today.slice(0, 7)} aria-label="Next month">
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="cal" key={month}>
        {WEEKDAYS.map((w) => <span key={w} className="cal-wd">{w}</span>)}
        {monthDays(month).map((d, i) => {
          if (!d) return <span key={`pad-${i}`} />;
          const s = status?.[d];
          return (
            <button key={d} type="button" onClick={() => onSelect(d)} disabled={d > today} style={{ "--i": i }}
              className={`cal-day ${s || ""} ${d === today ? "is-today" : ""} ${d === selected ? "sel" : ""}`}
              aria-pressed={d === selected} aria-current={d === today ? "date" : undefined}
              aria-label={`${prettyDate(d)}${STATUS_LABEL[s] ? `: ${STATUS_LABEL[s]}` : ""}`}>
              {Number(d.slice(8))}
            </button>
          );
        })}
      </div>

      <div className="cal-legend">
        {LEGEND.map((k) => (
          <span key={k}><i className={`cal-dot ${k}`} />{STATUS_LABEL[k]} <b>{status ? counts[k] || 0 : "–"}</b></span>
        ))}
      </div>
    </section>
  );
}
