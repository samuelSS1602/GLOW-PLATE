import { useEffect, useRef, useState } from "react";

export const prefersLessMotion = () =>
  typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

// Animates a number from where it was (0 on first render) to `value`, easing out.
export function useCountUp(value, ms = 650) {
  const start = prefersLessMotion() ? value : 0;
  const [shown, setShown] = useState(start);
  const current = useRef(start);

  useEffect(() => {
    if (prefersLessMotion()) { current.current = value; setShown(value); return; }
    const from = current.current;
    const t0 = performance.now();
    let raf;
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / ms);
      current.current = from + (value - from) * (1 - (1 - p) ** 3);
      setShown(current.current);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, ms]);

  return shown;
}

// False for the first painted frame, then true, so CSS transitions can grow things from empty.
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    let raf = requestAnimationFrame(() => { raf = requestAnimationFrame(() => setMounted(true)); });
    return () => cancelAnimationFrame(raf);
  }, []);
  return mounted;
}
