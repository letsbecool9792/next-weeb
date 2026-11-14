"""
The AI chat on the recommendations page (Google Gemini).

The old chat sent Gemini ten titles the browser picked and one message, and
got back free text. Gemini could suggest anything, including shows the user
had already seen, and nothing in the answer was clickable.

Now the server builds the context itself from the database:
  - the user's taste: favourite shows with their scores, dropped shows,
    distinctive genres and studios;
  - a list of CANDIDATES: about 200 shows the user has not seen (the best
    personal matches from the recommender, plus the best-rated of the rest)
    and their own Plan to Watch.
Gemini must answer in JSON: a short reply, plus picks given as candidate ids.
Ids not on the list are dropped, so every suggested card is a real,
unwatched show that links to its detail page.

The conversation is multi-turn: the browser sends the recent history, and
Gemini sees it as an ordinary back-and-forth.
"""
import logging
import os

from google import genai
from google.genai import errors, types
from pydantic import BaseModel
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ..models import Anime, AnimeEntry
from ..throttles import AiChatThrottle
from .recommendations import get_cached_recommendations

logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
gemini_client = (
    genai.Client(api_key=GEMINI_API_KEY, http_options=types.HttpOptions(timeout=30_000))
    if GEMINI_API_KEY else None
)

MAX_TURNS = 12            # most recent messages sent to Gemini
MAX_MESSAGE_CHARS = 1000  # longer messages are cut
MAX_PICKS = 6


class ChatPick(BaseModel):
    id: int
    why: str


class ChatReply(BaseModel):
    """The JSON shape Gemini must answer in."""
    reply: str
    picks: list[ChatPick]


def clean_history(raw):
    """Keep well-formed {role, content} messages, the last MAX_TURNS of them."""
    messages = []
    for item in raw if isinstance(raw, list) else []:
        if not isinstance(item, dict):
            continue
        role, content = item.get("role"), item.get("content")
        if role in ("user", "assistant") and isinstance(content, str) and content.strip():
            messages.append({"role": role, "content": content.strip()[:MAX_MESSAGE_CHARS]})
    return messages[-MAX_TURNS:]


def describe(show, note=""):
    """One candidate line for the prompt."""
    parts = [
        str(show["id"]),
        show["title"],
        f"{show['media_type'].upper()} {show['episodes'] or '?'} eps" if show["media_type"] else "",
        str(show["year"]) if show.get("year") else "",
        ", ".join(show["genres"][:5]),
        ", ".join(show.get("studios", [])[:2]),
        f"MAL {show['mean']:.2f}" if show["mean"] else "",
        note,
    ]
    return " | ".join(p for p in parts if p)


def build_context(user):
    """The system prompt and the candidates Gemini may pick from, keyed by id."""
    recs = get_cached_recommendations(user)
    candidates, lines = {}, []

    for a in Anime.objects.in_bulk(recs.get("_pool", [])).values():
        candidates[a.mal_id] = {
            "id": a.mal_id, "title": a.title, "image": a.image_url, "mean": a.mean,
            "media_type": a.media_type, "episodes": a.num_episodes, "year": a.start_year, "genres": a.genres,
            "studios": a.studios,
        }
        lines.append(describe(candidates[a.mal_id]))

    entries = AnimeEntry.objects.filter(user=user)
    for e in entries.filter(status="plan_to_watch"):
        candidates[e.mal_id] = {
            "id": e.mal_id, "title": e.title, "image": e.image_url, "mean": e.mean,
            "media_type": e.media_type, "episodes": e.num_episodes, "genres": e.genres,
            "studios": e.studios,
        }
        lines.append(describe(candidates[e.mal_id], "already on their Plan to Watch"))

    favourites = [f"{e.title} ({e.score}/10)" for e in entries.filter(score__gte=8).order_by("-score", "-last_updated")[:25]]
    dropped = [e.title for e in entries.filter(status="dropped")[:15]]
    taste = recs.get("taste", {})

    system = f"""You are the recommendation assistant inside NextWeeb, an app built on the user's MyAnimeList account.

ABOUT THE USER
Favourite shows: {'; '.join(favourites) or 'none rated highly yet'}
Dropped: {'; '.join(dropped) or 'none'}
Distinctive genres: {', '.join(taste.get('top_genres', [])) or 'unknown'}
Favourite studios: {', '.join(taste.get('top_studios', [])) or 'unknown'}

CANDIDATES (format: id | title | type and episodes | year | genres | studios | MAL score | note)
None of these are on the user's list yet, except those marked as on their Plan to Watch.
{chr(10).join(lines)}

RULES
- Answer in 2-4 short sentences in "reply". Be direct and specific; no filler.
- Put the shows you suggest in "picks", up to {MAX_PICKS}, using ids from CANDIDATES only. Never invent an id.
- Each pick's "why" is one short sentence tying it to what the user asked or to their favourites.
- If nothing in CANDIDATES fits, say so in "reply" and return an empty "picks".
- If the user asks something that is not about anime, briefly steer back and return an empty "picks".
"""
    return system, candidates


def gemini_error_message(error):
    if isinstance(error, errors.APIError):
        if error.code == 429:
            return "The AI is getting too many requests right now. Wait a minute and try again."
        if error.code in (401, 403):
            return "The AI service is misconfigured on our side. Please try again later."
        if error.code >= 500:
            return "The AI service is overloaded right now. Try again in a few minutes."
        return "The AI couldn't process that message. Try rephrasing it."
    return "The AI took too long to answer. Please try again."


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@throttle_classes([AiChatThrottle])
def ai_recommendation_chat(request):
    """
    POST {"messages": [{"role": "user"|"assistant", "content": "..."}, ...]}
    -> {"message": "...", "picks": [{"id", "title", "image", "score", "reason"}]}
    """
    messages = clean_history(request.data.get("messages"))
    if not messages or messages[-1]["role"] != "user":
        return Response({"error": "Message is required"}, status=400)
    if gemini_client is None:
        return Response({"error": "The AI chat is not configured on this server."}, status=503)

    system, candidates = build_context(request.user)
    contents = [
        types.Content(role="user" if m["role"] == "user" else "model", parts=[types.Part(text=m["content"])])
        for m in messages
    ]

    try:
        response = gemini_client.models.generate_content(
            model=GEMINI_MODEL,
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system,
                temperature=0.7,
                max_output_tokens=1500,
                response_mime_type="application/json",
                response_schema=ChatReply,
                # No hidden "thinking" step: faster, and it cannot eat the output budget
                thinking_config=types.ThinkingConfig(thinking_budget=0),
            ),
        )
    except Exception as e:  # network errors, timeouts and API errors alike
        logger.error(f"[chat] Gemini call failed: {type(e).__name__}: {e}")
        return Response({"message": gemini_error_message(e), "picks": []})

    answer = response.parsed if isinstance(response.parsed, ChatReply) else None
    if answer is None:
        finish = response.candidates[0].finish_reason if response.candidates else None
        logger.warning(f"[chat] Unusable Gemini answer, finish reason: {finish}")
        return Response({"message": "I couldn't come up with an answer to that. Try asking differently.", "picks": []})

    picks, seen = [], set()
    for pick in answer.picks:
        show = candidates.get(pick.id)
        if show and pick.id not in seen:  # ids Gemini made up are dropped here
            seen.add(pick.id)
            picks.append({
                "id": show["id"],
                "title": show["title"],
                "image": show["image"],
                "score": show["mean"],
                "reason": pick.why,
            })

    return Response({"message": answer.reply, "picks": picks[:MAX_PICKS]})
