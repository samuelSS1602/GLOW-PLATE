import { useEffect, useRef, useState } from "react";
import { prettyDate, daysBetween } from "../lib/utils";

const H = 220;
const M = { top: 18, right: 64, bottom: 30, left: 38 };

// Round tick values (every 1, 2, 5 or 10 kg) covering lo..hi
function niceTicks(lo, hi) {
  const range = Math.max(hi - lo, 1);
  const step = range <= 4 ? 1 : range <= 10 ? 2 : range <= 25 ? 5 : 10;
  const ticks = [];
  for (let v = Math.floor(lo / step) * step; v <= Math.ceil(hi / step) * step + 1e-9; v += step) ticks.push(Math.round(v * 10) / 10);
  return ticks;
}

function shortDate(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

// Weight over time: one line, the latest value labelled at its end, a dashed healthy-weight
// reference, and a crosshair readout on hover or with the arrow keys.
export default function WeightChart({ entries, healthyMax }) {
  const wrap = useRef(null);
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState(null);

  useEffect(() => {
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(wrap.current);
    return () => ro.disconnect();
  }, []);

  const kgs = entries.map((e) => e.kg);
  const lo = Math.min(...kgs);
  const hi = Math.max(...kgs);
  // Only draw the healthy line when it's near enough not to flatten the data
  const showHealthy = healthyMax >= lo - 12 && healthyMax <= hi + 12;
  const ticks = niceTicks(Math.min(lo, showHealthy ? healthyMax : lo) - 0.5, Math.max(hi, showHealthy ? healthyMax : hi) + 0.5);
  const [y0, y1] = [ticks[0], ticks[ticks.length - 1]];
  const first = entries[0];
  const last = entries[entries.length - 1];
  const span = Math.max(1, daysBetween(first.date, last.date));
  const pw = Math.max(0, width - M.left - M.right);
  const ph = H - M.top - M.bottom;
  const x = (d) => (entries.length === 1 ? M.left + pw / 2 : M.left + (daysBetween(first.date, d) / span) * pw);
  const y = (kg) => M.top + (1 - (kg - y0) / (y1 - y0)) * ph;
  const pts = entries.map((e) => [x(e.date), y(e.kg)]);
  const path = pts.map(([px, py], i) => `${i ? "L" : "M"}${px.toFixed(1)},${py.toFixed(1)}`).join("");
  const [ex, ey] = pts[pts.length - 1];

  const nearest = (clientX) => {
    const mx = clientX - wrap.current.getBoundingClientRect().left;
    return pts.reduce((best, [px], i) => (Math.abs(px - mx) < Math.abs(pts[best][0] - mx) ? i : best), 0);
  };
  const onKey = (e) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      const step = e.key === "ArrowLeft" ? -1 : 1;
      setActive((i) => (i === null ? entries.length - 1 : Math.min(entries.length - 1, Math.max(0, i + step))));
    } else if (e.key === "Escape") {
      setActive(null);
    }
  };

  const a = active !== null ? entries[active] : null;
  return (
    <div className="wchart" ref={wrap} tabIndex={0} role="group" onKeyDown={onKey}
      onFocus={() => setActive((i) => i ?? entries.length - 1)} onBlur={() => setActive(null)}
      aria-label={`Weight from ${first.kg} kg on ${shortDate(first.date)} to ${last.kg} kg on ${shortDate(last.date)}. Use the left and right arrow keys to read each weigh-in.`}>
      {width > 0 && (
        <svg width={width} height={H} aria-hidden="true">
          {ticks.map((t) => (
            <g key={t}>
              <line className="wc-grid" x1={M.left} x2={width - M.right} y1={y(t)} y2={y(t)} />
              <text className="wc-tick" x={M.left - 8} y={y(t)} dy="0.32em" textAnchor="end">{t}</text>
            </g>
          ))}
          {showHealthy && (
            <g>
              <line className="wc-ref" x1={M.left} x2={width - M.right} y1={y(healthyMax)} y2={y(healthyMax)} />
              <text className="wc-ref-label" x={M.left + 6} y={y(healthyMax) - 6}>Healthy up to {Math.round(healthyMax)} kg</text>
            </g>
          )}
          {entries.length > 1 && <path className="wc-line" d={path} pathLength="1" />}
          <circle className="wc-dot" cx={ex} cy={ey} r="4.5" />
          <text className="wc-end" x={ex + 10} y={ey} dy="0.32em">{last.kg} kg</text>
          <text className="wc-x" x={M.left} y={H - 8}>{shortDate(first.date)}</text>
          {entries.length > 1 && <text className="wc-x" x={width - M.right} y={H - 8} textAnchor="end">{shortDate(last.date)}</text>}
          {a && (
            <g>
              <line className="wc-cross" x1={pts[active][0]} x2={pts[active][0]} y1={M.top} y2={H - M.bottom} />
              <circle className="wc-dot" cx={pts[active][0]} cy={pts[active][1]} r="5" />
            </g>
          )}
          <rect x={M.left - 12} y={0} width={pw + 24} height={H} fill="transparent"
            onPointerMove={(e) => setActive(nearest(e.clientX))} onPointerLeave={() => setActive(null)} />
        </svg>
      )}
      {a && (
        <div className="wc-tip" aria-hidden="true"
          style={{ left: Math.min(Math.max(pts[active][0], 56), width - 56), top: pts[active][1] }}>
          <b>{a.kg} kg</b><span>{prettyDate(a.date)}</span>
        </div>
      )}
      <p className="sr-only" aria-live="polite">{a ? `${a.kg} kg on ${prettyDate(a.date)}` : ""}</p>
    </div>
  );
}
