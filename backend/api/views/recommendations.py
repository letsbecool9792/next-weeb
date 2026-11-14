"""The recommendations page."""
import random
from collections import defaultdict

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ..mal import mal_get
from ..recommender import find_hidden_gems, find_similar_anime, search_by_genre, search_by_studio


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_recommendations(request):
    """
    Main recommendation endpoint - generates personalized anime recommendations
    """
    user = request.user

    # Get user's completed/high-rated anime
    user_anime = mal_get(user, "/users/@me/animelist", {
        "fields": "list_status,genres,studios,themes,media_type",
        "limit": 1000,
        "status": "completed",
    }).get("data", [])
    
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
        similar = find_similar_anime(user, anchor, watched_ids)
        if similar:
            recommendations["because_you_liked"].append({
                "anchor": anchor["title"],
                "anime": similar[:6]  # Show 6 recommendations
            })
    
    # 2. From your favorite genres
    if top_genres:
        genre_name = top_genres[0][0]
        genre_anime = search_by_genre(user, genre_name, watched_ids, limit=10)
        recommendations["from_genres"] = {
            "genre": genre_name,
            "anime": genre_anime
        }
    
    # 3. From your favorite studios
    if top_studios:
        studio_name = top_studios[0][0]
        studio_anime = search_by_studio(user, studio_name, watched_ids, limit=8)
        recommendations["from_studios"] = {
            "studio": studio_name,
            "anime": studio_anime
        }
    
    # 4. Hidden gems (high-rated but less popular)
    if top_genres:
        gems = find_hidden_gems(user, [g[0] for g in top_genres], watched_ids)
        recommendations["hidden_gems"] = gems[:8]
    
    return Response(recommendations)
