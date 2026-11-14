"""
How recommendations are made.

1. Taste. Every show on the user's list gets a weight: positive if they liked
   it, negative if they disliked or dropped it. Their taste for a genre (or
   studio) is the weighted share of their list that has it.

2. Rarity. A shared genre says more when it is rare. Comedy is on a third of
   all shows, so liking Comedy and a candidate having Comedy is weak evidence;
   Iyashikei or Mecha is strong evidence. Each genre is multiplied by its
   inverse document frequency (idf) over the catalog: log(shows / shows_with_genre).

3. Two signals per candidate:
   - content: how well its genres and studios match the taste profile.
   - community: MAL users recommend shows "if you liked X". For the user's
     favourite shows (anchors), each recommendation adds weight, more for
     more votes and for more-loved anchors.
   Plus a small quality term from the community score. The three are scaled
   to the same range and blended.

4. Every pick carries the strongest reason it was chosen.
"""
import logging
import math
import random
import re
from collections import defaultdict
from dataclasses import dataclass, field

from .catalog import ensure_catalog, get_details, load_catalog
from .models import AnimeEntry

logger = logging.getLogger(__name__)

# Never recommend these
EXCLUDED_MEDIA = {"music", "cm", "pv", "tv_special", "special"}
EXCLUDED_RATINGS = {"rx"}
MIN_MEAN = 6.5

# MAL lists these as genres, but they are an award tag and target audiences.
# They still count when scoring; they are just never shown as "your genre".
NOT_REALLY_GENRES = {"Award Winning", "Shounen", "Seinen", "Shoujo", "Josei", "Kids"}

# How much each signal counts in the final score
WEIGHT_CONTENT = 0.5
WEIGHT_COMMUNITY = 0.35
WEIGHT_QUALITY = 0.15

ANCHOR_COUNT = 10        # favourite shows whose community recommendations we use
ANCHOR_MIN_WEIGHT = 0.8  # roughly "rated 8 or more", or completed and rewatched


# ---------- helpers ----------

_SEQUEL_MARKERS = re.compile(
    r"\s*(:|-|\(|\b(2nd|3rd|\d+th|second|third|final)\b|\bseason\b|\bpart\b|\bmovie\b|\bova\b|\bspecial\b).*$",
    re.IGNORECASE,
)


def base_title(title):
    """
    Rough franchise key: "Kaguya-sama wa Kokurasetai: Ultra Romantic" and
    "Kaguya-sama wa Kokurasetai?" both become "kaguya-sama wa kokurasetai".
    Used to avoid recommending sequels of shows already seen, and to show at
    most one entry per franchise in a section.
    """
    base = _SEQUEL_MARKERS.sub("", title or "")
    base = re.sub(r"\s+(\d+|[IVX]+)$", "", base)  # trailing "2", "II"
    return re.sub(r"[^\w\s-]", "", base).strip().lower() or (title or "").lower()


_FOLLOW_UP = re.compile(
    r"\b(2nd|3rd|\d+th|second|third|final)\s+season\b|\bseason\s*\d+\b|\bpart\s*\d+\b"
    r"|\bmovie\b|\bfilm\b|\bspecials?\b|\brecap\b|\bzoku\b",
    re.IGNORECASE,
)


def looks_like_follow_up(title):
    """
    Titles like "Season 2", "Part 2", "Movie", "Film: Red" or "Specials" are
    almost always follow-ups to another show. Recommending one to someone
    who has not seen the original is not useful.
    """
    return bool(_FOLLOW_UP.search(title or ""))


def _scale(values):
    """Divide by the largest absolute value, so the biggest becomes 1 (or -1)."""
    top = max((abs(v) for v in values.values()), default=0)
    return {k: v / top for k, v in values.items()} if top else dict(values)


def quality(mean):
    """Community score 6.5 -> 0, 9.0 and above -> 1."""
    return max(0.0, min(1.0, ((mean or 0) - 6.5) / 2.5))


def entry_weight(entry, user_mean):
    """
    How much this show on the user's list tells us they like its kind of show.
    A score counts twice: against a neutral 6 (a 9 is liked by anyone's
    standard) and against the user's own average (a 7 from someone who gives
    out 9s is lukewarm). Unscored shows fall back to their status.
    """
    if entry.status == "plan_to_watch":
        return 0.0
    if entry.score:
        weight = (entry.score - 6) / 2 + (entry.score - user_mean) / 3
    else:
        weight = {"completed": 0.6, "watching": 0.4, "on_hold": 0.1, "dropped": -1.0}.get(entry.status, 0.0)
    if entry.is_rewatching:
        weight += 0.5
    return max(-2.0, min(2.5, weight))


