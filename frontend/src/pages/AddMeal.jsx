import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Camera, ImagePlus, Minus, Plus, Search, Sparkles, Trash2, X } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useCountUp } from "../hooks/motion";
import { useDayLog } from "../hooks/useDayLog";
import { useToast } from "../components/Toast";
import { analyzeMeal } from "../lib/api";
import { saveMeal, updateMeal, deleteMeal, getMeal, getMealPhoto } from "../lib/data";
import { addDays, compressImage, dateRange, guessMealType, todayKey } from "../lib/utils";
import { CATEGORIES, FOODS, findFood, fmtQty, foodForItem, mealTips, scaleFood, searchFoods, stepFor, summarize } from "../lib/foods";

// The AI estimate needs Anthropic credits on the backend, so it stays hidden unless switched on
const AI_ENABLED = import.meta.env.VITE_ENABLE_AI === "true";
const TYPES = ["Breakfast", "Lunch", "Snack", "Dinner"];
const NUM = ["calories", "protein", "carbs", "fat"];
const LABEL = { calories: "kcal", protein: "Protein g", carbs: "Carbs g", fat: "Fat g" };
const START_CATEGORY = { Breakfast: "tiffin", Lunch: "rice", Snack: "snacks", Dinner: "tiffin" };
const RECENT_DAYS = 14;

let lastKey = 0;
const newKey = () => `item-${++lastKey}`;

const sumItems = (items) => items.reduce(
  (t, it) => Object.fromEntries(NUM.map((k) => [k, t[k] + (Number(it[k]) || 0)])),
  { calories: 0, protein: 0, carbs: 0, fat: 0 }
);

function Total({ value, unit = "", label, pct, className }) {
  const shown = Math.round(useCountUp(value));
  return (
    <div className={className}>
      <b>{shown}{unit}</b><span>{label}</span>
      {pct !== undefined && <small>{pct}% of day</small>}
    </div>
  );
}

function Stepper({ qty, name, onStep }) {
  return (
    <div className="stepper">
      <button type="button" onClick={() => onStep(-1)} aria-label={`Less ${name}`}><Minus size={16} /></button>
      <span aria-live="polite">{fmtQty(qty)}</span>
      <button type="button" onClick={() => onStep(1)} aria-label={`More ${name}`}><Plus size={16} /></button>
    </div>
  );
}

// /meal/:id opens a saved meal in the same screen
export function EditMeal() {
  const { id } = useParams();
  return <AddMeal key={id} editId={id} />;
}

