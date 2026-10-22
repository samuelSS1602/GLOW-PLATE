import {
  doc, getDoc, getDocFromCache, setDoc, updateDoc, collection, query, where, orderBy,
  onSnapshot, serverTimestamp, increment, writeBatch, documentId,
} from "firebase/firestore";
import { db } from "./firebase";
import { DEFAULT_PROFILE, calculateGoals } from "./goals";
import { compressImage, blobToDataUrl } from "./utils";

// Firestore layout
//   users/{uid}                  -> { profile, goals, createdAt, updatedAt }
//   users/{uid}/meals/{mealId}   -> { date, mealType, items[], totals, tips[], summary, hasPhoto, createdAt }
//   users/{uid}/photos/{mealId}  -> { data }  small JPEG data URL (about 20-40 KB)
//   users/{uid}/water/{date}     -> { ml }
//   users/{uid}/weights/{date}   -> { kg }
// Photos sit in their own documents so lists of meals stay small, and the app runs on the
// free Spark plan without Firebase Storage. Meals saved before this may carry an inline imageUrl.

// Calls cb with the profile: first from the device cache, then from the server.
// A new profile is created only once the server confirms there isn't one yet.
export function watchUser(user, cb, onError) {
  const r = doc(db, "users", user.uid);
  return onSnapshot(r, (snap) => {
    if (snap.exists()) return cb(snap.data({ serverTimestamps: "estimate" }));
    if (snap.metadata.fromCache) return;
    const profile = { ...DEFAULT_PROFILE, name: user.displayName?.split(" ")[0] || "" };
    setDoc(r, { profile, goals: calculateGoals(profile), createdAt: serverTimestamp() }).catch(onError);
  }, onError);
}

export function saveProfile(uid, profile, goals) {
  return setDoc(doc(db, "users", uid), { profile, goals, updatedAt: serverTimestamp() }, { merge: true });
}

const mealsCol = (uid) => collection(db, "users", uid, "meals");
const photoDoc = (uid, id) => doc(db, "users", uid, "photos", id);

export async function saveMeal(uid, { photo, date, mealType, items, totals, tips, summary }) {
  const r = doc(mealsCol(uid));
  const batch = writeBatch(db);
  if (photo) batch.set(photoDoc(uid, r.id), { data: await blobToDataUrl(await compressImage(photo, 360, 0.7)) });
  batch.set(r, {
    date, mealType, items, totals, tips: tips || [], summary: summary || "",
    hasPhoto: Boolean(photo), createdAt: serverTimestamp(),
  });
  await batch.commit();
  return r;
}

export function updateMeal(uid, id, fields) {
  return updateDoc(doc(mealsCol(uid), id), { ...fields, updatedAt: serverTimestamp() });
}

export async function getMeal(uid, id) {
  const snap = await getDoc(doc(mealsCol(uid), id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// Photos never change, so read the device cache first and keep them for the session.
const photos = new Map();
export function getMealPhoto(uid, meal) {
  if (meal.imageUrl) return Promise.resolve(meal.imageUrl);
  if (!meal.hasPhoto) return Promise.resolve(null);
  if (!photos.has(meal.id)) {
    const r = photoDoc(uid, meal.id);
    photos.set(meal.id, getDocFromCache(r)
      .catch(() => getDoc(r))
      .then((s) => s.data()?.data || null)
      .catch((e) => { photos.delete(meal.id); throw e; }));
  }
  return photos.get(meal.id);
}

// Copies a meal and its photo to another day, e.g. the same breakfast again today.
export async function repeatMeal(uid, meal, date) {
  const photo = await getMealPhoto(uid, meal).catch(() => null);
  const r = doc(mealsCol(uid));
  const batch = writeBatch(db);
  if (photo) batch.set(photoDoc(uid, r.id), { data: photo });
  batch.set(r, {
    date, mealType: meal.mealType, items: meal.items || [], totals: meal.totals || {},
    tips: meal.tips || [], summary: meal.summary || "", hasPhoto: Boolean(photo), createdAt: serverTimestamp(),
  });
  await batch.commit();
  return r;
}

export function deleteMeal(uid, meal) {
  const batch = writeBatch(db);
  batch.delete(doc(mealsCol(uid), meal.id));
  batch.delete(photoDoc(uid, meal.id));
  return batch.commit();
}

export function watchMealsBetween(uid, from, to, cb) {
  const q = query(
    mealsCol(uid),
    where("date", ">=", from),
    where("date", "<=", to),
    orderBy("date", "desc")
  );
  return onSnapshot(q, (s) => {
    const list = s.docs.map((d) => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    cb(list);
  });
}

// Water docs are keyed by date, so a document-ID range reads only the days asked for
export function watchWaterBetween(uid, from, to, cb) {
  const q = query(
    collection(db, "users", uid, "water"),
    where(documentId(), ">=", from),
    where(documentId(), "<=", to)
  );
  return onSnapshot(q, (s) => cb(Object.fromEntries(s.docs.map((d) => [d.id, d.data().ml || 0]))));
}

export function addWater(uid, date, ml) {
  return setDoc(doc(db, "users", uid, "water", date), { ml: increment(ml) }, { merge: true });
}

export function setWater(uid, date, ml) {
  return setDoc(doc(db, "users", uid, "water", date), { ml: Math.max(0, ml) }, { merge: true });
}

export function watchWeights(uid, cb) {
  return onSnapshot(collection(db, "users", uid, "weights"), (s) =>
    cb(s.docs.map((d) => ({ date: d.id, kg: d.data().kg })).sort((a, b) => (a.date < b.date ? -1 : 1))));
}

export function logWeight(uid, date, kg) {
  return setDoc(doc(db, "users", uid, "weights", date), { kg });
}

// Logs today's weight and, unless the user set their own goals, recalculates the goals from it.
export async function saveWeight(uid, date, kg, profile, goals) {
  const nextProfile = { ...profile, weightKg: kg };
  const nextGoals = profile.customGoals ? goals : calculateGoals(nextProfile);
  const batch = writeBatch(db);
  batch.set(doc(db, "users", uid, "weights", date), { kg });
  batch.set(doc(db, "users", uid), { profile: nextProfile, goals: nextGoals, updatedAt: serverTimestamp() }, { merge: true });
  await batch.commit();
  return nextGoals;
}
