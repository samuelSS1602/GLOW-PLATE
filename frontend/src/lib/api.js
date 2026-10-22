import { auth } from "./firebase";

const BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

// Sends the meal photo (or, with no photo, just the description) to the Python backend,
// which returns the nutrition estimate.
export async function analyzeMeal(blob, note = "") {
  const token = await auth?.currentUser?.getIdToken();
  const form = new FormData();
  if (blob) form.append("image", blob, "meal.jpg");
  form.append("note", note);

  let res;
  try {
    res = await fetch(`${BASE}/api/analyze`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
  } catch {
    throw new Error("Can't reach the analysis server. Check that the backend is running.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || `Analysis failed (${res.status})`);
  return data;
}