# ---------- taste ----------

@dataclass
class Taste:
    genre: dict = field(default_factory=dict)     # genre -> affinity (can be negative)
    studio: dict = field(default_factory=dict)    # studio -> affinity
    idf: dict = field(default_factory=dict)       # genre -> rarity multiplier
    studio_example: dict = field(default_factory=dict)  # studio -> the user's favourite show from it
    anchors: list = field(default_factory=list)   # [(entry, weight)] favourite shows, best first
    seen_ids: set = field(default_factory=set)    # every show on the list, any status
    seen_bases: dict = field(default_factory=dict)  # franchise key -> title of the user's entry
    plan_to_watch: list = field(default_factory=list)

    def genre_strength(self, genre):
        return self.genre.get(genre, 0.0) * self.idf.get(genre, 1.0)

    def top_genres(self, n=5):
        """The user's most distinctive genres: liked, and rare in anime overall."""
        ranked = sorted(
            (g for g in self.genre if self.genre[g] > 0 and g not in NOT_REALLY_GENRES),
            key=self.genre_strength,
            reverse=True,
        )
        return ranked[:n]

    def top_studios(self, n=3):
        """Studios behind at least two shows the user liked."""
        ranked = sorted((s for s, a in self.studio.items() if a > 0), key=self.studio.get, reverse=True)
        return [s for s in ranked if self._liked_count.get(s, 0) >= 2][:n]

    _liked_count: dict = field(default_factory=dict)


def genre_idf(catalog):
    shows_with = defaultdict(int)
    for anime in catalog.values():
        for genre in anime.genres:
            shows_with[genre] += 1
    total = len(catalog) or 1
    return {g: max(0.1, math.log(total / (1 + n))) for g, n in shows_with.items()}


def build_taste(entries, catalog):
    taste = Taste(idf=genre_idf(catalog))
    scores = [e.score for e in entries if e.score]
    user_mean = sum(scores) / len(scores) if scores else 7.0

    weighted = [(e, entry_weight(e, user_mean)) for e in entries]
    total = sum(abs(w) for _, w in weighted) or 1.0
    genre, studio = defaultdict(float), defaultdict(float)
    best_from_studio = {}

    for entry, weight in weighted:
        taste.seen_ids.add(entry.mal_id)
        if entry.status == "plan_to_watch":
            taste.plan_to_watch.append(entry)
            continue
        taste.seen_bases.setdefault(base_title(entry.title), entry.title)
        for g in entry.genres:
            genre[g] += weight / total
        for s in entry.studios:
            studio[s] += weight / total
            if weight > 0:
                taste._liked_count[s] = taste._liked_count.get(s, 0) + 1
                if weight > best_from_studio.get(s, (0, ""))[0]:
                    best_from_studio[s] = (weight, entry.title)

    taste.genre, taste.studio = dict(genre), dict(studio)
    taste.studio_example = {s: title for s, (_, title) in best_from_studio.items()}
    # Favourite shows, one per franchise. Among equally loved shows prefer the
    # one more people have seen: an older, bigger show has far more community
    # recommendations (Frieren season 1 has dozens of votes per pick; its brand
    # new season 2 has one each).
    liked = sorted(
        ((e, w) for e, w in weighted if w >= ANCHOR_MIN_WEIGHT),
        key=lambda pair: (pair[1], pair[0].num_list_users or 0),
        reverse=True,
    )
    franchises = set()
    for entry, weight in liked:
        key = base_title(entry.title)
        if key not in franchises:
            franchises.add(key)
            taste.anchors.append((entry, weight))
    taste.anchors = taste.anchors[:ANCHOR_COUNT]
    return taste


# ---------- scoring ----------

def content_score(anime, taste):
    """Genre match weighted by rarity, plus a smaller studio match."""
    if not anime.genres:
        return 0.0
    genre_part = sum(taste.genre_strength(g) for g in anime.genres) / math.sqrt(len(anime.genres))
    studio_part = 0.5 * sum(taste.studio.get(s, 0.0) for s in anime.studios)
    return genre_part + studio_part


