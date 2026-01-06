import requests
import base64, os
from google import genai
from google.genai import types
from collections import defaultdict
import json

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.permissions import IsAuthenticated

from django.conf import settings
from django.shortcuts import redirect
from django.http import JsonResponse, HttpResponse

from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.contrib.auth import login
from django.contrib.auth import logout

from django.views.decorators.csrf import csrf_exempt

from django.shortcuts import redirect

from .models import AnimeEntry
from .models import UserProfile

# MAL Genre ID mapping (fetched from MAL API)
GENRE_IDS = {
    "Action": 1,
    "Adventure": 2,
    "Racing": 3,
    "Comedy": 4,
    "Avant Garde": 5,
    "Mythology": 6,
    "Mystery": 7,
    "Drama": 8,
    "Ecchi": 9,
    "Fantasy": 10,
    "Strategy Game": 11,
    "Historical": 13,
    "Horror": 14,
    "Kids": 15,
    "Martial Arts": 17,
    "Mecha": 18,
    "Music": 19,
    "Parody": 20,
    "Samurai": 21,
    "Romance": 22,
    "School": 23,
    "Sci-Fi": 24,
    "Shoujo": 25,
    "Girls Love": 26,
    "Shounen": 27,
    "Space": 29,
    "Sports": 30,
    "Super Power": 31,
    "Vampire": 32,
    "Harem": 35,
    "Slice of Life": 36,
    "Supernatural": 37,
    "Military": 38,
    "Detective": 39,
    "Psychological": 40,
    "Suspense": 41,
    "Seinen": 42,
    "Josei": 43,
    "Award Winning": 46,
    "Gourmet": 47,
    "Workplace": 48,
    "Adult Cast": 50,
    "Anthropomorphic": 51,
    "CGDCT": 52,
    "Childcare": 53,
    "Combat Sports": 54,
    "Delinquents": 55,
    "Educational": 56,
    "Gag Humor": 57,
    "Gore": 58,
    "High Stakes Game": 59,
    "Idols (Female)": 60,
    "Isekai": 62,
    "Iyashikei": 63,
    "Love Polygon": 64,
    "Magical Sex Shift": 65,
    "Mahou Shoujo": 66,
    "Medical": 67,
    "Organized Crime": 68,
    "Otaku Culture": 69,
    "Performing Arts": 70,
    "Reincarnation": 72,
    "Reverse Harem": 73,
    "Love Status Quo": 74,
    "Showbiz": 75,
    "Survival": 76,
    "Team Sports": 77,
    "Time Travel": 78,
    "Video Game": 79,
    "Crossdressing": 81,
    "Urban Fantasy": 82,
    "Villainess": 83,
}

# Health check endpoint
@csrf_exempt
@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    return Response({
        "status": "healthy",
        "service": "next-weeb-api",
        "message": "Server is running"
    }, status=200)

# CSRF token endpoint for cross-origin requests
@api_view(['GET'])
@permission_classes([AllowAny])
def get_csrf_token(request):
    from django.middleware.csrf import get_token
    return Response({
        "csrfToken": get_token(request)
    })

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

        profile, created = UserProfile.objects.get_or_create(user=user)
        profile.mal_access_token = access_token
        
        # Store profile data on first login
        profile.name = mal_user.get("name")
        profile.birthday = mal_user.get("birthday")
        profile.location = mal_user.get("location")
        profile.joined_at = mal_user.get("joined_at")
        profile.picture = mal_user.get("picture")
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

# Configure Gemini using new SDK
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')
gemini_client = None
if GEMINI_API_KEY:
    gemini_client = genai.Client(api_key=GEMINI_API_KEY)

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
                "genres": anime.get("genres", []),
                "studios": anime.get("studios", []),
                "themes": anime.get("themes", []),
                "mean": anime.get("mean", 0),
                "popularity": anime.get("popularity", 99999)
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


