"""
Custom authentication classes for the API.
"""
from rest_framework.authentication import SessionAuthentication
import logging

logger = logging.getLogger(__name__)


class CsrfExemptSessionAuthentication(SessionAuthentication):
    """
    Session authentication without CSRF verification.
    
    This is safe for our use case because:
    1. We have proper CORS configuration allowing only trusted origins
    2. Credentials are required for all requests (CORS_ALLOW_CREDENTIALS=True)
    3. Session cookies are HttpOnly and configured with appropriate SameSite settings
    """
    def enforce_csrf(self, request):
        logger.info(f"[CsrfExemptSessionAuthentication] CSRF check bypassed for {request.path}")
        return  # Do not enforce CSRF
    
    def authenticate(self, request):
        result = super().authenticate(request)
        if result:
            logger.info(f"[CsrfExemptSessionAuthentication] User authenticated: {result[0].username} for {request.path}")
        else:
            # Only log auth failures for non-public endpoints
            public_paths = ['/api/health/', '/api/session-status/', '/api/debug-config/', '/api/csrf-token/']
            if request.path not in public_paths:
                logger.warning(f"[CsrfExemptSessionAuthentication] Authentication failed for {request.path}")
        return result
