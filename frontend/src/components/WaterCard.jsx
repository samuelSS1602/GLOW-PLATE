import { useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { addWater, setWater } from "../lib/data";
import { useCountUp, useMounted } from "../hooks/motion";

const GLASS = 250;

export default function WaterCard({ uid, date, ml, goalMl }) {
  const mounted = useMounted();
  // Glasses fill one after another when the card first appears, then instantly on taps
  const [intro, setIntro] = useState(true);
  useEffect(() => {
    const id = setTimeout(() => setIntro(false), 1500);
    return () => clearTimeout(id);
  }, []);
  const shown = useCountUp(ml);
  const pct = Math.min(1, ml / goalMl);
  const glasses = Math.ceil(goalMl / GLASS);
  const filled = Math.floor(ml / GLASS);

  return (
    <section className={`card water ${intro ? "intro" : ""}`}>
      <div className="card-head">
        <h2>Water</h2>
        <span className="water-num">
          <b>{(shown / 1000).toFixed(2)}</b> / {(goalMl / 1000).toFixed(1)} L
        </span>
      </div>

      <div className="glasses" aria-label={`${filled} of ${glasses} glasses`}>
        {Array.from({ length: glasses }).map((_, i) => (
          <button key={i} type="button" className={`glass ${mounted && i < filled ? "full" : ""}`} style={{ "--i": i }}
            onClick={() => setWater(uid, date, (i + 1) * GLASS)}
            aria-label={`Set to ${i + 1} glasses`} />
        ))}
      </div>

      <div className="water-actions">
        <button className="btn btn-ghost icon" onClick={() => setWater(uid, date, ml - GLASS)} aria-label="Remove a glass" disabled={ml <= 0}>
          <Minus size={18} />
        </button>
        <button className="btn btn-water" onClick={() => addWater(uid, date, GLASS)}>
          <Plus size={18} /> Glass · 250 ml
        </button>
        <button className="btn btn-water-soft" onClick={() => addWater(uid, date, 500)}>
          <Plus size={18} /> Bottle · 500 ml
        </button>
      </div>
      <p className="muted small">
        {pct >= 1 ? "Goal reached for today. Nice work." : `${((goalMl - ml) / 1000).toFixed(2)} L to go. Spread it across the day.`}
      </p>
    </section>
  );
}
