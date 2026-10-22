import { useState } from "react";
import { prefersLessMotion } from "./motion";

const KEY = "glowplate:theme";
const BAR = { light: "#1d4d36", dark: "#0f1a14" };

function readTheme() {
  try { return localStorage.getItem(KEY) || "auto"; } catch { return "auto"; }
}

// "auto" follows the phone/laptop setting; "light" and "dark" override it on this device.
// index.html applies the saved choice before the first paint, so there's no flash.
export function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === "auto") delete root.dataset.theme;
  else root.dataset.theme = theme;
  const dark = theme === "dark" || (theme === "auto" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? BAR.dark : BAR.light);
}

export function useTheme() {
  const [theme, setTheme] = useState(readTheme);
  const choose = (next) => {
    if (!prefersLessMotion()) {
      document.documentElement.classList.add("theme-fade");
      setTimeout(() => document.documentElement.classList.remove("theme-fade"), 450);
    }
    applyTheme(next);
    try { next === "auto" ? localStorage.removeItem(KEY) : localStorage.setItem(KEY, next); } catch { /* not remembered */ }
    setTheme(next);
  };
  return [theme, choose];
}