export default function AddMeal({ editId }) {
  const { user, userData } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const cameraRef = useRef();
  const galleryRef = useRef();
  const today = todayKey();

  const [items, setItems] = useState([]);
  const [mealType, setMealType] = useState(() => (TYPES.includes(params.get("type")) ? params.get("type") : guessMealType()));
  const [date, setDate] = useState(today);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(null);
  const [blob, setBlob] = useState(null);
  const [preview, setPreview] = useState("");
  const [note, setNote] = useState("");
  const [aiTips, setAiTips] = useState([]);
  const [status, setStatus] = useState(editId ? "loading" : "idle"); // idle | loading | analyzing | saving
  const [error, setError] = useState("");

  // Edit mode: load the saved meal; foods from the list get their steppers back
  useEffect(() => {
    if (!editId) return;
    let live = true;
    (async () => {
      try {
        const meal = await getMeal(user.uid, editId);
        if (!live) return;
        if (!meal) throw new Error("This meal no longer exists.");
        setMealType(meal.mealType);
        setDate(meal.date);
        setItems((meal.items || []).map((it) => {
          const food = it.foodId && findFood(it.foodId);
          return { key: newKey(), ...(food ? scaleFood(food, it.qty || 1) : { ...it, foodId: null, qty: null }) };
        }));
        setStatus("idle");
        const photo = await getMealPhoto(user.uid, meal).catch(() => null);
        if (live && photo) setPreview(photo);
      } catch (err) {
        if (live) { setError(err.message); setStatus("idle"); }
      }
    })();
    return () => { live = false; };
  }, [editId, user.uid]);

  // The foods you logged most in the last two weeks
  const recentFrom = addDays(today, -(RECENT_DAYS - 1));
  const recentLog = useDayLog(user.uid, recentFrom, today);
  const recent = useMemo(() => {
    const count = {};
    dateRange(recentFrom, today).forEach((d) => recentLog.mealsOn(d).forEach((m) => (m.items || []).forEach((it) => {
      const food = foodForItem(it);
      if (food) count[food.id] = (count[food.id] || 0) + 1;
    })));
    return Object.keys(count).sort((a, b) => count[b] - count[a]).slice(0, 12).map(findFood);
  }, [recentLog, recentFrom, today]);

  const chips = recent.length ? [["recent", "Recent"], ...CATEGORIES] : CATEGORIES;
  const activeCategory = category || (recent.length ? "recent" : START_CATEGORY[mealType]);
  const searching = query.trim().length > 0;
  const list = searching
    ? searchFoods(query)
    : activeCategory === "recent" ? recent : FOODS.filter((f) => f.cat === activeCategory);

  const back = () => nav(window.history.state?.idx > 0 ? -1 : "/");
  const qtyOf = (food) => items.find((it) => it.foodId === food.id)?.qty || 0;

  // Adds a portion of a food (dir 1) or takes one away (dir -1); at zero it leaves the meal
  const changeFood = (food, dir) => setItems((list) => {
    const current = list.find((it) => it.foodId === food.id);
    if (!current) return dir > 0 ? [...list, { key: newKey(), ...scaleFood(food, 1) }] : list;
    const qty = Math.round((current.qty + dir * stepFor(food)) * 2) / 2;
    return qty > 0
      ? list.map((it) => (it === current ? { ...it, ...scaleFood(food, qty) } : it))
      : list.filter((it) => it !== current);
  });
  const addOwn = (name = "") =>
    setItems((list) => [...list, { key: newKey(), foodId: null, qty: null, name, portion: "", calories: 0, protein: 0, carbs: 0, fat: 0 }]);
  const editItem = (key, field, val) => setItems((list) => list.map((it) => (it.key === key ? { ...it, [field]: val } : it)));
  const removeItem = (key) => setItems((list) => list.filter((it) => it.key !== key));

  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError("");
    try {
      const small = await compressImage(file);
      if (blob) URL.revokeObjectURL(preview);
      setBlob(small);
      setPreview(URL.createObjectURL(small));
    } catch (err) { setError(err.message); }
  };
  const removePhoto = () => { URL.revokeObjectURL(preview); setBlob(null); setPreview(""); };

  const estimate = async () => {
    if (!blob && !note.trim()) { setError("Add a photo or describe what you ate first."); return; }
    setStatus("analyzing"); setError("");
    try {
      const data = await analyzeMeal(blob, note.trim());
      if (!data.items?.length) throw new Error("No food was found. Try a clearer photo or a little more detail.");
      setItems((list) => [...list, ...data.items.map((it) => ({ key: newKey(), foodId: null, qty: null, ...it }))]);
      setAiTips(data.tips || []);
    } catch (err) { setError(err.message); }
    finally { setStatus("idle"); }
  };

  const named = items.filter((it) => String(it.name).trim());
  const totals = sumItems(items);
  const tips = aiTips.length ? aiTips : mealTips(named);

  const save = async () => {
    if (!named.length) { setError("Add at least one food."); return; }
    setStatus("saving"); setError("");
    try {
      const clean = named.map((it) => {
        const out = {
          name: String(it.name).trim(),
          portion: String(it.portion || "").trim(),
          ...Object.fromEntries(NUM.map((k) => [k, Math.round((Number(it[k]) || 0) * 10) / 10])),
        };
        if (it.foodId) Object.assign(out, { foodId: it.foodId, qty: it.qty });
        return out;
      });
      const fields = { date, mealType, items: clean, totals: sumItems(clean), tips, summary: summarize(clean) };
      if (editId) {
        await updateMeal(user.uid, editId, fields);
        toast("Meal updated");
        back();
      } else {
        await saveMeal(user.uid, { photo: blob, ...fields });
        toast("Meal saved");
        nav("/");
      }
    } catch (err) { setError(`Couldn't save: ${err.message}`); setStatus("idle"); }
  };

  const remove = async () => {
    if (!confirm("Delete this meal and its photo?")) return;
    try {
      await deleteMeal(user.uid, { id: editId });
      toast("Meal deleted");
      back();
    } catch (err) { setError(`Couldn't delete: ${err.message}`); }
  };

  const g = userData.goals;

  if (status === "loading") {
    return <div className="page narrow"><header className="page-head"><h1>Edit meal</h1></header><section className="card"><div className="spinner sm" /></section></div>;
  }
  if (editId && !items.length && error) {
    return (
      <div className="page narrow">
        <header className="page-head"><h1>Edit meal</h1></header>
        <section className="card"><p className="error">{error}</p><button className="btn btn-ghost" onClick={back}>Go back</button></section>
      </div>
    );
  }

  return (
    <div className={`page add-page ${editId ? "editing" : ""}`}>
      <header className="page-head">
        <h1>{editId ? "Edit meal" : "Add a meal"}</h1>
      </header>

      <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={pick} />
      <input ref={galleryRef} type="file" accept="image/*" hidden onChange={pick} />

      <div className="add-layout">
        <section className="card">
          <label className="search">
            <Search size={18} />
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Search: idli, chicken curry, banana…" aria-label="Search foods" />
            {searching && (
              <button type="button" className="search-clear" onClick={() => setQuery("")} aria-label="Clear search"><X size={16} /></button>
            )}
          </label>

          {!searching && (
            <div className="chips" role="tablist" aria-label="Food groups">
              {chips.map(([k, label]) => (
                <button type="button" key={k} role="tab" aria-selected={activeCategory === k}
                  className={`chip ${activeCategory === k ? "on" : ""}`} onClick={() => setCategory(k)}>{label}</button>
              ))}
            </div>
          )}

          <ul className="pick-list" key={searching ? "search" : activeCategory}>
            {list.map((food) => {
              const qty = qtyOf(food);
              return (
                <li key={food.id} className={`pick-row ${qty ? "picked" : ""}`}>
                  <div className="pick-info">
                    <b>{food.name}</b>
                    <span>{food.portion} · {food.cal} kcal · {food.p} g protein</span>
                  </div>
                  {qty ? (
                    <Stepper qty={qty} name={food.name} onStep={(d) => changeFood(food, d)} />
                  ) : (
                    <button type="button" className="btn btn-ghost icon" onClick={() => changeFood(food, 1)} aria-label={`Add ${food.name}`}>
                      <Plus size={18} />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
          {searching && !list.length && <p className="muted">No match for “{query.trim()}”.</p>}
          <button type="button" className="link-btn" onClick={() => addOwn(searching && !list.length ? query.trim() : "")}>
            <Plus size={16} /> {searching && !list.length ? `Add “${query.trim()}” as your own food` : "Add your own food"}
          </button>
          <p className="muted small">Typical home portions. Change the amounts, or add oil and ghee, if yours were different.</p>
        </section>

        <div className="add-side">
          <section className="card">
            <div className="card-head">
              <h2>Your meal</h2>
              <span className="muted small">{named.length} item{named.length === 1 ? "" : "s"}</span>
            </div>
            <div className="field-row">
              <label className="field">
                <span>Meal</span>
                <select value={mealType} onChange={(e) => setMealType(e.target.value)}>
                  {TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </label>
              <label className="field">
                <span>Date</span>
                <input type="date" value={date} max={today} onChange={(e) => setDate(e.target.value)} />
              </label>
            </div>

            <div className="result-totals">
              <Total value={totals.calories} label="kcal" pct={Math.round((totals.calories / g.calories) * 100)} />
              <Total className="t-p" value={totals.protein} unit="g" label="protein" pct={Math.round((totals.protein / g.protein) * 100)} />
              <Total value={totals.carbs} unit="g" label="carbs" />
              <Total value={totals.fat} unit="g" label="fat" />
            </div>

            {items.length === 0 ? (
              <p className="muted">Nothing added yet. Search for a food or pick one from the list.</p>
            ) : (
              <ul className="meal-items">
                {items.map((it) => (it.foodId ? (
                  <li key={it.key} className="meal-item">
                    <div className="pick-info">
                      <b>{it.name}</b>
                      <span>{it.portion} · {Math.round(it.calories)} kcal · {Math.round(it.protein)} g protein</span>
                    </div>
                    <Stepper qty={it.qty} name={it.name} onStep={(d) => changeFood(findFood(it.foodId), d)} />
                  </li>
                ) : (
                  <li key={it.key} className="edit-item">
                    <div className="edit-name">
                      <input value={it.name} onChange={(e) => editItem(it.key, "name", e.target.value)} placeholder="Food name" aria-label="Food name" />
                      <input value={it.portion} onChange={(e) => editItem(it.key, "portion", e.target.value)} placeholder="Portion" aria-label="Portion" className="portion" />
                      <button type="button" className="btn btn-ghost icon" onClick={() => removeItem(it.key)} aria-label={`Remove ${it.name || "this food"}`}><Trash2 size={16} /></button>
                    </div>
                    <div className="edit-nums">
                      {NUM.map((k) => (
                        <label key={k}>
                          <span>{LABEL[k]}</span>
                          <input type="number" inputMode="decimal" min="0" value={it[k]} onChange={(e) => editItem(it.key, k, e.target.value)} />
                        </label>
                      ))}
                    </div>
                  </li>
                )))}
              </ul>
            )}

            {tips.length > 0 && (
              <div className="tip-box">
                <h3>For skin & hair</h3>
                <ul>{tips.map((t) => <li key={t}>{t}</li>)}</ul>
              </div>
            )}
            {editId && (
              <button type="button" className="btn btn-ghost danger btn-block" onClick={remove}><Trash2 size={16} /> Delete meal</button>
            )}
          </section>

          <section className="card photo-card">
            <div className="card-head">
              <h2>Photo</h2>
              <span className="muted small">optional</span>
            </div>
            {preview ? (
              <>
                <div className={`photo ${status === "analyzing" ? "scanning" : ""}`}><img src={preview} alt="Your meal" /></div>
                {!editId && <button type="button" className="btn btn-ghost small-btn" onClick={removePhoto}><X size={16} /> Remove photo</button>}
              </>
            ) : editId ? (
              <p className="muted small">No photo with this meal.</p>
            ) : (
              <>
                <p className="muted small">Keep a picture of your plate with the meal.</p>
                <div className="photo-btns">
                  <button type="button" className="btn btn-ghost small-btn" onClick={() => cameraRef.current.click()}><Camera size={16} /> Take photo</button>
                  <button type="button" className="btn btn-ghost small-btn" onClick={() => galleryRef.current.click()}><ImagePlus size={16} /> Gallery</button>
                </div>
              </>
            )}
            {AI_ENABLED && !editId && (
              <>
                <label className="field">
                  <span>Describe it for the AI (optional with a photo)</span>
                  <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} maxLength={300}
                    placeholder="e.g. 2 dosa, 1 cup sambar, 1 boiled egg" />
                </label>
                <button type="button" className="btn btn-ghost" onClick={estimate} disabled={status === "analyzing"}>
                  <Sparkles size={17} /> {status === "analyzing" ? "Estimating…" : "Estimate with AI"}
                </button>
              </>
            )}
          </section>
        </div>
      </div>

      {error && <p className="error">{error}</p>}
      <div className="save-bar">
        <p><b>{Math.round(totals.calories).toLocaleString("en-IN")} kcal</b><span>{Math.round(totals.protein)} g protein</span></p>
        <button type="button" className="btn btn-primary" onClick={save} disabled={status === "saving" || !named.length}>
          {status === "saving" ? "Saving…" : editId ? "Save changes" : "Save meal"}
        </button>
      </div>
    </div>
  );
}
