# NextWeeb

Anime recommendations, stats and an AI assistant built on your MyAnimeList account.

**Live:** [next-weeb.vercel.app](https://next-weeb.vercel.app) (the backend sleeps when idle, so the first request can take about a minute)

Log in with MyAnimeList (MAL) and NextWeeb copies your list, then gives you:

- **Recommendations that explain themselves.** Every pick says why it was chosen: "Recommended by 31 fans of Sousou no Frieren", "From Madhouse, who made Sousou no Frieren", "Matches your taste for Drama and Adventure".
- **An AI chat that knows your list.** Ask for "something short and wholesome", then "shorter, maybe a movie". It answers in context and only suggests real shows you haven't seen, as clickable cards.
- **Plan to Watch, ranked.** Which show already on your list fits your taste best.
- **Stats.** Top genres and studios, rating spread, media types, total watch time.
- **Your list, search and detail pages,** fast because they read a synced copy rather than calling MAL each time.

## Tech stack

| | |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, Recharts. Deployed on Vercel. |
| Backend | Django 5, Django REST Framework, Simple JWT. Deployed on Render. |
| Database | Postgres on Neon (separate branches for production and development) |
| External | MyAnimeList API v2, Google Gemini, PostHog |

## How it works

### Login: MAL OAuth in the browser, our own JWTs after

1. The browser generates a PKCE verifier and a random `state`, keeps them in `sessionStorage`, and sends the user to MAL.
2. MAL redirects back to the frontend. The callback refuses to continue unless `state` matches what this tab stored, so a login response can only be completed by the tab that started it.
3. The backend adds the client secret and trades the code for MAL tokens, then issues its own JWTs.

The app uses no cookies, because the frontend (`vercel.app`) and backend (`onrender.com`) are different sites. An earlier version used session cookies, which browsers increasingly block across sites.

Our tokens: access tokens last 15 minutes. Refresh tokens rotate on every use and the old one is blacklisted, so a stolen refresh token stops working as soon as either side uses it. Logout revokes the refresh token on the server.

MAL tokens expire after 31 days. The backend stores MAL's refresh token and renews MAL access well before expiry. If MAL refuses, the API returns `403 mal_reauth_required` and the frontend asks the user to reconnect.

### Recommendations ([`backend/api/recommender.py`](backend/api/recommender.py))

MAL's API can't list "all Drama shows", so NextWeeb keeps its own catalog: the 5,000 most popular shows, refreshed from MAL's rankings on every deploy.

1. **Taste profile.** Each show on your list gets a weight from your score, measured against a neutral 6 and against your own average (a 7 from someone who gives out 9s is lukewarm). Dropped shows count against their genres.
2. **Rarity.** Genres are weighted by inverse document frequency over the catalog. Sharing "Comedy" (a third of all anime) says little; sharing "Iyashikei" says a lot.
3. **Two signals per candidate.** Content match (genres and studios against your profile) and community match (how often MAL users recommended it for your favourite shows), plus a small quality term. They are scaled to the same range and blended.
4. **Filters.** Nothing already on your list, nothing from the same franchise, no sequels or films of shows you haven't started.
5. **Caching.** Results are cached per user until their next sync. Once your favourites' details are cached, a page needs no MAL calls.

### AI chat ([`backend/api/views/chat.py`](backend/api/views/chat.py))

The server builds the prompt from the database: your favourites with scores, dropped shows, taste profile, and about 200 candidate shows you haven't seen. Gemini must answer in JSON with candidate IDs. IDs not on the list are dropped, so it can't recommend a made-up show or one you've already watched.

### Robustness

- Your list is synced in pages (no 1,000-entry cap) and swapped in one database transaction, so a failed sync never leaves a half-empty list.
- Rate limits on login, token refresh, sync and AI chat, with counters in the database so all server processes share them.
- Every MAL call goes through one module ([`backend/api/mal.py`](backend/api/mal.py)) with timeouts, token refresh and consistent JSON errors.

## Project structure

```
backend/
  api/
    mal.py              all MyAnimeList calls, token refresh
    sync.py             copies a user's MAL list into the database
    catalog.py          shared table of popular shows
    recommender.py      taste profile, scoring, recommendation sections
    throttles.py        rate limits
    views/              endpoints: auth, tokens, library, recommendations, chat, system
  backend/settings.py
  build.sh              Render build: install, migrate, refresh the catalog
frontend/
  src/
    auth/               login state (context) and the protected-route guard
    pages/              one component per page
    components/
    utils/              fetch wrapper with token refresh, OAuth helpers
initial stages/         the project's 2024 origin: CLI scripts against the Jikan API
```

## Running locally

You need Python 3.12, Node 20+, a MAL API app (redirect URL `http://localhost:5173/auth/callback`), and optionally a Postgres database and a Gemini key.

```bash
# Backend
cd backend
python -m venv venv
venv\Scripts\activate             # macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env.development  # then fill it in
python manage.py migrate
python manage.py createcachetable
python manage.py refresh_catalog  # downloads the popular-shows catalog (~10s)
python manage.py runserver        # http://localhost:8000

# Frontend, in another terminal
cd frontend
npm install
cp .env.example .env.development
npm run dev                       # http://localhost:5173
```

Without `DATABASE_URL` the backend uses a local SQLite file. Without `GEMINI_API_KEY` everything works except the chat.
