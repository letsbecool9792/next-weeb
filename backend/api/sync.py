"""
Copy a user's MyAnimeList list into our database.

Pages that read the list (anime list, dashboard, stats) read our copy, so
they are fast and do not hit MAL on every load. Each entry also stores the
show's genres, studios and community stats, which is what stats and
recommendations need.
"""
import logging

from django.db import transaction
from django.utils import timezone
from django.utils.dateparse import parse_date, parse_datetime

from .mal import mal_get
from .models import AnimeEntry, UserProfile

logger = logging.getLogger(__name__)

# Fields MAL should include for every show in the list
LIST_FIELDS = ",".join([
    "list_status",
    "genres",
    "studios",
    "num_episodes",
    "average_episode_duration",
    "media_type",
    "mean",
    "popularity",
    "num_list_users",
])

PAGE_SIZE = 1000  # the most MAL returns per request
MAX_PAGES = 20    # stop after 20,000 entries rather than loop forever


def _date(value):
    """MAL allows partial dates like "2019" or "2019-04". Keep only full ones."""
    try:
        return parse_date(value) if value else None
    except ValueError:  # well formed but impossible, e.g. 2019-02-30
        return None


def _datetime(value):
    try:
        return parse_datetime(value) if value else None
    except ValueError:
        return None


def _names(items):
    return [item["name"] for item in items or [] if item.get("name")]


def fetch_full_list(user):
    """Every entry on the user's MAL list, following MAL's paging links."""
    page = mal_get(user, "/users/@me/animelist", {
        "fields": LIST_FIELDS,
        "limit": PAGE_SIZE,
        "nsfw": "true",  # without this MAL silently leaves NSFW titles out of the user's own list
    })
    items = page.get("data", [])
    pages = 1

    # MAL's "next" link is a full URL that already carries our query and the offset
    while page.get("paging", {}).get("next") and pages < MAX_PAGES:
        page = mal_get(user, page["paging"]["next"])
        items.extend(page.get("data", []))
        pages += 1

    return items


def build_entry(user, item):
    anime = item["node"]
    status = item.get("list_status", {})
    return AnimeEntry(
        user=user,
        mal_id=anime["id"],
        title=anime.get("title", ""),
        image_url=(anime.get("main_picture") or {}).get("medium"),
        # the user's own record
        status=status.get("status", ""),
        score=status.get("score"),
        episodes_watched=status.get("num_episodes_watched"),
        is_rewatching=status.get("is_rewatching", False),
        start_date=_date(status.get("start_date")),
        finish_date=_date(status.get("finish_date")),
        last_updated=_datetime(status.get("updated_at")),
        # facts about the show
        genres=_names(anime.get("genres")),
        studios=_names(anime.get("studios")),
        num_episodes=anime.get("num_episodes") or 0,
        average_episode_duration=anime.get("average_episode_duration") or 0,
        media_type=anime.get("media_type") or "",
        mean=anime.get("mean"),
        popularity=anime.get("popularity"),
        num_list_users=anime.get("num_list_users"),
    )


def sync_anime_list(user):
    """Replace the stored list with MAL's current one. Returns the entry count."""
    items = fetch_full_list(user)

    # If the list changes while we page through it, a show can appear on two pages.
    # Keep one copy per show, or the (user, mal_id) uniqueness rule would reject the batch.
    by_id = {item["node"]["id"]: item for item in items}
    entries = [build_entry(user, item) for item in by_id.values()]

    # Every network call is done. Swap the rows in one transaction: if anything
    # fails here the old list stays, instead of a half-deleted one.
    with transaction.atomic():
        AnimeEntry.objects.filter(user=user).delete()
        AnimeEntry.objects.bulk_create(entries)
        UserProfile.objects.filter(user=user).update(last_synced_at=timezone.now())

    logger.info(f"[sync] user {user.id}: {len(entries)} entries")
    return len(entries)


def ensure_synced(user):
    """
    Sync once if this user's list has never been synced, so a new user's
    dashboard is not empty and existing rows gain the newer columns.
    """
    profile = UserProfile.objects.filter(user=user).only("last_synced_at").first()
    if profile is not None and profile.last_synced_at is None:
        sync_anime_list(user)
