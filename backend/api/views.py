import requests
import base64, os
import google.generativeai as genai
from collections import defaultdict

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from django.conf import settings
from django.shortcuts import redirect
from django.http import JsonResponse

from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.contrib.auth import login
from django.contrib.auth import logout

from django.views.decorators.csrf import csrf_exempt

from django.shortcuts import redirect

from .models import AnimeEntry
from .models import UserProfile

# Health check endpoint
@api_view(['GET'])
def health_check(request):
    return Response({
        "status": "healthy",
        "service": "next-weeb-api",
        "message": "Server is running"
    }, status=200)

# OAuth URLs
MAL_AUTH_URL = "https://myanimelist.net/v1/oauth2/authorize"
MAL_TOKEN_URL = "https://myanimelist.net/v1/oauth2/token"

# Get CLIENT_ID and CLIENT_SECRET from settings safely
CLIENT_ID = getattr(settings, "MAL_CLIENT_ID", None)
CLIENT_SECRET = getattr(settings, "MAL_CLIENT_SECRET", None)
REDIRECT_URI = getattr(settings, "MAL_REDIRECT_URI", None)

# Frontend URL - use environment variable or default to localhost
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")

def generate_code_verifier():
    """ Generate a secure random code_verifier """
    return base64.urlsafe_b64encode(os.urandom(32)).decode("utf-8").rstrip("=")

def generate_code_challenge(code_verifier):
    """ For MAL, simply return the code_verifier """
    return code_verifier

def mal_login(request):
    """
    Redirects the user to MyAnimeList's OAuth authorization page.
    """
    code_verifier = generate_code_verifier()
    code_challenge = generate_code_challenge(code_verifier)

    # Store code_verifier in session
    request.session["code_verifier"] = code_verifier

    print(f"Generated code_verifier: {code_verifier}")
    print(f"Generated code_challenge: {code_challenge}")

    auth_url = (
        f"{MAL_AUTH_URL}?response_type=code"
        f"&client_id={CLIENT_ID}"
        f"&redirect_uri={REDIRECT_URI}"
        f"&code_challenge={code_challenge}"
        f"&code_challenge_method=plain"
    )

    return redirect(auth_url)

