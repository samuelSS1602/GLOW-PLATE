import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Check, X } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useDayLog } from "../hooks/useDayLog";
import { useCountUp } from "../hooks/motion";
import { lastNDays, prettyDate, todayKey, monthDays, dayChecks, addDays, dateRange } from "../lib/utils";
import { dayStatus, joinedKey, weekInsights } from "../lib/progress";
import MealCard from "../components/MealCard";
import MonthCalendar, { STATUS_LABEL } from "../components/MonthCalendar";
import WeekInsights from "../components/WeekInsights";
import WeightView from "../components/WeightView";

const VIEWS = [["calendar", "Calendar"], ["week", "7 days"], ["weight", "Weight"]];

function Stat({ value, unit = "", label, goal }) {
  const shown = Math.round(useCountUp(value));
  return (
    <div className="stat">
      <b>{shown.toLocaleString("en-IN")}{unit}</b><span>{label}</span>{goal && <small>{goal}</small>}
    </div>
  );
}

export default function History() {
  const { user, userData } = useAuth();
  const g = userData.goals;
  const today = todayKey();
  const [params, setParams] = useSearchParams();
  const view = VIEWS.some(([k]) => k === params.get("view")) ? params.get("view") : "calendar";
  const days = useMemo(() => lastNDays(7), [today]);
  const fullDays = useMemo(() => dateRange(addDays(today, -7), addDays(today, -1)), [today]);
  const [month, setMonth] = useState(today.slice(0, 7));
  const [selected, setSelected] = useState(today);

  const monthKeys = useMemo(() => monthDays(month).filter(Boolean), [month]);
  const monthLog = useDayLog(user.uid, monthKeys[0], monthKeys[monthKeys.length - 1]);
  const weekLog = useDayLog(user.uid, fullDays[0], today);
  const log = view === "week" ? weekLog : monthLog;

  const joined = joinedKey(userData, today);
  const statusIn = (lg, d) => dayStatus({ date: d, today, joined, meals: lg.mealsOn(d), waterMl: lg.waterOn(d), goals: g });
  const status = monthLog.ready ? Object.fromEntries(monthKeys.map((d) => [d, statusIn(monthLog, d)])) : null;

  const totalsByDay = Object.fromEntries(days.map((d) => [d, weekLog.totalsOn(d)]));
  const logged = days.filter((d) => weekLog.mealsOn(d).length);
  const avg = (k) => (logged.length ? Math.round(logged.reduce((s, d) => s + totalsByDay[d][k], 0) / logged.length) : 0);
  const maxCal = Math.max(g.calories * 1.25, ...days.map((d) => totalsByDay[d].calories));

  const insightEntries = weekLog.ready
    ? fullDays.map((d) => ({ date: d, status: statusIn(weekLog, d), checks: dayChecks(weekLog.totalsOn(d), weekLog.waterOn(d), g) }))
    : null;

  const selMeals = log.mealsOn(selected);
  const selWater = log.waterOn(selected);
  const selStatus = log.ready ? statusIn(log, selected) : null;

  // Each view reads its own date range, so keep the selected day inside it
  const switchView = (v) => {
    if (v === "week" && !days.includes(selected)) setSelected(today);
    if (v === "calendar") setMonth(selected.slice(0, 7));
    setParams(v === "calendar" ? {} : { view: v }, { replace: true });
  };
  const changeMonth = (mk) => {
    const keys = monthDays(mk).filter(Boolean);
    setMonth(mk);
    setSelected(keys.includes(today) ? today : keys[keys.length - 1]);
  };

  const dayCard = (
    <section className="card">
      <div className="card-head">
        <h2>{prettyDate(selected)}</h2>
        {STATUS_LABEL[selStatus] && <span className={`pill ${selStatus}`}>{STATUS_LABEL[selStatus]}</span>}
      </div>
      {selMeals.length || selWater ? (
        <ul className="checks" key={selected}>
          {dayChecks(log.totalsOn(selected), selWater, g).map((c) => (
            <li key={c.label} className={c.ok ? "ok" : ""}>
              {c.ok ? <Check size={16} /> : <X size={16} />}
              <span>{c.label}</span>
              <b>{c.value}</b>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">{selected === today ? "Nothing logged yet today." : "Nothing logged on this day."}</p>
      )}
      <div className="meal-list">
        {selMeals.map((m) => <MealCard key={m.id} meal={m} />)}
      </div>
    </section>
  );

  return (
    <div className="page">
      <header className="page-head history-head">
        <h1>History</h1>
        <div className="seg" role="radiogroup" aria-label="View">
          {VIEWS.map(([k, label]) => (
            <button type="button" key={k} role="radio" aria-checked={view === k}
              className={view === k ? "on" : ""} onClick={() => switchView(k)}>{label}</button>
          ))}
        </div>
      </header>

      {view === "weight" && <WeightView />}

      {view === "calendar" && (
        <div className="history-grid">
          <MonthCalendar month={month} onMonth={changeMonth} status={status} selected={selected} onSelect={setSelected} />
          {dayCard}
        </div>
      )}

      {view === "week" && (
        <div className="history-grid">
          <div className="stack">
            <div className="stats">
              <Stat value={avg("calories")} label="avg kcal / day" goal={`goal ${g.calories}`} />
              <Stat value={avg("protein")} unit=" g" label="avg protein / day" goal={`goal ${g.protein} g`} />
              <div className="stat"><b>{logged.length} / 7</b><span>days logged</span></div>
            </div>

            <section className="card">
              <div className="card-head"><h2>Calories by day</h2><span className="muted small">Tap a day</span></div>
              <div className="week" role="list">
                <div className="goal-line" style={{ bottom: `calc(26px + ${g.calories / maxCal} * (100% - 36px))` }}><span>goal</span></div>
                {days.map((d, i) => {
                  const t = totalsByDay[d];
                  const over = t.calories > g.calories;
                  return (
                    <button key={d} role="listitem" className={`day ${selected === d ? "sel" : ""}`} onClick={() => setSelected(d)}
                      aria-label={`${prettyDate(d)}: ${Math.round(t.calories)} kcal`}>
                      <div className="day-bar">
                        <span className={over ? "over" : ""} style={{ height: `${(t.calories / maxCal) * 100}%`, "--i": i }} />
                      </div>
                      <small>{prettyDate(d).split(",")[0]}</small>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
          {dayCard}
          {insightEntries && <WeekInsights entries={insightEntries} insight={weekInsights(insightEntries)} />}
        </div>
      )}
    </div>
  );
}
