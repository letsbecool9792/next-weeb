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
| `api/mal.py` | Every call to MAL. `mal_get` (as a user, refreshes MAL tokens) and `public_get` (app client id only). Raises `MalReauthRequired` (403, `code: mal_reauth_required`), `MalUnavailable` (502), `MalNotFound` (404). |
| `api/sync.py` | Copies the user's full MAL list into `AnimeEntry` rows (paged, atomic, with show details). `ensure_synced` runs the first sync automatically. |
| `api/catalog.py` | Shared `Anime` table: MAL's top 5,000 shows by popularity, plus on-demand show details (MAL community recommendations, related shows), reused for 30 days. |
| `api/recommender.py` | Taste profile (rarity-weighted genres, studios, favourite shows), scoring, and every recommendations section with a reason per pick. |
| `api/throttles.py` | Rate limits; rates are in `settings.REST_FRAMEWORK`. Counters live in a database cache table. |
| `api/views/` | Endpoints by area: `auth` (OAuth), `tokens` (JWT refresh, logout), `library` (profile, list, stats, detail, search), `recommendations` (cached per user until next sync), `chat` (Gemini), `system` (health, PostHog proxy). |
| `api/management/commands/refresh_catalog.py` | `manage.py refresh_catalog`; never fails the build. |
| `build.sh` | Render build: install, collectstatic, migrate, createcachetable, flushexpiredtokens, refresh_catalog. |

Optional env var: `GEMINI_MODEL` (default `gemini-2.5-flash`).

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
- [x] **5. MAL token lifecycle.** Refresh token + expiry stored, automatic refresh in `api/mal.py`, frontend redirects to login with an "expired" notice on `mal_reauth_required`. *local ✓ · render pending*
- [x] **6. JWT hardening.** 15-minute access tokens, rotating + blacklisted refresh tokens, `POST /api/logout/` revokes, refresh rejects deleted/inactive users, rate limits on login, refresh, AI chat, sync. *local ✓ · render pending*
- [x] **7. Sync done properly.** Paged (no 1,000 cap), includes NSFW titles from the user's own list, atomic swap, show details stored on `AnimeEntry`, stats read from the database, first sync automatic, sync endpoints POST-only. *local ✓ · render pending*

