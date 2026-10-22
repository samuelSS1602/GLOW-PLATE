import { useCountUp, useMounted } from "../hooks/motion";

export default function MacroRow({ label, value, goal, unit = "g", color }) {
  const mounted = useMounted();
  const shown = Math.round(useCountUp(value));
  const pct = goal && mounted ? Math.min(100, (value / goal) * 100) : 0;
  return (
    <div className="macro">
      <div className="macro-top">
        <span className="macro-label"><i style={{ background: color }} />{label}</span>
        <span className="macro-val">
          <b>{shown}</b> / {goal} {unit}
        </span>
      </div>
      <div className="bar"><span style={{ width: `${pct}%`, background: color }} /></div>
    </div>
  );
}
