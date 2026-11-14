"""
Everything that talks to MyAnimeList lives here.

Views call mal_get(user, path, params) and get parsed JSON back. Token
handling (expiry, refreshing, retrying once on a 401) happens inside, so no
view has to think about it. When something goes wrong this module raises one
of the exceptions below; Django REST Framework turns those into JSON error
responses on its own, so views do not need try/except around MAL calls.
"""
import logging
from datetime import timedelta

import requests
from django.conf import settings
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import APIException

from .models import UserProfile

logger = logging.getLogger(__name__)

MAL_AUTH_URL = "https://myanimelist.net/v1/oauth2/authorize"
MAL_TOKEN_URL = "https://myanimelist.net/v1/oauth2/token"
MAL_API_URL = "https://api.myanimelist.net/v2"

# Seconds to wait for MAL before giving up on a request
TIMEOUT = 15

# MAL access tokens last 31 days. Once one has less than this left we swap it
# for a fresh pair, so anyone who uses the app about once a week never expires.
REFRESH_WHEN_REMAINING_BELOW = timedelta(days=24)

TOKEN_FIELDS = ["mal_access_token", "mal_refresh_token", "mal_token_expires_at"]


class MalError(APIException):
    """Base class. The response body is {"error": <message>, "code": <code>}."""

    def __init__(self, message=None):
        super().__init__({"error": message or self.default_detail, "code": self.default_code})


class MalReauthRequired(MalError):
    """
    We no longer hold a working MAL token for this user and cannot get one
    without them. Deliberately 403 and not 401: the frontend treats 401 as
    "our own login token expired" and would try to refresh that instead.
    """
    status_code = 403
    default_detail = "Your MyAnimeList connection has expired. Please log in again."
    default_code = "mal_reauth_required"


class MalUnavailable(MalError):
    """MAL timed out, errored, or answered with something we cannot use."""
    status_code = 502
    default_detail = "MyAnimeList is not responding right now. Please try again."
    default_code = "mal_unavailable"


class MalNotFound(MalError):
    status_code = 404
    default_detail = "MyAnimeList has no such entry."
    default_code = "mal_not_found"


# ---------- tokens ----------

def _token_request(data):
    """POST to MAL's token endpoint with our client id and secret added."""
    try:
        return requests.post(
            MAL_TOKEN_URL,
            data={
                "client_id": settings.MAL_CLIENT_ID,
                "client_secret": settings.MAL_CLIENT_SECRET,
                **data,
            },
            timeout=TIMEOUT,
        )
    except requests.exceptions.RequestException as e:
        logger.error(f"[mal] Token endpoint unreachable: {e}")
        raise MalUnavailable()


def exchange_code(code, verifier):
    """
    Login step: trade the one-time authorization code for MAL tokens.
    Returns MAL's token JSON, or None if MAL refused the code.
    """
    response = _token_request({
        "grant_type": "authorization_code",
        "code": code,
        "code_verifier": verifier,
        "redirect_uri": settings.MAL_REDIRECT_URI,
    })
    if response.status_code != 200:
        logger.error(f"[mal] Code exchange refused: {response.status_code} - {response.text}")
        return None
    return response.json()


def set_tokens(profile, token_json):
    """Copy a MAL token response onto the profile. The caller saves."""
    profile.mal_access_token = token_json["access_token"]
    # MAL sends a new refresh token with every refresh; the old one stops working.
    profile.mal_refresh_token = token_json.get("refresh_token") or profile.mal_refresh_token
    expires_in = token_json.get("expires_in")
    profile.mal_token_expires_at = (
        timezone.now() + timedelta(seconds=expires_in) if expires_in else None
    )


def _refresh_tokens(user, stale_access_token):
    """
    Use the stored refresh token to get a new access token and return it.

    Several requests can notice an old token at the same moment (the search
    page fires six at once). The row lock makes them take turns: the first one
    talks to MAL, and the others then see the token has already changed and
    simply use it. Without this, the later ones would present a refresh token
    MAL has already retired.
    """
    with transaction.atomic():
        profile = UserProfile.objects.select_for_update().get(user=user)

        if profile.mal_access_token != stale_access_token:
            return profile.mal_access_token  # someone else already refreshed

        if not profile.mal_refresh_token:
            raise MalReauthRequired()

        response = _token_request({
            "grant_type": "refresh_token",
            "refresh_token": profile.mal_refresh_token,
        })

        if response.status_code == 200:
            set_tokens(profile, response.json())
            profile.save(update_fields=TOKEN_FIELDS)
            return profile.mal_access_token

        if response.status_code >= 500:
            raise MalUnavailable()

        # MAL refused the refresh token (expired or revoked). Forget it so we
        # do not keep asking on every request.
        logger.warning(f"[mal] Refresh refused for user {user.id}: {response.status_code}")
        profile.mal_refresh_token = None
        profile.save(update_fields=["mal_refresh_token"])

    # Raised outside the block so the save above is committed, not rolled back.
    raise MalReauthRequired()


# ---------- API calls ----------

def get_with_token(access_token, path, params=None):
    """One GET against the MAL API with a given token. Returns the raw response."""
    url = path if path.startswith("http") else f"{MAL_API_URL}{path}"
    try:
        return requests.get(
            url,
            headers={"Authorization": f"Bearer {access_token}"},
            params=params,
            timeout=TIMEOUT,
        )
    except requests.exceptions.RequestException as e:
        logger.error(f"[mal] GET {path} failed: {e}")
        raise MalUnavailable()


def mal_get(user, path, params=None):
    """
    GET a MAL API path on behalf of a user and return the parsed JSON.

    path is relative to the API root, e.g. "/users/@me/animelist". A full URL
    is also accepted, because MAL's paging links are full URLs.
    """
    profile = UserProfile.objects.filter(user=user).first()
    if profile is None or not profile.mal_access_token:
        raise MalReauthRequired()

    token = profile.mal_access_token
    expires_at = profile.mal_token_expires_at

    # Refresh ahead of time when the token is getting old
    if (
        expires_at
        and profile.mal_refresh_token
        and expires_at - timezone.now() < REFRESH_WHEN_REMAINING_BELOW
    ):
        try:
            token = _refresh_tokens(user, token)
        except MalError:
            if expires_at <= timezone.now():
                raise
            # The refresh failed but the current token has not expired yet, so use it.

    response = get_with_token(token, path, params)

    if response.status_code == 401:
        # MAL rejected a token we believed was fine. Refresh once and retry.
        token = _refresh_tokens(user, token)
        response = get_with_token(token, path, params)
        if response.status_code == 401:
            raise MalReauthRequired()

    if response.status_code == 404:
        raise MalNotFound()

    if response.status_code != 200:
        logger.error(f"[mal] GET {path} -> {response.status_code}: {response.text[:300]}")
        raise MalUnavailable()

    return response.json()
