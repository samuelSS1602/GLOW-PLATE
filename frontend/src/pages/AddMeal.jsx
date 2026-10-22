import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Camera, ImagePlus, Sparkles, Trash2, Plus, RotateCcw, PenLine } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useCountUp } from "../hooks/motion";
import { useToast } from "../components/Toast";
import { analyzeMeal } from "../lib/api";
import { saveMeal, updateMeal, deleteMeal, getMeal, getMealPhoto } from "../lib/data";
import { compressImage, guessMealType, todayKey } from "../lib/utils";

const TYPES = ["Breakfast", "Lunch", "Snack", "Dinner"];
const NUM = ["calories", "protein", "carbs", "fat"];
const LABEL = { calories: "kcal", protein: "Protein g", carbs: "Carbs g", fat: "Fat g" };
const BLANK = { name: "", portion: "", calories: 0, protein: 0, carbs: 0, fat: 0 };
const HINT = {
  ai: "AI estimate. Check the portions and fix anything that looks off.",
  manual: "Type the amounts for each food. Add a row for each item.",
  saved: "Fix anything that looks off, then save.",
};

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

// /meal/:id opens a saved meal in the same editor
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

  const [mode, setMode] = useState(editId ? "edit" : "pick"); // pick | photo | text | edit
  const [blob, setBlob] = useState(null);
  const [preview, setPreview] = useState("");
  const [note, setNote] = useState("");
  const [mealType, setMealType] = useState(() => (TYPES.includes(params.get("type")) ? params.get("type") : guessMealType()));
  const [date, setDate] = useState(todayKey());
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState(editId ? "loading" : "idle"); // idle | loading | analyzing | saving
  const [error, setError] = useState("");

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
        setResult({ items: meal.items || [], tips: meal.tips || [], summary: meal.summary || "", source: "saved" });
        setStatus("idle");
        const photo = await getMealPhoto(user.uid, meal).catch(() => null);
        if (live && photo) setPreview(photo);
      } catch (err) {
        if (live) { setError(err.message); setStatus("idle"); }
      }
    })();
    return () => { live = false; };
  }, [editId, user.uid]);

  const back = () => nav(window.history.state?.idx > 0 ? -1 : "/");

  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(""); setResult(null);
    try {
      const small = await compressImage(file);
      setBlob(small);
      setPreview(URL.createObjectURL(small));
      setMode("photo");
    } catch (err) { setError(err.message); }
  };

  const analyze = async () => {
    if (!blob && !note.trim()) { setError("Describe what you ate first."); return; }
    setStatus("analyzing"); setError("");
    try {
      const data = await analyzeMeal(blob, note.trim());
      if (!data.items?.length) {
        throw new Error(blob
          ? "No food was found in this photo. Try a clearer picture of the plate."
          : "Couldn't find any food in that. Add a little more detail, like '2 chapati and dal'.");
      }
      setResult({ ...data, source: "ai" });
    } catch (err) { setError(err.message); }
    finally { setStatus("idle"); }
  };

  // No AI: open the editor with one row named after the description
  const enterManually = () => {
    setError("");
    setResult({ items: [{ ...BLANK, name: note.trim().slice(0, 80) }], tips: [], summary: note.trim(), source: "manual" });
  };

  const items = result?.items || [];
  const totals = sumItems(items);

  const editItem = (i, key, val) =>
    setResult((r) => ({ ...r, items: r.items.map((it, j) => (j === i ? { ...it, [key]: val } : it)) }));
  const removeItem = (i) => setResult((r) => ({ ...r, items: r.items.filter((_, j) => j !== i) }));
  const addItem = () => setResult((r) => ({ ...r, items: [...r.items, { ...BLANK }] }));

  const save = async () => {
    setStatus("saving"); setError("");
    try {
      const clean = items
        .filter((it) => String(it.name).trim())
        .map((it) => ({ ...it, name: String(it.name).trim(), ...Object.fromEntries(NUM.map((k) => [k, Number(it[k]) || 0])) }));
      if (!clean.length) throw new Error("add at least one food with a name.");
      const fields = {
        date, mealType, items: clean, totals: sumItems(clean), tips: result.tips || [],
        summary: result.summary || note.trim() || clean.map((it) => it.name).join(", "),
      };
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

  const reset = () => {
    if (blob) URL.revokeObjectURL(preview);
    setMode("pick"); setBlob(null); setPreview(""); setResult(null); setNote(""); setError("");
  };
  const g = userData.goals;

  return (
    <div className="page narrow">
      <header className="page-head">
        <h1>{editId ? "Edit meal" : "Add a meal"}</h1>
      </header>

      <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={pick} />
      <input ref={galleryRef} type="file" accept="image/*" hidden onChange={pick} />

      {mode === "pick" && (
        <section className="card picker">
          <div className="picker-art" aria-hidden="true"><Camera size={40} /></div>
          <h2>Photograph your plate from above</h2>
          <p className="muted">Good light and the whole plate in frame give the best estimate.</p>
          <div className="picker-btns">
            <button className="btn btn-primary btn-lg" onClick={() => cameraRef.current.click()}>
              <Camera size={20} /> Take photo
            </button>
            <button className="btn btn-ghost btn-lg" onClick={() => galleryRef.current.click()}>
              <ImagePlus size={20} /> Choose from gallery
            </button>
          </div>
          <button className="link-btn" onClick={() => { setError(""); setMode("text"); }}>
            <PenLine size={16} /> No photo? Type what you ate
          </button>
          {error && <p className="error">{error}</p>}
        </section>
      )}

      {mode !== "pick" && status === "loading" && <section className="card"><div className="spinner sm" /></section>}

      {mode !== "pick" && status !== "loading" && editId && !result && (
        <section className="card">
          <p className="error">{error || "This meal couldn't be opened."}</p>
          <button className="btn btn-ghost" onClick={back}>Go back</button>
        </section>
      )}

      {mode !== "pick" && status !== "loading" && (!editId || result) && (
        <div className={preview ? "add-grid" : "stack"}>
          {preview && (
            <section className="card photo-card">
              <div className={`photo ${status === "analyzing" ? "scanning" : ""}`}>
                <img src={preview} alt="Your meal" />
              </div>
              {!editId && <button className="btn btn-ghost small-btn" onClick={reset}><RotateCcw size={16} /> Use a different photo</button>}
            </section>
          )}

          <section className="card form-card">
            {mode === "text" && (
              <button className="link-btn back-link" onClick={reset}><RotateCcw size={15} /> Start over</button>
            )}
            <div className="field-row">
              <label className="field">
                <span>Meal</span>
                <select value={mealType} onChange={(e) => setMealType(e.target.value)}>
                  {TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </label>
              <label className="field">
                <span>Date</span>
                <input type="date" value={date} max={todayKey()} onChange={(e) => setDate(e.target.value)} />
              </label>
            </div>

            {!result && (
              <>
                <label className="field">
                  <span>{blob ? "Anything the photo can't show? (optional)" : "What did you eat?"}</span>
                  {blob ? (
                    <input value={note} onChange={(e) => setNote(e.target.value)}
                      placeholder="e.g. 3 idli, cooked in ghee, 1 cup sambar" maxLength={300} />
                  ) : (
                    <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} autoFocus
                      placeholder="e.g. 2 dosa, 1 cup sambar, coconut chutney, 1 boiled egg" maxLength={300} />
                  )}
                </label>
                <button className="btn btn-primary btn-lg btn-block" onClick={analyze} disabled={status === "analyzing"}>
                  <Sparkles size={19} />
                  {status === "analyzing" ? (blob ? "Reading your plate…" : "Working it out…") : "Calculate calories & protein"}
                </button>
                {!blob && <button className="link-btn" onClick={enterManually}>Or type the numbers myself</button>}
              </>
            )}

            {result && (
              <>
                <div className="result-totals">
                  <Total value={totals.calories} label="kcal" pct={Math.round((totals.calories / g.calories) * 100)} />
                  <Total className="t-p" value={totals.protein} unit="g" label="protein" pct={Math.round((totals.protein / g.protein) * 100)} />
                  <Total value={totals.carbs} unit="g" label="carbs" />
                  <Total value={totals.fat} unit="g" label="fat" />
                </div>

                <p className="muted small">{HINT[result.source]}</p>

                <div className="edit-items">
                  {items.map((it, i) => (
                    <div className="edit-item" key={i}>
                      <div className="edit-name">
                        <input value={it.name} onChange={(e) => editItem(i, "name", e.target.value)} placeholder="Food name" aria-label="Food name" />
                        <input value={it.portion} onChange={(e) => editItem(i, "portion", e.target.value)} placeholder="Portion" aria-label="Portion" className="portion" />
                        <button className="btn btn-ghost icon" onClick={() => removeItem(i)} aria-label={`Remove ${it.name || "this item"}`}><Trash2 size={16} /></button>
                      </div>
                      <div className="edit-nums">
                        {NUM.map((k) => (
                          <label key={k}>
                            <span>{LABEL[k]}</span>
                            <input type="number" inputMode="decimal" min="0" value={it[k]}
                              onChange={(e) => editItem(i, k, e.target.value)} />
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                  <button className="btn btn-ghost small-btn" onClick={addItem}><Plus size={16} /> Add an item</button>
                </div>

                {result.tips?.length > 0 && (
                  <div className="tip-box">
                    <h3>For skin & hair</h3>
                    <ul>{result.tips.map((t, i) => <li key={i}>{t}</li>)}</ul>
                  </div>
                )}

                <button className="btn btn-primary btn-lg btn-block" onClick={save} disabled={status === "saving" || !items.length}>
                  {status === "saving" ? "Saving…" : editId ? "Save changes" : "Save meal"}
                </button>
                {editId && (
                  <button className="btn btn-ghost danger btn-block" onClick={remove}><Trash2 size={16} /> Delete meal</button>
                )}
              </>
            )}
            {error && <p className="error">{error}</p>}
          </section>
        </div>
      )}
    </div>
  );
}