def community_scores(taste, details):
    """
    Sum of MAL "if you liked X" recommendations over the user's anchors.
    Returns (score per show, (anchor title, votes) that contributed most per show).
    """
    scores, best = defaultdict(float), {}
    for entry, weight in taste.anchors:
        row = details.get(entry.mal_id)
        for rec in (row.community_recs or []) if row else []:
            contribution = weight * math.log1p(rec["votes"])
            scores[rec["id"]] += contribution
            if contribution > best.get(rec["id"], (0,))[0]:
                best[rec["id"]] = (contribution, entry.title, rec["votes"])
    return dict(scores), {k: (title, votes) for k, (_, title, votes) in best.items()}


def reason_for(anime, taste, community_source):
    """The single most convincing reason, in order of strength of evidence."""
    if anime.mal_id in community_source:
        anchor, votes = community_source[anime.mal_id]
        people = "fan" if votes == 1 else "fans"
        return f"Recommended by {votes} {people} of {anchor}"
    for studio in anime.studios:
        if studio in taste.top_studios(5):
            return f"From {studio}, who made {taste.studio_example[studio]}"
    liked = sorted(
        (g for g in anime.genres if taste.genre.get(g, 0) > 0 and g not in NOT_REALLY_GENRES),
        key=taste.genre_strength,
        reverse=True,
    )
    if liked:
        return "Matches your taste for " + " and ".join(liked[:2])
    return f"Rated {anime.mean:.2f} on MAL" if anime.mean else "Popular on MAL"


def card(anime, reason, image=None, title=None, mean=None):
    return {
        "id": anime.mal_id if anime else None,
        "title": title or anime.title,
        "image": image or (anime.image_url if anime else None),
        "image_large": anime.image_large if anime else None,  # for the page's banner
        "score": mean if mean is not None else (anime.mean if anime else None),
        "reason": reason,
    }


def take(ranked, count, skip_ids=()):
    """First `count` shows from a ranked list, at most one per franchise."""
    picked, bases = [], set()
    for anime in ranked:
        key = base_title(anime.title)
        if anime.mal_id in skip_ids or key in bases:
            continue
        bases.add(key)
        picked.append(anime)
        if len(picked) == count:
            break
    return picked


# ---------- the page ----------

