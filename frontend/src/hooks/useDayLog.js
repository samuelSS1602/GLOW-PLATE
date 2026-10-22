import { useEffect, useMemo, useState } from "react";
import { watchMealsBetween, watchWaterBetween } from "../lib/data";
import { sumTotals } from "../lib/utils";

const NONE = [];

// Live meals and water for every day from `from` to `to` (inclusive date keys).
export function useDayLog(uid, from, to) {
  const [meals, setMeals] = useState(null);
  const [water, setWater] = useState(null);

  useEffect(() => {
    setMeals(null);
    return watchMealsBetween(uid, from, to, setMeals);
  }, [uid, from, to]);
  useEffect(() => {
    setWater(null);
    return watchWaterBetween(uid, from, to, setWater);
  }, [uid, from, to]);

  return useMemo(() => {
    const byDay = {};
    (meals || NONE).forEach((m) => { (byDay[m.date] = byDay[m.date] || []).push(m); });
    return {
      ready: Boolean(meals && water),
      mealsOn: (d) => byDay[d] || NONE,
      totalsOn: (d) => sumTotals(byDay[d] || NONE),
      waterOn: (d) => water?.[d] || 0,
    };
  }, [meals, water]);
}