### Recommendations
- [x] **8. Split views and fix dead inputs.** `views.py` split into `api/views/` + `api/recommender.py` (pure move); anchor score and popularity now requested; no more debug files. *local ✓ · render pending*
- [x] **9. Local anime catalog.** `Anime` table with MAL's top 5,000 shows, filled by `refresh_catalog` on every deploy; show details fetched in parallel on demand. *local ✓ · render pending*
- [x] **10. Better scoring.** New engine: weighted taste (scores vs the user's own average, dropped shows count against), rarity (idf) weighting, MAL community picks for the user's favourites, a reason per pick, new Top Picks and Plan to Watch sections, no sequels/films of unseen shows, cached per user until the next sync, `?regenerate=1`. Page shows a taste summary and an error with retry. *local ✓ · render pending*
- [x] **11. AI chat.** Multi-turn; server builds the context (favourites, dropped, taste, ~200 unwatched candidates + Plan to Watch); Gemini answers in JSON with candidate ids, unknown ids dropped; picks shown as cards; uses `authFetch`. *local ✓ · render pending*

### Leftovers
- [x] **12. Frontend structure.** `src/auth/` (AuthProvider, useAuth, RequireAuth); protected routes wrap every logged-in page; no more `setIsLoggedIn` props; NavLink with active state; header shows the MAL picture; ESLint clean. *local pending · render pending*
- [x] **13. UI bugs.** Error state with retry on every data page (dashboard used to spin forever); NaN averages; capped "Watching" and "Perfect 10s" counts; dead "Return to List"; detail page crash on missing MAL fields; broken profile avatar; duplicate empty states; unclickable list rows; "Invalid Date"; search is one request (was seven) and reports errors and short queries. Shared `Poster`, `ErrorState`, `utils/format.ts`. *local pending · render pending*
- [x] **14. Docs and honesty.** README rewritten; landing and login copy only claims features that exist (no "read-only access" claim: MAL has no such scope); tracked `backend/.env.example` and `frontend/.env.example`; `.vscode/launch.json` points at `backend/manage.py` on port 8000; Vite template README removed. *local pending · render pending*

### UI overhaul
- [x] **15. Visual redesign.** Every page rebuilt in a streaming-service style. Backend support: `image_large` on catalog and list entries, public `/api/showcase/` (covers for the poster wall), `mal_id`/`image` in stats-data. Pages load lazily (first download 357 kB → 182 kB gzipped). New favicon. *local pending · render pending*

## Design system (agreed with the owner, Nov 2026)

- **Look:** streaming service (Crunchyroll/Netflix): blurred cover-art banners, horizontal poster rows, art does the talking.
- **Colours:** keep the original palette: dark ink background (`--color-ink`), purple/pink/fuchsia gradients. Do not introduce new brand colours.
- **Fonts:** Space Grotesk for everything (`@fontsource-variable/space-grotesk`); Silkscreen pixel font for the wordmark, episode numbers, tickers and card codes; Dela Gothic One for kanji, subset to the characters in `src/assets/fonts/` (add a new kanji there by re-subsetting, or it falls back to the system Japanese font).
- **Logo:** L11 Pixel Heart (`components/brand/PixelHeart.tsx`, `Logo.tsx`, `public/favicon.svg`) with NEXTWEEB in Silkscreen.
- **Signature elements (owner's picks):** holo trading cards (`ui/HoloCard`), kanji markers behind page titles (`ui/Kanji`: おかえり Home, 発見 Discover, 一覧 My list, 探索 Search, 統計 Stats, 私 Profile, 入口 login, 迷子 404; a show's Japanese title on its page), ticker tapes (`ui/Ticker`), episode title cards for section headings (`ui/TitleCard`, `Row ep=`), cursor spotlight on every `.card` (`utils/useSpotlight.ts`). No romaji or translation captions under kanji.
- **Navigation:** top bar (transparent over banners, frosted on scroll) with an always-present search box (`/` or Ctrl+K). Dashboard ("Home") and Recommendations ("Discover") stay separate pages.
- **Landing:** hero E, "次 editorial": real covers drift inside a giant 次 (the dark layer uses `mix-blend-multiply`, so only the glyph shows the covers), headline H2 "Your next favourite anime is already waiting.", crossing tickers; features are four "episodes".
- **Motion:** lots (the owner's choice), via `motion` (`motion/react`). Page transitions, staggered card entrances, parallax banners, count-ups, hover lifts. `MotionConfig reducedMotion="user"` and a CSS media query honour the OS "reduce motion" setting.

Frontend building blocks (`frontend/src/components/`): `AppShell` (layout route in `routes.tsx`: header, page fade, footer; pages render only their content), `ui/HeroBanner`, `ui/Row`, `ui/PosterCard`, `ui/PosterWall`, `ui/PageHeader`, `ui/Skeleton`, `ui/CountUp`, `ui/ScoreRing`, `ui/Reveal`, `SearchBox`, `ChatPanel`, `Poster` (image with fallback), `ErrorState`. Shared types in `src/types.ts`, helpers in `src/utils/format.ts`. CSS component classes (`card`, `btn-primary`, `btn-secondary`, `chip`, `input`, `select-field`, `skeleton`, `text-gradient`) live in `src/index.css`; Tailwind v4 cannot `@apply` one of these inside another.

Out of scope for now: writing changes back to MAL (list management).

## Known limits

- IP-based rate limits trust `X-Forwarded-For`; a determined client can dodge them.
- MAL only supports "plain" PKCE, so the verifier appears in the URL sent to MAL; the `state` check is the main protection.
- Pages that read only our database (list, dashboard, stats, recommendations) do not notice an expired MAL connection until something calls MAL as the user (sync, profile sync, detail, search).
- Recommendations only consider MAL's 5,000 most popular shows. Franchise matching (`base_title`, `looks_like_follow_up`) is title-based and imperfect, e.g. "K-On!!" is not recognised as a sequel.
- `backend/debug_recommendations/` holds old local debug output (git-ignored); nothing writes there any more and it can be deleted.
