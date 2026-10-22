import { dayChecks, sumTotals, todayKey, daysBetween } from "./utils";

export const STREAK_WINDOW = 60;

// Days before sign-up don't count as missed. A brand-new account may still hold the
// unsaved server timestamp, so it joined today.
export function joinedKey(userData, today) {
  const c = userData.createdAt;
  return c?.toDate ? todayKey(c.toDate()) : c ? today : "";
}

// "done" (all goals hit), "missed" (logged but a goal missed), "empty" (nothing logged),
// "today" (still in progress), "before" (before sign-up) or "future".
export function dayStatus({ date, today, joined, meals, waterMl, goals }) {
  if (date > today) return "future";
  if (!meals.length && !waterMl) return date === today ? "today" : date < joined ? "before" : "empty";
  if (dayChecks(sumTotals(meals), waterMl, goals).every((c) => c.ok)) return "done";
  return date === today ? "today" : "missed";
}

// `statuses` run oldest to newest and end with today. The current streak ends today, or
// yesterday while today is still in progress; `best` is the longest run in the window.
export function streaks(statuses) {
  let best = 0;
  let run = 0;
  statuses.forEach((s) => { run = s === "done" ? run + 1 : 0; best = Math.max(best, run); });
  let i = statuses.length - 1;
  if (statuses[i] !== "done") i--;
  let current = 0;
  while (i >= 0 && statuses[i] === "done") { current++; i--; }
  return { current, best };
}

const plural = (n) => `${n} ${n === 1 ? "day" : "days"}`;
const TIPS = {
  Calories: (n) => `Calories were off target on ${plural(n)}. Keep rice and oil in check at dinner, and log every meal so the count is right.`,
  Protein: (n) => `Protein fell short on ${plural(n)}. Add 2–3 eggs, paneer or sundal to breakfast and a protein snack around 4 PM.`,
  Water: (n) => `Water fell short on ${plural(n)}. Keep a 1 L bottle at your desk and finish it by lunch.`,
};
const FOCUS_ORDER = ["Protein", "Water", "Calories"]; // breaks ties

// `entries` are the completed days as [{ date, status, checks }] (checks from dayChecks).
export function weekInsights(entries) {
  const counted = entries.filter((e) => e.status !== "before");
  const hits = Object.fromEntries(FOCUS_ORDER.map((t) => [t, counted.filter((e) => e.checks.find((c) => c.label === t)?.ok).length]));
  const worst = FOCUS_ORDER.map((t) => ({ label: t, misses: counted.length - hits[t] }))
    .sort((a, b) => b.misses - a.misses)[0];
  return {
    days: counted.length,
    finished: counted.filter((e) => e.status === "done").length,
    hits,
    focus: worst.misses > 0 ? { ...worst, tip: TIPS[worst.label](worst.misses) } : null,
  };
}

const MEAL_DUE = [["Breakfast", 10.5], ["Lunch", 14.5], ["Dinner", 21]];
const amount = (ml) => (ml >= 1000 ? `${parseFloat((ml / 1000).toFixed(2))} L` : `${ml} ml`);

// Prompts for the Today screen, most useful first.
export function nudges({ now, today, meals, waterMl, totals, goals, lastWeighIn }) {
  const h = now.getHours() + now.getMinutes() / 60;
  const out = [];

  const logged = new Set(meals.map((m) => m.mealType));
  const due = MEAL_DUE.filter(([type, at]) => h >= at && !logged.has(type)).pop();
  if (due) {
    const [type] = due;
    out.push({ id: `meal-${type}`, kind: "meal", text: `${type} isn't logged yet.`, action: `Add ${type.toLowerCase()}`, to: `/add?type=${type}` });
  }

  // Water spread evenly from 7 AM to 10 PM
  const behind = goals.waterMl * Math.min(1, Math.max(0, (h - 7) / 15)) - waterMl;
  if (behind > 500) {
    out.push({ id: "water", kind: "water", text: `You're ${amount(Math.round(behind / 250) * 250)} behind on water. Have a glass now.`, water: 250 });
  }

  if (h >= 18 && totals.protein < goals.protein * 0.6) {
    out.push({ id: "protein", kind: "protein", text: `Protein is low today: ${Math.round(goals.protein - totals.protein)} g to go. Eggs, paneer, chicken or sundal at dinner will close the gap.` });
  }

  // Mornings only; a first weigh-in is suggested on Mondays so it doesn't nag every day
  const since = lastWeighIn ? daysBetween(lastWeighIn, today) : null;
  if (h < 11 && (since === null ? now.getDay() === 1 : since >= 7)) {
    out.push({
      id: "weight", kind: "weight", action: "Log weight", to: "/history?view=weight",
      text: since === null
        ? "Weigh yourself before breakfast to start tracking your progress."
        : `It's been ${since} days since you last weighed in. Step on the scale before breakfast.`,
    });
  }
  return out;
}