def build_recommendations(user, regenerate=False):
    entries = list(AnimeEntry.objects.filter(user=user))
    ensure_catalog()
    catalog = load_catalog()
    taste = build_taste(entries, catalog)

    # Regenerate shuffles which anchor and genre lead their sections and
    # nudges scores slightly. Without it, the page is stable.
    rng = random.Random() if regenerate else random.Random(user.id)
    jitter = (lambda: 1 + rng.uniform(-0.08, 0.08)) if regenerate else (lambda: 1.0)

    details = get_details([e.mal_id for e, _ in taste.anchors])
    franchise_ids = {i for e, _ in taste.anchors if e.mal_id in details for i in details[e.mal_id].related_ids}
    community, community_source = community_scores(taste, details)

    def eligible(anime):
        return (
            anime.mal_id not in taste.seen_ids
            and anime.mal_id not in franchise_ids
            and anime.media_type not in EXCLUDED_MEDIA
            and anime.rating not in EXCLUDED_RATINGS
            and (anime.mean or 0) >= MIN_MEAN
            and base_title(anime.title) not in taste.seen_bases
            and not looks_like_follow_up(anime.title)
        )

    candidates = [a for a in catalog.values() if eligible(a)]
    content = _scale({a.mal_id: content_score(a, taste) for a in candidates})
    community_scaled = _scale({a.mal_id: community.get(a.mal_id, 0.0) for a in candidates})
    final = {
        a.mal_id: (WEIGHT_CONTENT * content[a.mal_id]
                   + WEIGHT_COMMUNITY * community_scaled[a.mal_id]
                   + WEIGHT_QUALITY * quality(a.mean)) * jitter()
        for a in candidates
    }
    ranked = sorted(candidates, key=lambda a: final[a.mal_id], reverse=True)
    reason = lambda a: reason_for(a, taste, community_source)

    # 1. Top picks across everything
    top = take(ranked, 12)
    used = {a.mal_id for a in top}
    result = {"top_picks": [card(a, reason(a)) for a in top]}

    # 2. Because you liked X: MAL's community picks for one favourite
    # Prefer anchors whose recommendations carry real votes.
    def total_votes(entry):
        row = details.get(entry.mal_id)
        return sum(r["votes"] for r in (row.community_recs or [])) if row else 0

    voted = [e for e, _ in taste.anchors[:5] if total_votes(e) >= 10] or [e for e, _ in taste.anchors[:1]]
    result["because_you_liked"] = []
    if voted:
        anchor = rng.choice(voted) if regenerate else max(voted, key=total_votes)
        row = details.get(anchor.mal_id)
        items, bases = [], set()
        for rec in (row.community_recs or []) if row else []:
            known = catalog.get(rec["id"])
            key = base_title(rec["title"])
            if (rec["id"] in taste.seen_ids or rec["id"] in franchise_ids or key in bases
                    or key in taste.seen_bases or looks_like_follow_up(rec["title"])
                    or (known and not eligible(known))):
                continue
            bases.add(key)
            people = "fan" if rec["votes"] == 1 else "fans"
            items.append({
                "id": rec["id"],
                "title": rec["title"],
                "image": rec["image"],
                "score": known.mean if known else None,
                "reason": f"Recommended by {rec['votes']} {people} of {anchor.title}",
            })
        if items:
            result["because_you_liked"].append({"anchor": anchor.title, "anchor_id": anchor.mal_id, "anime": items[:8]})

    # 3. A favourite genre (the most distinctive, not the most common)
    genres = taste.top_genres(3)
    result["from_genres"] = None
    if genres:
        genre = rng.choice(genres) if regenerate else genres[0]
        picks = take([a for a in ranked if genre in a.genres], 10, used)
        result["from_genres"] = {"genre": genre, "anime": [card(a, reason(a)) for a in picks]}

    # 4. A favourite studio
    studios = taste.top_studios()
    result["from_studios"] = None
    if studios:
        studio = studios[0]
        picks = take([a for a in ranked if studio in a.studios], 8, used)
        result["from_studios"] = {
            "studio": studio,
            "anime": [card(a, f"From {studio}, who made {taste.studio_example[studio]}") for a in picks],
        }

    # 5. Hidden gems: highly rated, but outside the 1,500 most popular shows.
    # OVAs are left out here because the obscure ones are mostly side stories.
    gems = take([
        a for a in ranked
        if (a.popularity or 0) > 1500 and (a.mean or 0) >= 7.6 and a.media_type in ("tv", "movie", "ona")
    ], 8, used)
    result["hidden_gems"] = [
        card(a, f"Rated {a.mean:.2f}, yet only {(a.num_list_users or 0):,} members") for a in gems
    ]

    # 6. What to start next from their own Plan to Watch. One entry per
    # franchise: the one most people have watched, which is normally the main
    # series rather than a movie or special.
    by_franchise = {}
    for e in sorted(taste.plan_to_watch, key=lambda e: e.num_list_users or 0, reverse=True):
        by_franchise.setdefault(base_title(e.title), e)
    ptw_scores = {e.mal_id: content_score(e, taste) + quality(e.mean) for e in by_franchise.values()}
    ptw = sorted(by_franchise.values(), key=lambda e: ptw_scores[e.mal_id], reverse=True)[:8]

    def ptw_reason(e):
        started = taste.seen_bases.get(base_title(e.title))
        return f"Continues {started}, which is on your list" if started else reason_for(e, taste, {})

    result["plan_to_watch"] = [
        {"id": e.mal_id, "title": e.title, "image": e.image_url, "image_large": e.image_large,
         "score": e.mean, "reason": ptw_reason(e)}
        for e in ptw
    ]

    # Shows the AI chat may suggest: the best personal matches, plus the
    # best-rated of the rest so it can answer requests outside the user's
    # usual taste. Internal: the view strips keys starting with "_".
    personal = ranked[:120]
    broad = sorted(ranked[120:], key=lambda a: a.mean or 0, reverse=True)[:80]
    result["_pool"] = [a.mal_id for a in personal + broad]

    result["taste"] = {
        "top_genres": taste.top_genres(5),
        "top_studios": taste.top_studios(3),
        "favourites": [e.title for e, _ in taste.anchors[:5]],
    }

    logger.info(
        f"[recommender] user {user.id}: list={len(entries)} anchors={len(taste.anchors)} "
        f"candidates={len(candidates)} community_hits={sum(1 for a in candidates if community.get(a.mal_id))}"
    )
    return result
