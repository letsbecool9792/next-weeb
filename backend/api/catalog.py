"""
The shared anime catalog: MAL's most popular shows, stored in the Anime table.

MAL's API has no way to ask for "all Drama shows" or "everything by Kyoto
Animation", so the old recommendations searched show titles for the word
"Drama" and kept whatever came back. With the catalog in our database we
can filter and score thousands of shows ourselves, with no MAL calls at
request time.
"""
import logging
from concurrent.futures import ThreadPoolExecutor
from datetime import timedelta

from django.utils import timezone

from .mal import MalError, public_get
from .models import Anime

logger = logging.getLogger(__name__)

CATALOG_SIZE = 5000   # top shows by MAL popularity (members); the 5000th has ~27k members
PAGE_SIZE = 500       # the most MAL's ranking endpoint returns per request
DETAILS_MAX_AGE = timedelta(days=30)

SHOW_FIELDS = ",".join([
    "id", "title", "main_picture", "genres", "studios", "mean", "popularity",
    "num_list_users", "media_type", "num_episodes", "start_season", "rating",
])
UPDATE_FIELDS = [
    "title", "image_url", "genres", "studios", "mean", "popularity", "num_list_users",
    "media_type", "num_episodes", "start_year", "rating",
]


def _show_values(node):
    """Turn a MAL show object into Anime field values."""
    return {
        "title": node.get("title", "")[:255],
        "image_url": (node.get("main_picture") or {}).get("medium"),
        "genres": [g["name"] for g in node.get("genres") or []],
        "studios": [s["name"] for s in node.get("studios") or []],
        "mean": node.get("mean"),
        "popularity": node.get("popularity"),
        "num_list_users": node.get("num_list_users"),
        "media_type": node.get("media_type") or "",
        "num_episodes": node.get("num_episodes") or 0,
        "start_year": (node.get("start_season") or {}).get("year"),
        "rating": node.get("rating") or "",
    }


def refresh_catalog(size=CATALOG_SIZE):
    """Download the top `size` shows by popularity and upsert them. Returns the count."""
    now = timezone.now()
    rows = {}
    for offset in range(0, size, PAGE_SIZE):
        page = public_get("/anime/ranking", {
            "ranking_type": "bypopularity",
            "limit": PAGE_SIZE,
            "offset": offset,
            "fields": SHOW_FIELDS,
        })
        for item in page.get("data", []):
            node = item["node"]
            rows[node["id"]] = Anime(
                mal_id=node["id"], in_catalog=True, catalog_updated_at=now, **_show_values(node)
            )
        if not page.get("paging", {}).get("next"):
            break

    # Insert new shows, update existing ones, in one statement per batch.
    # Community recommendations and related shows are left untouched.
    Anime.objects.bulk_create(
        rows.values(),
        update_conflicts=True,
        unique_fields=["mal_id"],
        update_fields=UPDATE_FIELDS + ["in_catalog", "catalog_updated_at"],
        batch_size=1000,
    )
    # Shows that fell out of the top list stay in the table but stop being candidates
    Anime.objects.filter(in_catalog=True).exclude(mal_id__in=rows.keys()).update(in_catalog=False)

    logger.info(f"[catalog] refreshed {len(rows)} shows")
    return len(rows)


def ensure_catalog():
    """Fill the catalog on first use, e.g. a fresh database before any build ran."""
    if not Anime.objects.filter(in_catalog=True).exists():
        refresh_catalog()


def load_catalog():
    """All catalog shows, keyed by MAL id."""
    return {a.mal_id: a for a in Anime.objects.filter(in_catalog=True)}


def _download_details(mal_id):
    try:
        return mal_id, public_get(f"/anime/{mal_id}", {
            "fields": SHOW_FIELDS + ",recommendations,related_anime",
        })
    except MalError:
        return mal_id, None


def get_details(mal_ids):
    """
    Anime rows for these shows with community_recs and related_ids filled in.
    Details younger than 30 days are reused; the rest are downloaded in
    parallel (network only; database writes happen afterwards, here).
    """
    mal_ids = list(dict.fromkeys(mal_ids))
    existing = Anime.objects.in_bulk(mal_ids)
    cutoff = timezone.now() - DETAILS_MAX_AGE
    stale = [i for i in mal_ids
             if i not in existing or not existing[i].details_fetched_at or existing[i].details_fetched_at < cutoff]

    if stale:
        with ThreadPoolExecutor(max_workers=6) as pool:
            results = list(pool.map(_download_details, stale))

        now = timezone.now()
        for mal_id, data in results:
            if data is None:
                continue  # MAL failed for this one; use whatever we already had
            row = existing.get(mal_id) or Anime(mal_id=mal_id)
            for field, value in _show_values(data).items():
                setattr(row, field, value)
            row.community_recs = [
                {
                    "id": r["node"]["id"],
                    "title": r["node"].get("title", ""),
                    "image": (r["node"].get("main_picture") or {}).get("medium"),
                    "votes": r.get("num_recommendations", 0),
                }
                for r in data.get("recommendations") or []
            ]
            row.related_ids = [r["node"]["id"] for r in data.get("related_anime") or []]
            row.details_fetched_at = now
            row.save()
            existing[mal_id] = row

    return existing
