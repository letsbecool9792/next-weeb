"""The user's own data: profile, anime list, stats, plus anime detail and search."""
import logging

from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .. import sync
from ..mal import mal_get
from ..models import AnimeEntry, UserProfile
from ..throttles import SyncThrottle

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@throttle_classes([SyncThrottle])
def sync_mal_profile(request):
    """ Fetch from MAL and store in UserProfile """
    data = mal_get(request.user, "/users/@me")

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
    try:
        prof = request.user.userprofile
        return Response({
            "name": prof.name,
            "birthday": prof.birthday,
            "location": prof.location,
            "joined_at": prof.joined_at,
            "picture": prof.picture,
        })
    except UserProfile.DoesNotExist:
        logger.error(f"[cached_mal_profile] UserProfile does not exist for user: {request.user.username}")
        # Create profile if missing
        prof = UserProfile.objects.create(user=request.user)
        return Response({
            "name": prof.name or request.user.username,
            "birthday": prof.birthday,
            "location": prof.location,
            "joined_at": prof.joined_at,
            "picture": prof.picture,
        })
    except Exception as e:
        logger.error(f"[cached_mal_profile] Error: {str(e)}", exc_info=True)
        return Response({"error": "Could not load your profile."}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@throttle_classes([SyncThrottle])
def sync_anime_list(request):
    """Copy the user's full MAL list into our database."""
    count = sync.sync_anime_list(request.user)
    return Response({"message": "Anime list synced", "count": count})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_cached_anime_list(request):
    sync.ensure_synced(request.user)
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
    return Response(list(entries))

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def anime_detail(request, anime_id):
    fields = (
        'id,title,main_picture,alternative_titles,'
        'start_date,end_date,synopsis,mean,rank,'
        'popularity,num_list_users,num_scoring_users,'
        'nsfw,created_at,updated_at,media_type,status,'
        'genres,my_list_status,num_episodes,start_season,'
        'broadcast,source,average_episode_duration,'
        'rating,pictures,background,related_anime,'
        'related_manga,recommendations,studios,statistics'
    )
    return Response(mal_get(request.user, f"/anime/{anime_id}", {"fields": fields}))

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_anime(request):
    query = (request.GET.get("q") or "").strip()

    # MAL itself rejects searches shorter than 3 characters
    if len(query) < 3:
        return Response({"error": "Search needs at least 3 characters."}, status=400)

    try:
        limit = max(1, min(int(request.GET.get("limit", 10)), 100))
    except ValueError:
        limit = 10

    # Ask for the card's details in the search itself. The page used to fetch
    # each result's full detail page separately: seven requests per search.
    return Response(mal_get(request.user, "/anime", {
        "q": query,
        "limit": limit,
        "fields": "id,title,main_picture,genres,num_episodes,start_date,mean,media_type",
    }))

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_stats_data(request):
    """
    Completed shows with the details stats needs, read from our copy of the
    list. Same response shape as when this asked MAL directly.
    """
    sync.ensure_synced(request.user)
    completed = AnimeEntry.objects.filter(user=request.user, status="completed")
    return Response([
        {
            "title": entry.title,
            "score": entry.score or 0,
            "genres": entry.genres,
            "studios": entry.studios,
            "num_episodes": entry.num_episodes,
            "average_episode_duration": entry.average_episode_duration,
            "media_type": entry.media_type,
        }
        for entry in completed
    ])