def get_genre_compatibility(genre1, genre2):
    """
    Calculate compatibility score between two genres.
    Higher score = genres that pair well together.
    """
    # Define genre compatibility matrix - genres that commonly pair well
    compatibility_map = {
        # Music pairs well with
        "Music": {"Slice of Life": 3, "Drama": 2, "Comedy": 2, "School": 2},
        # Action pairs well with
        "Action": {"Adventure": 3, "Fantasy": 3, "Sci-Fi": 2, "Supernatural": 2, "Shounen": 2},
        # Romance pairs well with
        "Romance": {"Comedy": 3, "Drama": 3, "School": 2, "Slice of Life": 2, "Shoujo": 2},
        # Drama pairs well with
        "Drama": {"Romance": 3, "Slice of Life": 2, "Psychological": 2, "Music": 2},
        # Comedy pairs well with
        "Comedy": {"Slice of Life": 3, "Romance": 3, "School": 2, "Parody": 2},
        # Slice of Life pairs well with
        "Slice of Life": {"Comedy": 3, "Music": 3, "School": 2, "Iyashikei": 3},
        # Psychological pairs well with
        "Psychological": {"Thriller": 3, "Mystery": 3, "Supernatural": 2, "Drama": 2},
        # Fantasy pairs well with
        "Fantasy": {"Adventure": 3, "Action": 3, "Magic": 3, "Isekai": 2},
        # Sci-Fi pairs well with
        "Sci-Fi": {"Action": 2, "Mecha": 3, "Space": 3, "Psychological": 2},
        # Mystery pairs well with
        "Mystery": {"Psychological": 3, "Thriller": 3, "Supernatural": 2, "Detective": 3},
        # Sports pairs well with
        "Sports": {"Drama": 2, "School": 2, "Comedy": 2},
        # Shounen pairs well with
        "Shounen": {"Action": 2, "Adventure": 2, "Supernatural": 2, "Comedy": 2},
    }
    
    # Check both directions for compatibility
    score = compatibility_map.get(genre1, {}).get(genre2, 0)
    if score == 0:
        score = compatibility_map.get(genre2, {}).get(genre1, 0)
    
    return score


def calculate_similarity_score(anchor_anime, candidate_anime):
    """
    Calculate comprehensive similarity score between anchor and candidate.
    Factors: genre matching (weighted), theme overlap, score proximity, popularity tier.
    """
    anchor_genres = [g["name"] for g in anchor_anime.get("genres", [])]
    candidate_genres = [g["name"] for g in candidate_anime.get("genres", [])]
    anchor_themes = [t["name"] for t in anchor_anime.get("themes", [])]
    candidate_themes = [t["name"] for t in candidate_anime.get("themes", [])]
    
    # 1. Primary genre match (first 2 genres are most important)
    primary_genre_bonus = 0
    if anchor_genres and candidate_genres:
        # Exact match on primary genre is huge
        if anchor_genres[0] == candidate_genres[0]:
            primary_genre_bonus = 5
        # Primary genre appears anywhere in candidate
        elif anchor_genres[0] in candidate_genres:
            primary_genre_bonus = 3
        # Secondary genre match
        if len(anchor_genres) > 1 and anchor_genres[1] in candidate_genres[:2]:
            primary_genre_bonus += 2
    
    # 2. Genre compatibility bonus (do these genres work well together?)
    compatibility_bonus = 0
    for ag in anchor_genres[:2]:  # Check anchor's top 2 genres
        for cg in candidate_genres[:2]:  # Against candidate's top 2
            compatibility_bonus += get_genre_compatibility(ag, cg)
    
    # 3. Overall genre overlap (remaining genres)
    genre_set_overlap = len(set(anchor_genres) & set(candidate_genres))
    
    # 4. Theme overlap
    theme_overlap = len(set(anchor_themes) & set(candidate_themes))
    
    # 5. Score proximity bonus (same quality tier)
    anchor_score = anchor_anime.get("mean", 0)
    candidate_score = candidate_anime.get("mean", 0)
    score_diff = abs(anchor_score - candidate_score)
    
    # Lower bound only: if anchor is 8.7, accept 7.7-10.0
    min_acceptable_score = max(7.5, anchor_score - 1.0)
    if candidate_score < min_acceptable_score:
        return 0  # Reject if too low quality
    
    # Bonus for similar scores (within 0.5 = great, within 1.0 = good)
    if score_diff <= 0.5:
        score_proximity_bonus = 3
    elif score_diff <= 1.0:
        score_proximity_bonus = 2
    else:
        score_proximity_bonus = 0
    
    # 6. Popularity tier matching
    anchor_pop = anchor_anime.get("popularity", 99999)
    candidate_pop = candidate_anime.get("popularity", 99999)
    
    popularity_bonus = 0
    if anchor_pop < 500:  # Very popular anchor
        # Prefer popular recommendations
        if candidate_pop < 1000:
            popularity_bonus = 2
    elif anchor_pop < 2000:  # Moderately popular
        if candidate_pop < 3000:
            popularity_bonus = 1
    # No penalty for niche anchors - let genre/score guide
    
    # TOTAL SIMILARITY SCORE
    similarity = (
        primary_genre_bonus * 5 +      # Primary genre match is crucial (0-25 points)
        compatibility_bonus * 2 +       # Genre compatibility (0-12 points)
        genre_set_overlap * 2 +         # Other matching genres (0-10 points)
        theme_overlap * 1 +             # Themes (0-5 points)
        score_proximity_bonus * 3 +     # Similar quality (0-9 points)
        popularity_bonus * 2            # Popularity tier (0-4 points)
    )
    
    return similarity


