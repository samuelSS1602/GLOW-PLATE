import { useCountUp, useMounted } from "../hooks/motion";

// The "plate": calories eaten as the outer ring, with protein / carbs / fat
// drawn as three arcs on the inner rim, like portions on a thali.
const C = 2 * Math.PI;

function Arc({ r, start, sweep, fill, color, width }) {
  const len = r * sweep;
  const filled = len * Math.min(1, fill);
  return (
    <>
      <circle r={r} fill="none" stroke="var(--rim)" strokeWidth={width}
        strokeDasharray={`${len} ${r * C}`} transform={`rotate(${(start * 180) / Math.PI})`}
        strokeLinecap="round" />
      {/* Always drawn (hidden while empty) so the arc can grow from zero */}
      <circle r={r} fill="none" stroke={color} strokeWidth={width} className="arc-anim"
        strokeDasharray={`${filled} ${r * C}`} transform={`rotate(${(start * 180) / Math.PI})`}
        strokeLinecap="round" opacity={fill > 0 ? 1 : 0} />
    </>
  );
}

export default function PlateRing({ eaten, goals }) {
  const mounted = useMounted();
  const shownLeft = useCountUp(goals.calories - eaten.calories);
  const shownEaten = useCountUp(eaten.calories);
  const calPct = goals.calories && mounted ? eaten.calories / goals.calories : 0;
  const left = Math.round(goals.calories - eaten.calories);
  const over = left < 0;
  const gap = 0.16;
  const seg = C / 3 - gap;
  const base = -Math.PI / 2 + gap / 2;
  const part = (v, goal) => (mounted ? v / goal : 0);

  return (
    <div className="plate">
      <svg viewBox="-110 -110 220 220" role="img"
        aria-label={`${Math.round(eaten.calories)} of ${goals.calories} kcal eaten`}>
        <circle r="104" fill="var(--plate)" />
        <circle r="92" fill="none" stroke="var(--rim)" strokeWidth="11" />
        <circle r="92" fill="none" stroke={over ? "var(--chili)" : "var(--leaf)"} strokeWidth="11"
          strokeLinecap="round" className="arc-anim" opacity={calPct > 0 ? 1 : 0}
          strokeDasharray={`${Math.min(calPct, 1) * 92 * C} ${92 * C}`} transform="rotate(-90)" />
        <Arc r={74} start={base} sweep={seg} fill={part(eaten.protein, goals.protein)} color="var(--turmeric)" width={7} />
        <Arc r={74} start={base + seg + gap} sweep={seg} fill={part(eaten.carbs, goals.carbs)} color="var(--ragi)" width={7} />
        <Arc r={74} start={base + 2 * (seg + gap)} sweep={seg} fill={part(eaten.fat, goals.fat)} color="var(--coconut)" width={7} />
      </svg>
      <div className="plate-center">
        <span className="plate-num">{Math.abs(Math.round(shownLeft)).toLocaleString("en-IN")}</span>
        <span className="plate-label">{over ? "kcal over" : "kcal left"}</span>
        <span className="plate-sub">{Math.round(shownEaten).toLocaleString("en-IN")} / {goals.calories.toLocaleString("en-IN")}</span>
      </div>
    </div>
  );
}
