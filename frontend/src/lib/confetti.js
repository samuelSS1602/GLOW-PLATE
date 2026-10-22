import { prefersLessMotion } from "../hooks/motion";

const COLORS = ["var(--leaf)", "var(--turmeric)", "var(--ragi)", "var(--coconut)", "var(--water)"];

// A short burst of paper confetti falling from the top of the screen.
export function confetti({ count = 70, colors = COLORS } = {}) {
  if (prefersLessMotion()) return;
  const layer = document.createElement("div");
  layer.className = "confetti";
  layer.setAttribute("aria-hidden", "true");
  for (let i = 0; i < count; i++) {
    const p = document.createElement("i");
    p.style.left = `${Math.random() * 100}%`;
    p.style.width = `${6 + Math.random() * 6}px`;
    p.style.height = `${9 + Math.random() * 9}px`;
    p.style.background = colors[i % colors.length];
    p.style.setProperty("--x", `${(Math.random() - 0.5) * 240}px`);
    p.style.setProperty("--r", `${(Math.random() - 0.5) * 1440}deg`);
    p.style.animationDuration = `${1.7 + Math.random() * 1.3}s`;
    p.style.animationDelay = `${Math.random() * 0.3}s`;
    layer.appendChild(p);
  }
  document.body.appendChild(layer);
  setTimeout(() => layer.remove(), 3500);
}

// True the first time `kind` happens on `date` on this device, so each win is celebrated once.
export function firstTimeToday(kind, date) {
  try {
    const KEY = "glowplate:celebrated";
    const saved = JSON.parse(localStorage.getItem(KEY) || "{}");
    const kinds = saved.date === date ? saved.kinds : [];
    if (kinds.includes(kind)) return false;
    localStorage.setItem(KEY, JSON.stringify({ date, kinds: [...kinds, kind] }));
    return true;
  } catch {
    return false;
  }
}
