import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, ChevronDown, Pencil, Repeat2, UtensilsCrossed } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "./Toast";
import { deleteMeal, getMealPhoto, repeatMeal } from "../lib/data";
import { todayKey } from "../lib/utils";

export default function MealCard({ meal }) {
  const { user } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [photo, setPhoto] = useState(meal.imageUrl || null);
  const [busy, setBusy] = useState(false);
  const t = meal.totals || {};

  useEffect(() => {
    let live = true;
    getMealPhoto(user.uid, meal).then((p) => live && setPhoto(p)).catch(() => {});
    return () => { live = false; };
  }, [user.uid, meal.id, meal.hasPhoto, meal.imageUrl]);

  const again = async () => {
    setBusy(true);
    try {
      await repeatMeal(user.uid, meal, todayKey());
      toast(`Added to today's ${meal.mealType.toLowerCase()}`);
    } catch (e) { toast(`Couldn't add it: ${e.message}`, "error"); }
    finally { setBusy(false); }
  };

  const remove = async () => {
    if (!confirm("Delete this meal and its photo?")) return;
    try {
      await deleteMeal(user.uid, meal);
      toast("Meal deleted");
    } catch (e) { toast(`Couldn't delete it: ${e.message}`, "error"); }
  };

  return (
    <article className={`meal ${open ? "open" : ""}`}>
      <button className="meal-main" onClick={() => setOpen(!open)} aria-expanded={open}>
        {photo
          ? <img src={photo} alt={meal.summary || meal.mealType} />
          : <span className="meal-thumb" aria-hidden="true"><UtensilsCrossed size={24} /></span>}
        <div className="meal-info">
          <span className="meal-type">{meal.mealType}</span>
          <span className="meal-name">{meal.summary || meal.items?.map((i) => i.name).join(", ")}</span>
          <span className="meal-macros">
            <b>{Math.round(t.calories)} kcal</b>
            <span className="tag-p">P {Math.round(t.protein)}g</span>
            <span>C {Math.round(t.carbs)}g</span>
            <span>F {Math.round(t.fat)}g</span>
          </span>
        </div>
        <ChevronDown size={18} className="chev" />
      </button>

      {open && (
        <div className="meal-detail">
          <table className="items">
            <thead><tr><th>Item</th><th>kcal</th><th>P</th><th>C</th><th>F</th></tr></thead>
            <tbody>
              {meal.items?.map((it, i) => (
                <tr key={i}>
                  <td>{it.name}<small>{it.portion}</small></td>
                  <td>{Math.round(it.calories)}</td><td>{Math.round(it.protein)}</td>
                  <td>{Math.round(it.carbs)}</td><td>{Math.round(it.fat)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {meal.tips?.length > 0 && (
            <ul className="tips">{meal.tips.map((tip, i) => <li key={i}>{tip}</li>)}</ul>
          )}
          <div className="meal-actions">
            <button className="btn btn-ghost small-btn" onClick={() => nav(`/meal/${meal.id}`)}>
              <Pencil size={16} /> Edit
            </button>
            <button className="btn btn-ghost small-btn" onClick={again} disabled={busy}>
              <Repeat2 size={16} /> {busy ? "Adding…" : "Add again today"}
            </button>
            <button className="btn btn-ghost danger small-btn" onClick={remove}>
              <Trash2 size={16} /> Delete
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