def mal_callback(request):
    """
    Handles the OAuth callback from MyAnimeList, exchanges the code for an access token.
    """
    code = request.GET.get("code")
    print(f"Received authorization code: {code}")

    if not code:
        return JsonResponse({"error": "Authorization failed, no code received."}, status=400) 

    code_verifier = request.session.get("code_verifier")
    print(f"Retrieved code_verifier from session: {code_verifier}")

    if not code_verifier:
        return JsonResponse({"error": "Missing PKCE code_verifier"}, status=400)

    # Exchange the authorization code for an access token
    token_data = {
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "code": code,
        "grant_type": "authorization_code",
        "redirect_uri": REDIRECT_URI,
        "code_verifier": code_verifier,
    }

    response = requests.post(MAL_TOKEN_URL, data=token_data)
    print(f"Token request response status: {response.status_code}")
    print(f"Token request response text: {response.text}")

    if response.status_code == 200:
        token_json = response.json()
        access_token = token_json.get("access_token")

        request.session["mal_access_token"] = access_token

        user_info_response = requests.get(
            "https://api.myanimelist.net/v2/users/@me",
            headers={"Authorization": f"Bearer {access_token}"},
        )

        if user_info_response.status_code != 200:
            return JsonResponse({"error": "Failed to fetch MAL user info"}, status = 400)
        
        mal_user = user_info_response.json()
        mal_username = mal_user.get("name")

        user, _ = User.objects.get_or_create(username=mal_username)

        profile, _ = UserProfile.objects.get_or_create(user=user)
        profile.mal_access_token = access_token
        profile.save()

        login(request, user)

        print(f"Is user authenticated in Django? {request.user.is_authenticated}")
        print(f"Logged in as: {request.user.username}")


        # return JsonResponse({"message": "Login successful", "access_token": access_token})
        return redirect(f"{FRONTEND_URL}/dashboard")  # Or whatever route you want to land on in React

    return JsonResponse({"error": "Failed to retrieve access token", "details": response.text}, status=400)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def sync_mal_profile(request):
    """ Fetch from MAL and store in UserProfile """
    token = request.session.get("mal_access_token")
    if not token:
        return Response({"error": "Not authenticated"}, status=401)

    headers = {"Authorization": f"Bearer {token}"}
    r = requests.get("https://api.myanimelist.net/v2/users/@me", headers=headers)
    if r.status_code != 200:
        return Response({"error": "MAL error", "details": r.text}, status=400)

    data = r.json()
    prof = request.user.userprofile
    prof.name = data.get("name")
    prof.birthday = data.get("birthday")
    prof.location = data.get("location")
    prof.joined_at = data.get("joined_at")
    prof.picture = data.get("picture") # or data.get("main_picture", {}).get("medium")
    prof.save()

    return Response({"message": "Profile synced"})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def cached_mal_profile(request):
    """ Return the stored profile """
    prof = request.user.userprofile
    return Response({
        "name": prof.name,
        "birthday": prof.birthday,
        "location": prof.location,
        "joined_at": prof.joined_at,
        "picture": prof.picture,
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def sync_anime_list(request):
    access_token = request.session.get("mal_access_token")
    if not access_token:
        return JsonResponse({"error": "User not authenticated"}, status=401)

    headers = {"Authorization": f"Bearer {access_token}"}
    url = "https://api.myanimelist.net/v2/users/@me/animelist"
    params = {"fields": "list_status", "limit": 1000}
    response = requests.get(url, headers=headers, params=params)

    if response.status_code != 200:
        return JsonResponse({"error": "Failed to fetch anime list", "details": response.text}, status=400)

    anime_list = response.json().get("data", [])

    AnimeEntry.objects.filter(user=request.user).delete()

    for item in anime_list:
        anime = item["node"]
        status = item["list_status"]
        AnimeEntry.objects.create(
            user=request.user,
            mal_id=anime["id"],
            title=anime["title"],
            status=status.get("status", ""),
            image_url=anime.get("main_picture", {}).get("medium"),
            score=status.get("score"),
            episodes_watched=status.get("num_episodes_watched"),
            is_rewatching=status.get("is_rewatching", False),
            start_date=status.get("start_date") or None,
            finish_date=status.get("finish_date") or None,
            last_updated=status.get("updated_at") or None
        )

    return JsonResponse({"message": "Anime list synced", "count": len(anime_list)})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_cached_anime_list(request):
    entries = AnimeEntry.objects.filter(user=request.user).values(
        "mal_id",
        "title",
        "image_url",
        "status",
        "score",
        "episodes_watched",
        "is_rewatching",
        "start_date",
        "finish_date",
        "last_updated",
    )
    return JsonResponse(list(entries), safe=False)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def session_status(request):
    return Response({
        "is_authenticated": True,
        "username": request.user.username,
    })

#@csrf_exempt
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mal_logout(request):
    logout(request)
    return JsonResponse({"message": "Logout successful"})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def anime_detail(request, anime_id):
    token = request.session.get("mal_access_token")
    if not token:
        return Response({'error': 'Not authenticated'}, status=401)

    url = f'https://api.myanimelist.net/v2/anime/{anime_id}'
    params = {
      'fields': 'id,title,main_picture,alternative_titles,'
                'start_date,end_date,synopsis,mean,rank,'
                'popularity,num_list_users,num_scoring_users,'
                'nsfw,created_at,updated_at,media_type,status,'
                'genres,my_list_status,num_episodes,start_season,'
                'broadcast,source,average_episode_duration,'
                'rating,pictures,background,related_anime,'
                'related_manga,recommendations,studios,statistics'
    }
    headers = {'Authorization': f'Bearer {token}'}
    r = requests.get(url, headers=headers, params=params)
    if r.status_code == 200:
        return Response(r.json())
    return Response({'error': 'MAL error', 'details': r.text}, status=r.status_code)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_anime(request):
    token = request.session.get("mal_access_token")
    if not token:
        return Response({"error": "Not authenticated"}, status=401)

    query = request.GET.get("q")
    limit = request.GET.get("limit", 10)

    if not query:
        return Response({"error": "Missing search query"}, status=400)

    url = "https://api.myanimelist.net/v2/anime"
    headers = {"Authorization": f"Bearer {token}"}
    params = {
        "q": query,
        "limit": limit
    }

    r = requests.get(url, headers=headers, params=params)
    if r.status_code == 200:
        return Response(r.json())
    
    return Response({"error": "MAL error", "details": r.text}, status=r.status_code)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_stats_data(request):
    """
    Fetches detailed anime data from MAL for stats calculations
    """
    token = request.session.get("mal_access_token")
    if not token:
        return Response({"error": "Not authenticated"}, status=401)

    # Get user's anime list with detailed fields
    headers = {"Authorization": f"Bearer {token}"}
    url = "https://api.myanimelist.net/v2/users/@me/animelist"
    params = {
        "fields": "list_status,genres,studios,num_episodes,average_episode_duration,media_type",
        "limit": 1000,
        "status": "completed"  # Focus on completed anime for accurate stats
    }
    
    response = requests.get(url, headers=headers, params=params)
    
    if response.status_code != 200:
        return Response({"error": "Failed to fetch anime list", "details": response.text}, status=400)
    
    anime_data = response.json().get("data", [])
    
    # Process data for stats
    stats_list = []
    for item in anime_data:
        anime = item["node"]
        list_status = item.get("list_status", {})
        
        stats_list.append({
            "title": anime.get("title"),
            "score": list_status.get("score", 0),
            "genres": [g["name"] for g in anime.get("genres", [])],
            "studios": [s["name"] for s in anime.get("studios", [])],
            "num_episodes": anime.get("num_episodes", 0),
            "average_episode_duration": anime.get("average_episode_duration", 0),
            "media_type": anime.get("media_type", ""),
        })
    
    return Response(stats_list)


# ============= RECOMMENDATIONS SYSTEM =============

# Configure Gemini
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_recommendations(request):
    """
    Main recommendation endpoint - generates personalized anime recommendations
    """
    token = request.session.get("mal_access_token")
    if not token:
        return Response({"error": "Not authenticated"}, status=401)

    # Get user's completed/high-rated anime
    headers = {"Authorization": f"Bearer {token}"}
    url = "https://api.myanimelist.net/v2/users/@me/animelist"
    params = {
        "fields": "list_status,genres,studios,themes,media_type",
        "limit": 1000,
        "status": "completed"
    }
    
    response = requests.get(url, headers=headers, params=params)
    if response.status_code != 200:
        return Response({"error": "Failed to fetch anime list"}, status=400)
    
    user_anime = response.json().get("data", [])
    
    # Extract user preferences
    watched_ids = set()
    genre_scores = defaultdict(int)
    studio_scores = defaultdict(int)
    theme_scores = defaultdict(int)
    high_rated_anime = []
    
    for item in user_anime:
        anime = item["node"]
        list_status = item.get("list_status", {})
        score = list_status.get("score", 0)
        
        watched_ids.add(anime["id"])
        
        # Weight by user's score
        weight = max(score - 5, 0) if score > 0 else 0
        
        if score >= 8:
            high_rated_anime.append({
                "id": anime["id"],
                "title": anime.get("title"),
                "genres": [g["name"] for g in anime.get("genres", [])],
                "studios": [s["name"] for s in anime.get("studios", [])],
                "themes": [t["name"] for t in anime.get("themes", [])]
            })
        
        # Build preference profile
        for genre in anime.get("genres", []):
            genre_scores[genre["name"]] += weight
        for studio in anime.get("studios", []):
            studio_scores[studio["name"]] += weight
        for theme in anime.get("themes", []):
            theme_scores[theme["name"]] += weight
    
    # Get top preferences
    top_genres = sorted(genre_scores.items(), key=lambda x: x[1], reverse=True)[:5]
    top_studios = sorted(studio_scores.items(), key=lambda x: x[1], reverse=True)[:3]
    
    # Pick ONE random anchor from high-rated anime (changes on regenerate)
    import random
    anchor = random.choice(high_rated_anime) if high_rated_anime else None
    
    # Generate recommendations from different angles
    recommendations = {
        "because_you_liked": [],
        "from_genres": [],
        "from_studios": [],
        "hidden_gems": []
    }
    
    # 1. Because you liked X (ONE random anchor, changes on regenerate)
    if anchor:
        similar = find_similar_anime(token, anchor, watched_ids)
        if similar:
            recommendations["because_you_liked"].append({
                "anchor": anchor["title"],
                "anime": similar[:6]  # Show 6 recommendations
            })
    
    # 2. From your favorite genres
    if top_genres:
        genre_name = top_genres[0][0]
        genre_anime = search_by_genre(token, genre_name, watched_ids, limit=10)
        recommendations["from_genres"] = {
            "genre": genre_name,
            "anime": genre_anime
        }
    
    # 3. From your favorite studios
    if top_studios:
        studio_name = top_studios[0][0]
        studio_anime = search_by_studio(token, studio_name, watched_ids, limit=8)
        recommendations["from_studios"] = {
            "studio": studio_name,
            "anime": studio_anime
        }
    
    # 4. Hidden gems (high-rated but less popular)
    if top_genres:
        gems = find_hidden_gems(token, [g[0] for g in top_genres], watched_ids)
        recommendations["hidden_gems"] = gems[:8]
    
    return Response(recommendations)


def find_similar_anime(token, anchor_anime, watched_ids):
    """Find anime similar to the anchor based on genres/themes"""
    headers = {"Authorization": f"Bearer {token}"}
    
    # Search using anchor's main genre
    if not anchor_anime.get("genres"):
        return []
    
    main_genre = anchor_anime["genres"][0] if anchor_anime["genres"] else ""
    
    url = "https://api.myanimelist.net/v2/anime"
    params = {
        "q": main_genre,
        "limit": 50,  # Get more to filter through
        "fields": "id,title,main_picture,genres,themes,mean,popularity,num_list_users"
    }
    
    response = requests.get(url, headers=headers, params=params)
    if response.status_code != 200:
        return []
    
    results = response.json().get("data", [])
    similar = []
    seen_base_titles = set()  # Track base titles to avoid sequels
    
    for item in results:
        anime = item["node"]
        if anime["id"] in watched_ids:
            continue
        
        # QUALITY FILTERS - only recommend popular/good shows
        score = anime.get("mean", 0)
        popularity_rank = anime.get("popularity", 99999)
        num_users = anime.get("num_list_users", 0)
        
        # Skip if: score too low, too niche, or too unpopular
        if score < 6.5 or popularity_rank > 5000 or num_users < 10000:
            continue
        
        # Filter out sequels/seasons - keep only first entry per series
        title = anime.get("title", "")
        base_title = extract_base_title(title)
        if base_title in seen_base_titles:
            continue
        seen_base_titles.add(base_title)
        
        # Calculate similarity score
        genre_overlap = len(set(anchor_anime["genres"]) & 
                           set(g["name"] for g in anime.get("genres", [])))
        theme_overlap = len(set(anchor_anime.get("themes", [])) & 
                          set(t["name"] for t in anime.get("themes", [])))
        
        similarity_score = genre_overlap * 2 + theme_overlap
        
        if similarity_score > 0:
            similar.append({
                "id": anime["id"],
                "title": title,
                "image": anime.get("main_picture", {}).get("medium"),
                "score": score,
                "popularity": popularity_rank,
                "similarity": similarity_score
            })
    
    # Sort by similarity, then by score
    return sorted(similar, key=lambda x: (x["similarity"], x["score"]), reverse=True)


def extract_base_title(title):
    """Extract base title without season/sequel markers"""
    # Remove common sequel markers
    import re
    # Remove patterns like: 2nd Season, Season 2, Part 2, II, III, etc.
    base = re.sub(r'\s+(2nd|3rd|Season|Part|Episode|OVA|Movie|Special|Final).*', '', title, flags=re.IGNORECASE)
    base = re.sub(r'\s+[IVX]+$', '', base)  # Remove roman numerals at end
    base = re.sub(r'\s+\d+$', '', base)  # Remove numbers at end
    base = re.sub(r'[:\-].*', '', base)  # Remove everything after : or -
    return base.strip()


def search_by_genre(token, genre_name, watched_ids, limit=10):
    """Search anime by genre"""
    headers = {"Authorization": f"Bearer {token}"}
    url = "https://api.myanimelist.net/v2/anime"
    params = {
        "q": genre_name,
        "limit": 50,
        "fields": "id,title,main_picture,mean,popularity,genres,num_list_users"
    }
    
    response = requests.get(url, headers=headers, params=params)
    if response.status_code != 200:
        return []
    
    results = response.json().get("data", [])
    anime_list = []
    seen_base_titles = set()
    
    for item in results:
        anime = item["node"]
        if anime["id"] in watched_ids:
            continue
        
        # Quality filters
        score = anime.get("mean", 0)
        popularity_rank = anime.get("popularity", 99999)
        num_users = anime.get("num_list_users", 0)
        
        if score < 6.5 or popularity_rank > 5000 or num_users < 10000:
            continue
        
        # Filter sequels
        title = anime.get("title", "")
        base_title = extract_base_title(title)
        if base_title in seen_base_titles:
            continue
        seen_base_titles.add(base_title)
        
        # Check if genre matches
        if any(g["name"].lower() == genre_name.lower() for g in anime.get("genres", [])):
            anime_list.append({
                "id": anime["id"],
                "title": title,
                "image": anime.get("main_picture", {}).get("medium"),
                "score": score
            })
    
    return sorted(anime_list, key=lambda x: x["score"], reverse=True)[:limit]


def search_by_studio(token, studio_name, watched_ids, limit=8):
    """Search anime by studio"""
    headers = {"Authorization": f"Bearer {token}"}
    url = "https://api.myanimelist.net/v2/anime"
    params = {
        "q": studio_name,
        "limit": 50,
        "fields": "id,title,main_picture,mean,studios,popularity,num_list_users"
    }
    
    response = requests.get(url, headers=headers, params=params)
    if response.status_code != 200:
        return []
    
    results = response.json().get("data", [])
    anime_list = []
    seen_base_titles = set()
    
    for item in results:
        anime = item["node"]
        if anime["id"] in watched_ids:
            continue
        
        # Quality filters
        score = anime.get("mean", 0)
        popularity_rank = anime.get("popularity", 99999)
        num_users = anime.get("num_list_users", 0)
        
        if score < 6.5 or popularity_rank > 5000 or num_users < 10000:
            continue
        
        # Filter sequels
        title = anime.get("title", "")
        base_title = extract_base_title(title)
        if base_title in seen_base_titles:
            continue
        seen_base_titles.add(base_title)
        
        if any(s["name"].lower() == studio_name.lower() for s in anime.get("studios", [])):
            anime_list.append({
                "id": anime["id"],
                "title": title,
                "image": anime.get("main_picture", {}).get("medium"),
                "score": score
            })
    
    return sorted(anime_list, key=lambda x: x["score"], reverse=True)[:limit]


def find_hidden_gems(token, genres, watched_ids):
    """Find highly-rated but less popular anime"""
    headers = {"Authorization": f"Bearer {token}"}
    url = "https://api.myanimelist.net/v2/anime"
    
    all_gems = []
    seen_base_titles = set()
    
    for genre in genres[:2]:  # Search top 2 genres
        params = {
            "q": genre,
            "limit": 30,
            "fields": "id,title,main_picture,mean,popularity,num_list_users"
        }
        
        response = requests.get(url, headers=headers, params=params)
        if response.status_code == 200:
            results = response.json().get("data", [])
            for item in results:
                anime = item["node"]
                if anime["id"] not in watched_ids:
                    score = anime.get("mean", 0)
                    popularity = anime.get("popularity", 99999)
                    num_users = anime.get("num_list_users", 0)
                    
                    # Hidden gem: good score (>7.0), somewhat popular but not mainstream (1000-5000), decent user count
                    if score > 7.0 and 1000 < popularity < 5000 and num_users > 5000:
                        title = anime.get("title", "")
                        base_title = extract_base_title(title)
                        if base_title in seen_base_titles:
                            continue
                        seen_base_titles.add(base_title)
                        
                        all_gems.append({
                            "id": anime["id"],
                            "title": title,
                            "image": anime.get("main_picture", {}).get("medium"),
                            "score": score,
                            "popularity": popularity
                        })
    
    return sorted(all_gems, key=lambda x: x["score"], reverse=True)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def ai_recommendation_chat(request):
    """
    AI chatbot for recommendations - enhances algorithm results with natural language
    """
    if not GEMINI_API_KEY:
        return Response({"error": "AI service not configured"}, status=503)
    
    user_message = request.data.get("message", "")
    user_anime_context = request.data.get("context", [])  # List of user's watched anime
    algorithm_suggestions = request.data.get("suggestions", [])  # Anime IDs from our algorithm
    
    if not user_message:
        return Response({"error": "Message is required"}, status=400)
    
    # Build context prompt
    watched_titles = [anime.get("title", "") for anime in user_anime_context[:20]]
    suggested_titles = [anime.get("title", "") for anime in algorithm_suggestions[:10]]
    
    prompt = f"""You are an anime recommendation assistant helping a user discover new anime.

User's Context:
- They have watched: {', '.join(watched_titles[:10])}
- Our algorithm suggests: {', '.join(suggested_titles[:5])}

User's Question: "{user_message}"

Your Role:
1. Use the algorithm's suggestions as your primary recommendations
2. Explain WHY these suggestions match the user's taste based on their watch history
3. Present recommendations in a natural, conversational way
4. If the user asks about specific anime, relate them to the algorithm's suggestions
5. Keep responses concise (2-3 sentences per anime)

Response format:
- Start with a brief acknowledgment of their question
- Highlight 2-3 anime from the algorithm's suggestions that best match their query
- Explain the connection to their watch history
"""
    
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content(prompt)
        
        return Response({
            "message": response.text,
            "suggestions": suggested_titles
        })
    except Exception as e:
        return Response({"error": f"AI service error: {str(e)}"}, status=500)