def find_similar_anime(token, anchor_anime, watched_ids):
    """Find anime similar to the anchor by fetching popular anime and filtering by genre"""
    import json
    from pathlib import Path
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Search using anchor's main genre
    if not anchor_anime.get("genres"):
        return []
    
    anchor_genres = anchor_anime.get("genres", [])
    main_genre = anchor_genres[0]["name"] if anchor_genres else ""
    secondary_genre = anchor_genres[1]["name"] if len(anchor_genres) > 1 else None
    anchor_score = anchor_anime.get("mean", 0)
    anchor_popularity = anchor_anime.get("popularity", 99999)
    
    # Initialize debug log
    debug_log = {
        "anchor_anime": {
            "title": anchor_anime.get("title"),
            "score": anchor_score,
            "popularity": anchor_popularity,
            "genres": [g["name"] for g in anchor_genres],
            "themes": [t["name"] for t in anchor_anime.get("themes", [])]
        },
        "search_strategy": {},
        "filters": {},
        "final_results": []
    }
    
    # Get genre IDs for filtering
    main_genre_id = GENRE_IDS.get(main_genre)
    secondary_genre_id = GENRE_IDS.get(secondary_genre) if secondary_genre else None
    
    # Fetch top-ranked anime by popularity and filter by genre
    all_candidates = {}
    ranking_url = "https://api.myanimelist.net/v2/anime/ranking"
    
    # Fetch popular anime (increased limit for better coverage)
    params = {
        "ranking_type": "bypopularity",
        "limit": 500,  # Increased from 100 to 500
        "fields": "id,title,main_picture,genres,themes,mean,popularity,num_list_users"
    }
    
    search_results = []
    response = requests.get(ranking_url, headers=headers, params=params)
    
    if response.status_code == 200:
        for item in response.json().get("data", []):
            anime = item["node"]
            anime_genre_ids = [g.get("id") for g in anime.get("genres", [])]
            
            # Only include if it has the main or secondary genre
            if main_genre_id in anime_genre_ids or (secondary_genre_id and secondary_genre_id in anime_genre_ids):
                all_candidates[anime["id"]] = anime
                search_results.append({
                    "id": anime["id"],
                    "title": anime.get("title"),
                    "score": anime.get("mean", 0),
                    "popularity": anime.get("popularity", 99999),
                    "genres": [g["name"] for g in anime.get("genres", [])]
                })
    
    debug_log["search_strategy"] = {
        "method": "Popular anime ranking filtered by genre",
        "ranking_type": "bypopularity",
        "limit": 500,
        "main_genre": main_genre,
        "main_genre_id": main_genre_id,
        "secondary_genre": secondary_genre,
        "secondary_genre_id": secondary_genre_id,
        "filter": f"Has {main_genre} (ID:{main_genre_id})" + (f" or {secondary_genre} (ID:{secondary_genre_id})" if secondary_genre_id else ""),
        "total_found": len(search_results),
        "results": search_results
    }
    
    debug_log["total_unique_candidates"] = len(all_candidates)
    
    results = list(all_candidates.values())
    similar = []
    seen_base_titles = set()
    
    # Track filtering stages
    filtered_already_watched = []
    filtered_low_score = []
    filtered_low_popularity = []
    filtered_sequels = []
    passed_filters = []
    
    for anime in results:
        anime_id = anime["id"]
        title = anime.get("title", "")
        score = anime.get("mean", 0)
        popularity_rank = anime.get("popularity", 99999)
        num_users = anime.get("num_list_users", 0)
        
        anime_info = {
            "id": anime_id,
            "title": title,
            "score": score,
            "popularity": popularity_rank,
            "num_users": num_users,
            "genres": [g["name"] for g in anime.get("genres", [])]
        }
        
        # Filter 1: Already watched
        if anime_id in watched_ids:
            filtered_already_watched.append(anime_info)
            continue
        
        # Filter 2: Score too low (relaxed from 7.5 to 7.0 minimum)
        min_score = max(7.0, anchor_score - 1.5)
        if score < min_score:
            filtered_low_score.append({**anime_info, "reason": f"Score {score} < {min_score}"})
            continue
        
        # Filter 3: Popularity/users filters (relaxed limits for larger pool)
        failed_popularity = False
        popularity_reason = ""
        
        # More lenient filters since we're working with top 500 popular anime
        if anchor_popularity < 500:
            # Very popular anchor - still prefer popular shows but more lenient
            if num_users < 30000:
                failed_popularity = True
                popularity_reason = f"Anchor very popular (<500), candidate users={num_users} too low"
        elif anchor_popularity < 2000:
            # Moderately popular - accept wider range
            if num_users < 15000:
                failed_popularity = True
                popularity_reason = f"Anchor moderate (<2000), candidate users={num_users} too low"
        else:
            # Niche anchor - very lenient
            if num_users < 5000:
                failed_popularity = True
                popularity_reason = f"Anchor niche, candidate users={num_users} too low"
        
        if failed_popularity:
            filtered_low_popularity.append({**anime_info, "reason": popularity_reason})
            continue
        
        # Filter 4: Sequels
        base_title = extract_base_title(title)
        if base_title in seen_base_titles:
            filtered_sequels.append({**anime_info, "base_title": base_title})
            continue
        seen_base_titles.add(base_title)
        
        # Calculate comprehensive similarity score
        similarity_score = calculate_similarity_score(anchor_anime, anime)
        
        if similarity_score > 0:
            anime_with_similarity = {
                **anime_info,
                "similarity_score": similarity_score
            }
            passed_filters.append(anime_with_similarity)
            
            similar.append({
                "id": anime["id"],
                "title": title,
                "image": anime.get("main_picture", {}).get("medium"),
                "score": score,
                "popularity": popularity_rank,
                "similarity": similarity_score
            })
    
    debug_log["filters"] = {
        "filter_1_already_watched": {
            "count": len(filtered_already_watched),
            "anime": filtered_already_watched
        },
        "filter_2_low_score": {
            "count": len(filtered_low_score),
            "min_required": max(7.0, anchor_score - 1.5),
            "note": "Relaxed from 7.5 to 7.0 minimum, anchor -1.5 instead of -1.0",
            "anime": filtered_low_score
        },
        "filter_3_popularity_users": {
            "count": len(filtered_low_popularity),
            "anime": filtered_low_popularity
        },
        "filter_4_sequels": {
            "count": len(filtered_sequels),
            "anime": filtered_sequels
        },
        "passed_all_filters": {
            "count": len(passed_filters),
            "anime": sorted(passed_filters, key=lambda x: x["similarity_score"], reverse=True)
        }
    }
    
    # Sort by COMBINED similarity and score (not just similarity alone)
    final_sorted = sorted(similar, key=lambda x: (x["similarity"], x["score"]), reverse=True)
    
    debug_log["final_results"] = [{
        "rank": i+1,
        "title": a["title"],
        "score": a["score"],
        "popularity": a["popularity"],
        "similarity_score": a["similarity"]
    } for i, a in enumerate(final_sorted)]
    
    # Save debug log to file
    anchor_title_clean = "".join(c for c in anchor_anime.get("title", "unknown") if c.isalnum() or c in (' ', '-', '_')).strip()
    anchor_title_clean = anchor_title_clean.replace(" ", "-")[:50]  # Limit filename length
    
    debug_dir = Path(__file__).parent.parent / "debug_recommendations"
    debug_dir.mkdir(exist_ok=True)
    
    debug_file = debug_dir / f"{anchor_title_clean}-recs.json"
    with open(debug_file, 'w', encoding='utf-8') as f:
        json.dump(debug_log, f, indent=2, ensure_ascii=False)
    
    print(f"DEBUG: Saved recommendation analysis to {debug_file}")
    
    return final_sorted


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
    print(f"[AI Chat] Request received from user: {request.user.username}")
    
    if not GEMINI_API_KEY:
        print("[AI Chat] ERROR: No Gemini API key configured")
        return Response({"error": "AI service not configured"}, status=503)
    
    user_message = request.data.get("message", "")
    user_anime_context = request.data.get("context", [])
    algorithm_suggestions = request.data.get("suggestions", [])
    
    print(f"[AI Chat] User message: {user_message[:50]}...")
    
    if not user_message:
        return Response({"error": "Message is required"}, status=400)
    
    # Build context prompt
    watched_titles = [anime.get("title", "") for anime in user_anime_context[:10]]
    suggested_titles = [anime.get("title", "") for anime in algorithm_suggestions[:10]]
    
    prompt = f"""You are a concise anime recommendation assistant.

User has watched and enjoyed: {', '.join(watched_titles)}

User asks: "{user_message}"

Respond in 2-3 short sentences. Be direct and helpful."""
    
    # Debug: Log prompt details
    print(f"[AI Chat] Watched titles count: {len(watched_titles)}")
    print(f"[AI Chat] Total prompt length: {len(prompt)} chars")
    
    try:
        print("[AI Chat] Calling Gemini API...")
        import time
        start_time = time.time()
        
        # Configure safety settings using new SDK
        config = types.GenerateContentConfig(
            temperature=0.7,
            max_output_tokens=2000,
            safety_settings=[
                types.SafetySetting(
                    category=types.HarmCategory.HARM_CATEGORY_HARASSMENT,
                    threshold=types.HarmBlockThreshold.BLOCK_NONE,
                ),
                types.SafetySetting(
                    category=types.HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                    threshold=types.HarmBlockThreshold.BLOCK_NONE,
                ),
                types.SafetySetting(
                    category=types.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                    threshold=types.HarmBlockThreshold.BLOCK_NONE,
                ),
                types.SafetySetting(
                    category=types.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                    threshold=types.HarmBlockThreshold.BLOCK_NONE,
                ),
            ]
        )
        
        response = gemini_client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=config
        )
        
        elapsed = time.time() - start_time
        print(f"[AI Chat] Gemini responded in {elapsed:.2f}s")
        
        # Check if response has text
        if not response.text:
            print(f"[AI Chat] Response blocked or empty.")
            if response.candidates and len(response.candidates) > 0:
                finish_reason = response.candidates[0].finish_reason
                print(f"[AI Chat] Finish reason: {finish_reason}")
                
                if finish_reason == 'MAX_TOKENS':
                    return Response({
                        "message": "Response got cut off (too long). Try asking a shorter question.",
                        "suggestions": suggested_titles
                    })
                elif finish_reason == 'SAFETY':
                    return Response({
                        "message": "Content was filtered by safety settings. Try rephrasing your question.",
                        "suggestions": suggested_titles
                    })
            
            return Response({
                "message": "Couldn't generate a response. Try asking differently.",
                "suggestions": suggested_titles
            })
        
        print(f"[AI Chat] Response length: {len(response.text)} chars")
        
        return Response({
            "message": response.text,
            "suggestions": suggested_titles
        })
    except Exception as e:
        print(f"[AI Chat] ERROR: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        
        # Parse error and give user-friendly messages
        error_str = str(e).lower()
        
        if '503' in error_str or 'overloaded' in error_str or 'unavailable' in error_str:
            error_message = "Gemini is lowkey overloaded right now. Try again in a few minutes."
        elif '429' in error_str or 'rate limit' in error_str or 'quota' in error_str:
            error_message = "Hit the rate limit! We're sending too many requests. Wait a minute and try again."
        elif '401' in error_str or 'unauthorized' in error_str or 'api key' in error_str:
            error_message = "API key issue. Something's wrong on our end. Contact support."
        elif '400' in error_str or 'invalid' in error_str:
            error_message = "Your message couldn't be processed. Try rephrasing?"
        elif 'timeout' in error_str or 'timed out' in error_str:
            error_message = "Request timed out. Gemini's taking too long. Try again."
        else:
            error_message = f"AI ran into an issue: {type(e).__name__}. Try again or rephrase your question."
        
        return Response({
            "message": error_message,
            "suggestions": suggested_titles
        })


# PostHog reverse proxy to bypass ad blockers
@csrf_exempt
@api_view(['POST', 'GET'])
@permission_classes([AllowAny])
def posthog_proxy(request, path=''):
    """Proxy PostHog requests through our backend to bypass ad blockers"""
    posthog_host = 'https://us.i.posthog.com'
    
    # Build the full URL with the path from the URL parameter
    url = f"{posthog_host}/{path}"
    
    # Forward query parameters
    query_string = request.META.get('QUERY_STRING', '')
    if query_string:
        url += '?' + query_string
    
    try:
        if request.method == 'POST':
            response = requests.post(
                url,
                data=request.body,
                headers={
                    'Content-Type': request.headers.get('Content-Type', 'application/json'),
                    'User-Agent': request.headers.get('User-Agent', ''),
                },
                timeout=10
            )
        else:
            response = requests.get(
                url,
                headers={
                    'User-Agent': request.headers.get('User-Agent', ''),
                },
                timeout=10
            )
        
        return HttpResponse(
            response.content,
            status=response.status_code,
            content_type=response.headers.get('Content-Type', 'application/json')
        )
    except Exception as e:
        print(f"[PostHog Proxy Error] {e}")
        return HttpResponse(
            json.dumps({'error': str(e)}),
            status=500,
            content_type='application/json'
        )
