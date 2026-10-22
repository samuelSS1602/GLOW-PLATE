# GlowPlate

Pick what you ate from a built-in list of everyday South Indian foods and GlowPlate counts the calories, protein, carbs and fat, then tracks them with your water intake against your daily goals. No AI needed. Works on phone and laptop.

**Live:** https://glow-plate.vercel.app

**Developed by [Code Crafters](https://codecrafters-pi.vercel.app/)**

## What it does

- **Today**: a plate-shaped ring shows calories left, with protein, carbs and fat arcs, a water tracker (tap glasses or add 250/500 ml), and today's meals. A 🔥 streak counts days in a row where you hit all your goals, nudges remind you about unlogged meals, water and protein through the day, and finishing a day (or your water) gets a little celebration.
- **Add a meal**: search or browse about 130 foods (idli, dosa, sambar, rice, chicken curry, sundal, fruits, drinks…, with Tamil names too), tap **+** and set the amount with − / +. Totals update as you go. Foods you eat often show first under **Recent**, anything missing can be added as your own food, and a photo can be kept with the meal. Each meal gets skin and hair tips worked out from its foods (`frontend/src/lib/foods.js`).
- **Edit & repeat**: open any saved meal to edit, delete, or **Add again today** (the same breakfast every day in one tap).
- **History**: a month **calendar** showing which days you finished, the **last 7 days** with weekly insights (what you hit, what you miss most), and a **weight** tracker with a progress chart.
- **My plan**: your targets, a sample South Indian day, and foods for skin glow and hair growth.
- **Profile**: age, weight, height, activity and goal. Goals recalculate automatically (Mifflin-St Jeor), or you can set your own. Logging a new weight updates them. Appearance: Auto, Light or Dark.

Starting goals for 22 yrs, 87 kg, 176 cm, light activity, fat loss: about **2,050 kcal, 140 g protein, 250 g carbs, 55 g fat, 3 L water**.

## How it fits together

```
React (Vite) + built-in food list
     ├─ Firebase Auth (Google sign-in, remembered on the device)
     ├─ Firestore (cached on the device)
     │    users/{uid}, users/{uid}/meals, users/{uid}/photos/{mealId},
     │    users/{uid}/water/{date}, users/{uid}/weights/{date}
     └─ optional: Python FastAPI ──▶ Claude model (AI estimates, off by default)
```

**AI is optional.** The app works fully without it. To add "Estimate with AI" from a photo or description, run the Python backend with an `ANTHROPIC_API_KEY` from an account with credits (console.anthropic.com > Plans & Billing) and set `VITE_ENABLE_AI=true` in `frontend/.env` (on Vercel: an environment variable, then redeploy). The key stays on the server, never in the browser.

Everything runs on Firebase's free **Spark** plan. Meal photos are saved as small thumbnails (about 20–40 KB) in their own Firestore documents, so Firebase Storage, which needs the paid Blaze plan, isn't used, and lists of meals stay small.

## Staying signed in

You sign in once per browser. The login is kept on the device until you press **Sign out**, and your data is cached so the app opens with it straight away. If you're asked to sign in again:

- Open the same address every time: http://localhost:5173 (the dev server now refuses to move to another port). A `192.168…` address on your phone changes with Wi-Fi, and each new address counts as a new site.
- Don't use a private/incognito window, and check your browser isn't set to clear site data when it closes.
- If you have more than one Google account, use the same one. The login screen shows the last one used ("Continue as …").

## Setup

### 1. Firebase
1. Create a project at https://console.firebase.google.com
2. **Authentication** > Sign-in method > enable **Google**.
3. **Firestore Database** > create database (production mode).
4. Project settings > Your apps > add a **Web app** and copy its config.
5. Publish the Firestore rules in this folder (or paste `firestore.rules` into Firestore Database > Rules):
   ```bash
   npm i -g firebase-tools
   firebase login
   firebase use --add          # pick your project
   firebase deploy --only firestore:rules
   ```

### 2. Backend (optional, only for AI estimates; Python 3.10+)
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows   (macOS/Linux: source .venv/bin/activate)
pip install -r requirements.txt
copy .env.example .env          # macOS/Linux: cp .env.example .env
```
Fill in `.env`: your `ANTHROPIC_API_KEY` (from https://console.anthropic.com) and `FIREBASE_PROJECT_ID`. Then:
```bash
uvicorn main:app --reload --port 8000
```
Check http://localhost:8000/api/health

### 3. Frontend
```bash
cd frontend
npm install
copy .env.example .env          # paste the Firebase web config into it
npm run dev
```
Open http://localhost:5173. To test on your phone on the same Wi-Fi, open the "Network" address Vite prints (camera access needs HTTPS outside localhost, so the gallery option is the fallback there; it works fully once deployed).

## Deploy (Vercel)

The repo deploys to Vercel as one project. The React app is built from `frontend/`, and the Python API runs as a serverless function (`api/index.py`, which loads `backend/main.py`) on the same address, so no CORS setup or `VITE_API_URL` is needed. `vercel.json` holds the settings.

1. Import the GitHub repo at https://vercel.com/new (or run `vercel` in this folder). Keep the repo root as the root directory.
2. Add these environment variables (Project > Settings > Environment Variables):
   - `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID` (the values in `frontend/.env`)
   - `ANTHROPIC_API_KEY` and `FIREBASE_PROJECT_ID` (optionally `ANTHROPIC_MODEL`)
3. In Firebase console > Authentication > Settings > **Authorized domains**, add your Vercel domain (for example `glow-plate.vercel.app`), or Google sign-in is refused there.

Every push to `main` redeploys. The backend can also run anywhere else with its Dockerfile; then set `VITE_API_URL` to its address and `ALLOWED_ORIGINS` to the site's.

## Notes

- Food values are typical home portions (IFCT/NIN-style averages), usually within 15–25% of your actual plate. Add oil or ghee as extras, or change amounts, when yours differ.
- Firestore queries use a single field (or the document ID), so no composite indexes are needed.
- Change the AI model with `ANTHROPIC_MODEL` in `backend/.env`.
