import { Link } from "react-router-dom";
import { Droplets, Egg, Scale, UtensilsCrossed, X } from "lucide-react";
import { addWater } from "../lib/data";

const ICONS = { meal: UtensilsCrossed, water: Droplets, protein: Egg, weight: Scale };

// Time-of-day prompts on Today (see nudges() in lib/progress.js)
export default function Nudges({ items, uid, date, onDismiss }) {
  if (!items.length) return null;
  return (
    <div className="nudges">
      {items.map((n) => {
        const Icon = ICONS[n.kind];
        return (
          <div key={n.id} className={`nudge-card ${n.kind}`}>
            <Icon size={20} />
            <p>{n.text}</p>
            {n.to && <Link to={n.to} className="btn btn-primary small-btn nudge-act">{n.action}</Link>}
            {n.water && (
              <button className="btn btn-water small-btn nudge-act" onClick={() => addWater(uid, date, n.water)}>
                + {n.water} ml
              </button>
            )}
            <button className="btn btn-ghost icon nudge-close" onClick={() => onDismiss(n.id)} aria-label="Dismiss for today">
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
