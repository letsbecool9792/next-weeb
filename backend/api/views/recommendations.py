"""The recommendations page."""
from django.core.cache import cache
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .. import sync
from ..models import UserProfile
from ..recommender import build_recommendations

CACHE_SECONDS = 6 * 60 * 60


def cache_key(user):
    """
    Includes the last sync time, so syncing the list automatically makes
    the next visit compute fresh recommendations.
    """
    profile = UserProfile.objects.filter(user=user).only("last_synced_at").first()
    synced = profile.last_synced_at.timestamp() if profile and profile.last_synced_at else 0
    return f"recs:v3:{user.id}:{synced:.0f}"


def get_cached_recommendations(user, regenerate=False):
    """Shared with the AI chat, which reuses the same picks as its candidates."""
    sync.ensure_synced(user)
    key = cache_key(user)
    if not regenerate:
        cached = cache.get(key)
        if cached is not None:
            return cached
    data = build_recommendations(user, regenerate=regenerate)
    cache.set(key, data, CACHE_SECONDS)  # a regenerated page is what the next visit shows
    return data


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_recommendations(request):
    """GET /api/recommendations/  (add ?regenerate=1 for a reshuffled page)"""
    regenerate = request.GET.get("regenerate") == "1"
    data = get_cached_recommendations(request.user, regenerate)
    # Keys starting with "_" are for the server only (the chat's candidate pool)
    return Response({k: v for k, v in data.items() if not k.startswith("_")})
