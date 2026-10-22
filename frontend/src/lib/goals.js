// Daily goal calculator (Mifflin-St Jeor). Same method used in your diet plan PDF.

export const ACTIVITY = {
  sedentary: { label: "Desk job, little exercise", factor: 1.2 },
  light: { label: "Light activity, walks 1-3 days", factor: 1.375 },
  moderate: { label: "Workout 3-5 days a week", factor: 1.55 },
  active: { label: "Hard workout 6-7 days a week", factor: 1.725 },
};

export const GOAL = {
  lose: { label: "Lose fat", delta: -500, proteinPerKg: 1.6 },
  maintain: { label: "Stay the same", delta: 0, proteinPerKg: 1.4 },
  gain: { label: "Build muscle", delta: 300, proteinPerKg: 1.8 },
};

// Starting profile from your plan: 87 kg, 176 cm, 22 years, fat loss
export const DEFAULT_PROFILE = {
  name: "",
  sex: "male",
  age: 22,
  weightKg: 87,
  heightCm: 176,
  activity: "light",
  goal: "lose",
};

const round = (n, step) => Math.round(n / step) * step;

export function bmi(weightKg, heightCm) {
  const m = heightCm / 100;
  return weightKg / (m * m);
}

export function calculateGoals(p) {
  const w = Number(p.weightKg);
  const h = Number(p.heightCm);
  const a = Number(p.age);
  const bmr = 10 * w + 6.25 * h - 5 * a + (p.sex === "female" ? -161 : 5);
  const tdee = bmr * (ACTIVITY[p.activity]?.factor ?? 1.375);
  const goal = GOAL[p.goal] ?? GOAL.lose;

  const calories = round(tdee + goal.delta, 50);
  const protein = round(w * goal.proteinPerKg, 5);
  const fat = round((calories * 0.25) / 9, 5);
  const carbs = round((calories - protein * 4 - fat * 9) / 4, 5);
  // ~35 ml per kg, plus 500 ml for active people
  const extra = p.activity === "moderate" || p.activity === "active" ? 500 : 0;
  const waterMl = round(w * 35 + extra, 250);

  return {
    maintenance: round(tdee, 50),
    calories,
    protein,
    carbs,
    fat,
    waterMl,
  };
}
