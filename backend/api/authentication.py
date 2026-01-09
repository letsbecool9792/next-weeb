"""
Custom authentication classes for the API.
"""
from rest_framework.authentication import SessionAuthentication
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, AuthenticationFailed
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


class LoggingJWTAuthentication(JWTAuthentication):
    """
    JWT Authentication with detailed logging for debugging auth issues.
    """
    
    # Public endpoints that should skip auth logging
    SKIP_LOGGING_PATHS = [
        '/api/health/',
        '/api/debug-config/',
        '/api/csrf-token/',
        '/api/session-status/',
        '/api/token/refresh/',
        '/api/posthog/',
    ]
    
    def authenticate(self, request):
        """
        Override authenticate to add logging.
        """
        # Skip logging for public endpoints
        if any(request.path.startswith(path) for path in self.SKIP_LOGGING_PATHS):
            return super().authenticate(request)
        
        # Log the authentication attempt
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        logger.info(f"[JWT Auth] Path: {request.path}, Has Auth Header: {bool(auth_header)}")
        
        if auth_header:
            # Log token prefix (first 20 chars) for debugging
            parts = auth_header.split()
            if len(parts) >= 2:
                token_prefix = parts[1][:20] if len(parts[1]) > 20 else parts[1]
                logger.info(f"[JWT Auth] Token prefix: {token_prefix}...")
        
        try:
            result = super().authenticate(request)
            
            if result is not None:
                user, validated_token = result
                logger.info(f"[JWT Auth] SUCCESS - User: {user.username} (ID: {user.id})")
                return result
            else:
                logger.info(f"[JWT Auth] No credentials provided")
                return None
                
        except InvalidToken as e:
            logger.error(f"[JWT Auth] INVALID TOKEN - Path: {request.path}, Error: {str(e)}")
            raise
        except AuthenticationFailed as e:
            logger.error(f"[JWT Auth] AUTH FAILED - Path: {request.path}, Error: {str(e)}")
            # Log additional debug info for user not found errors
            if 'user not found' in str(e).lower():
                # Try to decode token to see what user_id it contains
                from rest_framework_simplejwt.tokens import AccessToken
                auth_header = request.META.get('HTTP_AUTHORIZATION', '')
                if auth_header:
                    try:
                        token = auth_header.split()[1]
                        decoded = AccessToken(token)
                        user_id = decoded.get('user_id')
                        logger.error(f"[JWT Auth] Token claims user_id: {user_id}, but user not found in database")
                        
                        # Check if user exists
                        from django.contrib.auth.models import User
                        user_exists = User.objects.filter(id=user_id).exists()
                        logger.error(f"[JWT Auth] User ID {user_id} exists in DB: {user_exists}")
                    except Exception as decode_error:
                        logger.error(f"[JWT Auth] Failed to decode token for debugging: {str(decode_error)}")
            raise
        except Exception as e:
            logger.error(f"[JWT Auth] UNEXPECTED ERROR - Path: {request.path}, Error: {str(e)}", exc_info=True)
            raise
