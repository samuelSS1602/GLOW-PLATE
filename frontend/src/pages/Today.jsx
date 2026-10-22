import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Camera, Flame } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useDayLog } from "../hooks/useDayLog";
import { useNow } from "../hooks/useNow";
import { useCountUp } from "../hooks/motion";
import { useToast } from "../components/Toast";
import { watchWeights } from "../lib/data";
import { todayKey, greeting, addDays, dateRange } from "../lib/utils";
import { dayStatus, joinedKey, streaks, nudges, STREAK_WINDOW } from "../lib/progress";
import { confetti, firstTimeToday } from "../lib/confetti";
import PlateRing from "../components/PlateRing";
import MacroRow from "../components/MacroRow";
import WaterCard from "../components/WaterCard";
import MealCard from "../components/MealCard";
import Nudges from "../components/Nudges";

const DISMISSED = "glowplate:nudges";
function readDismissed(date) {
  try {
    const saved = JSON.parse(localStorage.getItem(DISMISSED) || "{}");
    return saved.date === date ? saved.ids : [];
  } catch { return []; }
}

export default function Today() {
  const { user, userData } = useAuth();
  const toast = useToast();
  const goals = userData.goals;
  const now = useNow();
  const date = todayKey(now);
  const from = addDays(date, -(STREAK_WINDOW - 1));
  const log = useDayLog(user.uid, from, date);
  const [weights, setWeights] = useState(null);
  const [dismissed, setDismissed] = useState(() => readDismissed(date));

  useEffect(() => watchWeights(user.uid, setWeights), [user.uid]);
  useEffect(() => setDismissed(readDismissed(date)), [date]);

  const meals = log.mealsOn(date);
  const water = log.waterOn(date);
  const eaten = log.totalsOn(date);
  const proteinLeft = Math.max(0, Math.round(goals.protein - eaten.protein));

  // Status of each day in the streak window, oldest first, ending today
  const joined = joinedKey(userData, date);
  const statuses = useMemo(() => (log.ready
    ? dateRange(from, date).map((d) => dayStatus({ date: d, today: date, joined, meals: log.mealsOn(d), waterMl: log.waterOn(d), goals }))
    : null), [log, from, date, joined, goals]);
  const streak = statuses && streaks(statuses);
  const streakShown = Math.round(useCountUp(streak?.current || 0));
  const finished = statuses?.[statuses.length - 1] === "done";
  const waterDone = log.ready && water >= goals.waterMl;

  // Celebrate each win once per day on this device
  useEffect(() => {
    if (finished && firstTimeToday("day", date)) {
      firstTimeToday("water", date);
      confetti();
      toast(`Day finished! ${streak.current}-day streak`, "flame");
    } else if (waterDone && firstTimeToday("water", date)) {
      confetti({ count: 45, colors: ["var(--water)", "#8cc3ee", "var(--leaf)"] });
      toast("Water goal reached", "water");
    }
  }, [finished, waterDone, date]);

  const lastWeighIn = weights?.length ? weights[weights.length - 1].date : null;
  const prompts = log.ready && weights
    ? nudges({ now, today: date, meals, waterMl: water, totals: eaten, goals, lastWeighIn })
      .filter((n) => !dismissed.includes(n.id))
      .slice(0, 2)
    : [];
  const dismiss = (id) => {
    const ids = [...dismissed, id];
    setDismissed(ids);
    try { localStorage.setItem(DISMISSED, JSON.stringify({ date, ids })); } catch { /* not remembered */ }
  };

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="muted">{now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</p>
          <h1>{greeting()}{userData.profile?.name ? `, ${userData.profile.name}` : ""}</h1>
          {streak && (
            <Link to="/history" className={`streak ${streak.current ? "on" : ""}`}>
              <Flame size={16} />
              {streak.current
                ? <span><b>{streakShown}{streak.current >= STREAK_WINDOW ? "+" : ""}</b>-day streak</span>
                : <span>Finish today's goals to start a streak</span>}
              {streak.best > streak.current && <span className="streak-best">best {streak.best}</span>}
            </Link>
          )}
        </div>
        <Link to="/add" className="btn btn-primary hide-mobile"><Camera size={18} /> Add a meal</Link>
      </header>

      <Nudges items={prompts} uid={user.uid} date={date} onDismiss={dismiss} />

      <div className="today-grid">
        <section className="card hero-card">
          <PlateRing eaten={eaten} goals={goals} />
          <div className="macros">
            <MacroRow label="Protein" value={eaten.protein} goal={goals.protein} color="var(--turmeric)" />
            <MacroRow label="Carbs" value={eaten.carbs} goal={goals.carbs} color="var(--ragi)" />
            <MacroRow label="Fat" value={eaten.fat} goal={goals.fat} color="var(--coconut)" />
            <p className="nudge">
              {proteinLeft > 0
                ? <>You need <b>{proteinLeft} g more protein</b> today. Eggs, chicken, paneer or sundal will get you there.</>
                : <>Protein goal done for today. Good for muscle, skin and hair.</>}
            </p>
          </div>
        </section>

        <WaterCard uid={user.uid} date={date} ml={water} goalMl={goals.waterMl} />

        <section className="card meals-card">
          <div className="card-head">
            <h2>Meals today</h2>
            <span className="muted small">{meals.length} logged</span>
          </div>
          {!log.ready && <div className="spinner sm" />}
          {log.ready && meals.length === 0 && (
            <Link to="/add" className="empty-cta">
              <Camera size={28} />
              <span><b>Log your first meal</b><br />Take a photo of your plate, or type what you ate, and get the calories and protein in seconds.</span>
            </Link>
          )}
          <div className="meal-list">
            {meals.map((m) => <MealCard key={m.id} meal={m} />)}
          </div>
        </section>
      </div>
    </div>
  );
}
