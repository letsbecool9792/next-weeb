# NextWeeb

NextWeeb is a modern anime dashboard powered by the official MyAnimeList API. Designed to be your one-stop hub for discovering, tracking, and exploring anime with a fast and sleek UI.

## 🚀 Features

- **OAuth Login with MyAnimeList**  
  Securely authenticate with your MAL account using official OAuth2 with PKCE.

- **Anime List Viewer**  
  View your full anime list, filtered by status (watching, completed, etc.) with search and sorting.

- **Anime Search**  
  Search the entire MAL database and view posters, scores, episodes, and more.

- **Anime Detail Pages**  
  Dive into any anime’s full details, including synopsis, rating, status, and studio.

- **Personalized Recommendations** *(coming soon)*  
  Smart recommendations based on your watch history.

- **List Management** *(coming soon)*  
  Update your MAL list directly—mark episodes, change status, and more.

- **Profile Insights & Visualizations** *(coming soon)*  
  See your favorite genres, studios, and anime stats in charts and graphs.

---

## 🛠️ Tech Stack

### Frontend
- [React](https://reactjs.org/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)

### Backend
- [Django](https://www.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- OAuth2 integration with [MyAnimeList API](https://myanimelist.net/apiconfig/references/api/v2)

---

## 🔧 Setup Instructions

### Backend (Django)

```bash
# Clone the repo
git clone https://github.com/your-username/nextweeb.git
cd nextweeb/backend

# Create virtual environment
python -m venv env
source env/bin/activate  # Windows: env\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the server
python manage.py runserver
```

Make sure you have a .env or environment variables for:
MAL_CLIENT_ID, MAL_CLIENT_SECRET, MAL_REDIRECT_URI

### Frontend (React + Vite)
```basgh
cd ../frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```
## 🔑 Authentication

- Click "Login with MAL" on the landing page.
- You'll be redirected to the MyAnimeList login.
- On success, you'll return to the app with your session active.
- Access tokens are securely stored using Django sessions.

## ✨ Planned Features
- Favorites & Bookmarks
- Friends & Activity Feed
- Seasonal Charts
- Custom Lists & Tags
- Notifications for airing anime

## 📁 Project Structure
```bash
nextweeb/
├── backend/      # Django API backend
└── frontend/     # Vite + React + Tailwind frontend
```
