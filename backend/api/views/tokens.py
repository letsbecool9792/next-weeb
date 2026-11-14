"""
Endpoints for our own login tokens (not MAL's).

Two kinds of token are issued at login:
  - access token: sent with every API request, valid for 15 minutes.
  - refresh token: only ever sent to /api/token/refresh/ to get a new pair.

Refresh tokens rotate. Each use returns a new refresh token and puts the old
one on a blacklist table, so a refresh token works exactly once. Logging out
blacklists the current one, which ends the session on the server instead of
merely deleting it from the browser.
"""
from django.contrib.auth.models import User
from rest_framework_simplejwt.exceptions import InvalidToken
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.settings import api_settings
from rest_framework_simplejwt.views import TokenBlacklistView, TokenRefreshView

from ..throttles import TokenRefreshThrottle


class CheckedTokenRefreshSerializer(TokenRefreshSerializer):
    """
    The library's refresh step checks the token's signature, expiry and the
    blacklist, but never looks at the database. This adds that look: a token
    for a deleted or deactivated user must not keep producing access tokens.
    """

    def validate(self, attrs):
        refresh = self.token_class(attrs["refresh"])  # raises if invalid, expired or blacklisted
        user_id = refresh.payload.get(api_settings.USER_ID_CLAIM)

        if not User.objects.filter(id=user_id, is_active=True).exists():
            raise InvalidToken("No active account for this token.")

        return super().validate(attrs)  # issues the new pair and blacklists the old token


class RefreshView(TokenRefreshView):
    """POST {"refresh": "..."} -> {"access": "...", "refresh": "..."}"""
    serializer_class = CheckedTokenRefreshSerializer
    throttle_classes = [TokenRefreshThrottle]


class LogoutView(TokenBlacklistView):
    """
    POST {"refresh": "..."} -> the refresh token is blacklisted.
    Holding the refresh token is the proof of identity here, so no access
    token is required. That lets logout work even after the access token expired.
    """
