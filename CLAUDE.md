# NextWeeb

A companion app for MyAnimeList (MAL). You log in with your MAL account; the app copies your anime list and shows a dashboard, list browser, search, detail pages, stats charts, recommendations, and an AI chat.

- **Backend:** Django + Django REST Framework, in `backend/`. Deployed on Render (`next-weeb.onrender.com`, free tier, sleeps when idle, ~45s cold start). Build command: `./build.sh`.
- **Frontend:** React 19 + Vite + Tailwind + TypeScript, in `frontend/`. Deployed on Vercel (`next-weeb.vercel.app`).
- **Database:** Postgres on Neon. Project `solitary-queen-51730090`, branch `production` for Render, branch `development` for local work (same schema, separate data). SQLite is only the fallback when `DATABASE_URL` is unset.
- **Auth:** MAL OAuth (PKCE + state, done in the browser) → backend issues our own JWTs. No cookies.
- **External services:** MAL API v2, Google Gemini (AI chat), PostHog (analytics, proxied through the backend).

## How we work

- Only the owner works on this repo. Commit directly to `main`, one commit per logical change. **Never push**: the owner pushes and deploys.
- **No automated tests and no test folder. Do not drive a browser (no Playwright).** All testing is manual by the owner. Every step ends with plain test instructions: local first, then what only a Render deploy can confirm.
- The owner wants to understand every change. Explain what the code does and why, not just what files changed.
- Work is batched: several steps per round, tested locally, with Render tested in larger batches (Render deploys are manual and take ~2 minutes).
- Never print or commit secrets. Env files are git-ignored: `backend/.env.development` (local, includes the Neon dev `DATABASE_URL`), `backend/.env.production`, `backend/.env.local` (Neon production URL, kept for reference).

## Running locally

```
cd backend
.\venv\Scripts\Activate.ps1      # the global Python lacks the packages; always use the venv
python manage.py migrate
python manage.py runserver

cd frontend
npm run dev                       # http://localhost:5173
```

MAL redirects back to `http://localhost:5173/auth/callback` (local) and `https://next-weeb.vercel.app/auth/callback` (production). Both are registered in the MAL app config.

## Backend layout

| File | What it does |
|---|---|
| `api/mal.py` | Every call to MAL. Stores/refreshes MAL tokens, raises `MalReauthRequired` (403, `code: mal_reauth_required`), `MalUnavailable` (502), `MalNotFound` (404). |
| `api/sync.py` | Copies the user's full MAL list into `AnimeEntry` rows (paged, atomic). `ensure_synced` runs the first sync automatically. |
| `api/jwt_views.py` | Token refresh (rotating, blacklisting) and logout. |
| `api/throttles.py` | Rate limits; rates are in `settings.REST_FRAMEWORK`. Counters live in a database cache table. |
| `api/views.py` | All other endpoints. |
| `build.sh` | Render build: install, collectstatic, migrate, createcachetable, flushexpiredtokens. |

## History

| When | What happened |
|---|---|
| May 2024 | Started as CLI scripts against the Jikan API, counting genre/studio/theme frequencies (now in `initial stages/`). |
| Feb–Mar 2025 | First React + Django scaffold, scrapped and restarted. MAL OAuth added on Mar 27, using Django sessions. |
| Apr–May 2025 | Django users, cached anime list, a new TypeScript frontend, list/profile/detail/search pages. |
| Oct 2025 | Stats page, dashboard, first deploy to Render + Vercel. |
| Nov–Dec 2025 | Rule-based recommendations and the Gemini chat; reworked in Dec after finding MAL has no genre filter. |
| Jan 6–9, 2026 | PostHog, then four days fighting auth. Session cookies failed in Safari/Firefox/Brave because `vercel.app` → `onrender.com` is cross-site. Switched to JWTs in localStorage. |
| Jan → Nov 2026 | Untouched. The real remaining problem: production used SQLite on Render's disk, which is wiped on every restart, so users kept "losing" their accounts. |
| Nov 14, 2026 | Fix plan below started. |

## Fix plan

Status per step: **[x] done** · local = owner tested locally · render = owner tested on the deployed site.

### Foundations
- [x] **1. Repo hygiene.** Stopped tracking `.pyc` files; removed the unused `oauth2_provider` app (exposed `/oauth/`); `requirements.txt` rewritten as UTF-8 with direct dependencies only. *local ✓ render ✓*
- [x] **2. Persistent database.** Postgres via `DATABASE_URL` (Neon); MAL token column widened to text. *local ✓ render ✓* — Render env now has `DATABASE_URL`, a new `SECRET_KEY` (the old one was in public git history), `PYTHON_VERSION=3.12.5`.

### Security and robustness
- [x] **3. Lock down the surface.** Removed public `/api/debug-config/` and unused session-era endpoints, stopped logging OAuth secrets, `DEBUG` defaults off, cross-site cookie settings removed, HSTS and proxy-SSL settings in production. *local ✓ render ✓*
- [x] **4. Real OAuth flow.** Browser generates PKCE verifier and `state`, verifies `state` on return; MAL redirects to the frontend. Backend exposes `/api/oauth-config/` and `/api/exchange-token/`. *local ✓ render ✓* — `MAL_REDIRECT_URI` removed from Render; old backend callback URLs removed from MAL.
- [x] **5. MAL token lifecycle.** Refresh token + expiry stored, automatic refresh in `api/mal.py`, frontend redirects to login with an "expired" notice on `mal_reauth_required`. *local: 4 of 5 checks ✓; reconnect check to redo (press Sync Library, not reload) · render pending*
- [x] **6. JWT hardening.** 15-minute access tokens, rotating + blacklisted refresh tokens, `POST /api/logout/` revokes, refresh rejects deleted/inactive users, rate limits on login, refresh, AI chat, sync. *local ✓ · render pending*
- [x] **7. Sync done properly.** Paged (no 1,000 cap), includes NSFW titles from the user's own list, atomic swap, show details stored on `AnimeEntry`, stats read from the database, first sync automatic, sync endpoints POST-only. *local ✓ · render pending*

### Recommendations
- [ ] **8. Split views and fix dead inputs.** Break `views.py` into modules (no behaviour change); request the anchor's score and popularity (always 0 / 99999 before); stop writing debug files.
- [ ] **9. Local anime catalog.** A table of popular anime filled from MAL rankings, replacing title text search for the genre, studio and hidden-gems sections.
- [ ] **10. Better scoring.** Taste profile where rare genres weigh more, MAL's community "if you liked X" data as a second signal, a reason on every pick, a plan-to-watch section, results cached per user.
- [ ] **11. AI chat.** Multi-turn, grounded in the taste profile and real unwatched candidates, returns clickable anime cards.

### Leftovers
- [ ] **12. Frontend structure.** Auth context and protected routes instead of passing `setIsLoggedIn` everywhere; client-side links; clean ESLint run.
- [ ] **13. UI bugs.** NaN average score, dead buttons, missing placeholder images, duplicate empty states, dashboard spinning forever when the backend is down.
- [ ] **14. Docs and honesty.** Rewrite the README; landing page matches real features; tracked `.env.example`; fix the stale `.vscode/launch.json`.

Out of scope for now: writing changes back to MAL (list management).

## Known limits

- IP-based rate limits trust `X-Forwarded-For`; a determined client can dodge them.
- MAL only supports "plain" PKCE, so the verifier appears in the URL sent to MAL; the `state` check is the main protection.
- Pages that read only our database (list, dashboard, stats) do not notice an expired MAL connection until something calls MAL (sync, detail, search, recommendations).
