"""MyAnimeList login: public OAuth config, and trading MAL's code for our JWTs."""
import logging

from django.conf import settings
from django.contrib.auth.models import User
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .. import mal
from ..models import UserProfile
from ..throttles import LoginThrottle

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([AllowAny])
def oauth_config(request):
    """
    Public values the frontend needs to start a MAL login.

    The browser builds the authorize URL itself, so the PKCE verifier and the
    state value it generates never pass through this server. The redirect URI
    comes from here so the authorize step and the token exchange below are
    guaranteed to use the identical string, which MAL requires.
    """
    return Response({
        "authorize_url": mal.MAL_AUTH_URL,
        "client_id": settings.MAL_CLIENT_ID,
        "redirect_uri": settings.MAL_REDIRECT_URI,
    })


@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([LoginThrottle])
def exchange_oauth_token(request):
    """
    Second half of the MAL login.

    The browser arrives with the one-time code MAL gave it and the verifier it
    generated before leaving for MAL. We add the client secret (which only the
    server knows) and trade all three for MAL tokens, then issue our own JWTs
    for the matching user.
    """
    from rest_framework_simplejwt.tokens import RefreshToken

    oauth_code = request.data.get("code")
    code_verifier = request.data.get("verifier")

    if not oauth_code or not code_verifier:
        return Response({"error": "Missing authorization code or verifier."}, status=400)

    # MAL only honours the code if the verifier matches the challenge the
    # browser sent when this login started, and the redirect URI is the same.
    token_json = mal.exchange_code(oauth_code, code_verifier)
    if token_json is None:
        return Response({"error": "MyAnimeList rejected the login. Please try again."}, status=400)

    # Ask MAL who this token belongs to
    user_info_response = mal.get_with_token(token_json["access_token"], "/users/@me")
    if user_info_response.status_code != 200:
        logger.error(f"[exchange_oauth_token] Failed to fetch MAL user info: {user_info_response.status_code}")
        return Response({"error": "Could not read your MyAnimeList profile."}, status=400)

    mal_user = user_info_response.json()
    mal_username = mal_user.get("name")

    if not mal_username:
        logger.error("[exchange_oauth_token] No username in MAL response")
        return Response({"error": "Could not read your MyAnimeList profile."}, status=400)

    # Create/get Django user and profile
    try:
        user, user_created = User.objects.get_or_create(username=mal_username)
        profile, _ = UserProfile.objects.get_or_create(user=user)
        logger.info(f"[exchange_oauth_token] User {'created' if user_created else 'found'}: {user.username}")

        # Store the MAL access token, refresh token and expiry time
        mal.set_tokens(profile, token_json)

        # Store profile data
        profile.name = mal_user.get("name") or mal_username
        profile.birthday = mal_user.get("birthday")
        profile.location = mal_user.get("location")
        profile.joined_at = mal_user.get("joined_at")

        # Extract picture URL
        picture_data = mal_user.get("picture")
        if picture_data and isinstance(picture_data, dict):
            profile.picture = picture_data.get("medium") or picture_data.get("large")
        elif isinstance(picture_data, str):
            profile.picture = picture_data

        profile.save()

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)

        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": {
                "username": user.username,
                "name": profile.name,
                "picture": profile.picture,
            }
        }, status=200)

    except Exception as e:
        logger.error(f"[exchange_oauth_token] Exception: {str(e)}", exc_info=True)
        return Response({"error": "Something went wrong on our side. Please try again."}, status=500)
