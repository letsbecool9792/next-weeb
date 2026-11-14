"""
Rate limits. Each class names a "scope"; the allowed rate for that scope is
set in settings.REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"]. A request over the
limit gets HTTP 429 before the view runs.

Counters live in Django's cache, which settings.py puts in a database table,
so every server process shares them and they survive restarts.

Clients are identified by IP using the X-Forwarded-For header Render adds.
Someone determined can vary that header to dodge the IP-based limits; the
aim is to stop accidental or casual hammering, not a targeted attack.
"""
from rest_framework.throttling import SimpleRateThrottle, UserRateThrottle


class IpRateThrottle(SimpleRateThrottle):
    """Counts by client IP address, whether or not the request is logged in."""

    def get_cache_key(self, request, view):
        return self.cache_format % {"scope": self.scope, "ident": self.get_ident(request)}


class LoginThrottle(IpRateThrottle):
    """Each attempt makes us call MAL's token endpoint."""
    scope = "login"


class TokenRefreshThrottle(IpRateThrottle):
    scope = "token_refresh"


class AiChatThrottle(UserRateThrottle):
    """Counts per logged-in user. Every message is a paid Gemini request."""
    scope = "ai_chat"


class SyncThrottle(UserRateThrottle):
    """Each sync downloads the user's whole list from MAL."""
    scope = "sync"
