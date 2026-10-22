export function todayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function lastNDays(n) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push(todayKey(d));
  }
  return out;
}

const keyToUtc = (key) => {
  const [y, m, d] = key.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};

export function addDays(key, n) {
  const [y, m, d] = key.split("-").map(Number);
  return todayKey(new Date(y, m - 1, d + n));
}

export const daysBetween = (a, b) => Math.round((keyToUtc(b) - keyToUtc(a)) / 86400000);

// Every date key from `from` to `to`, inclusive
export function dateRange(from, to) {
  const out = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  return out;
}

// Date keys for a "YYYY-MM" month, padded with nulls so day 1 sits under its weekday (weeks start Monday).
export function monthDays(monthKey) {
  const [y, m] = monthKey.split("-").map(Number);
  const lead = (new Date(y, m - 1, 1).getDay() + 6) % 7;
  const count = new Date(y, m, 0).getDate();
  return [
    ...Array(lead).fill(null),
    ...Array.from({ length: count }, (_, i) => todayKey(new Date(y, m - 1, i + 1))),
  ];
}

export function shiftMonth(monthKey, step) {
  const [y, m] = monthKey.split("-").map(Number);
  return todayKey(new Date(y, m - 1 + step, 1)).slice(0, 7);
}

// A day is finished when calories stay within the goal and protein and water goals are reached.
// Rounds the same way the Today screen does.
export function dayChecks(totals, waterMl, goals) {
  const cal = Math.round(totals.calories);
  const protein = Math.round(totals.protein);
  return [
    { label: "Calories", ok: cal > 0 && cal <= goals.calories, value: `${cal.toLocaleString("en-IN")} / ${goals.calories.toLocaleString("en-IN")} kcal` },
    { label: "Protein", ok: protein >= goals.protein, value: `${protein} / ${goals.protein} g` },
    { label: "Water", ok: waterMl >= goals.waterMl, value: `${(waterMl / 1000).toFixed(2)} / ${(goals.waterMl / 1000).toFixed(1)} L` },
  ];
}

export function prettyDate(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function guessMealType() {
  const h = new Date().getHours();
  if (h < 11) return "Breakfast";
  if (h < 16) return "Lunch";
  if (h < 19) return "Snack";
  return "Dinner";
}

export const sumTotals = (meals) =>
  meals.reduce(
    (t, m) => ({
      calories: t.calories + (m.totals?.calories || 0),
      protein: t.protein + (m.totals?.protein || 0),
      carbs: t.carbs + (m.totals?.carbs || 0),
      fat: t.fat + (m.totals?.fat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

export function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

// Shrink a photo before upload so it is fast on mobile data (max 1280px JPEG).
export function compressImage(file, maxSide = 1280, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          blob ? resolve(blob) : reject(new Error("Could not read this image"));
        },
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => reject(new Error("This file is not a supported image"));
    img.src = url;
  });
}
