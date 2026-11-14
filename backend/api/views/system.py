"""Health check and the PostHog analytics proxy."""
import json
import logging

import requests
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([AllowAny])
def showcase(request):
    """
    Covers of popular shows for the landing page's poster wall. Public (the
    visitor is not logged in yet) and read from our catalog, so it never
    calls MAL. Cached for 6 hours.
    """
    from django.core.cache import cache

    from ..catalog import ensure_catalog
    from ..models import Anime

    data = cache.get("showcase:v1")
    if data is None:
        ensure_catalog()
        shows = (
            Anime.objects.filter(in_catalog=True, mean__gte=8, popularity__lte=600)
            .exclude(image_url=None)
            .exclude(rating__in=["r+", "rx"])
            .order_by("popularity")[:72]
        )
        data = [{"id": a.mal_id, "title": a.title, "image": a.image_url} for a in shows]
        cache.set("showcase:v1", data, 6 * 60 * 60)
    return Response(data)


@csrf_exempt
@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    return Response({
        "status": "healthy",
        "service": "next-weeb-api",
        "message": "Server is running"
    }, status=200)


# PostHog reverse proxy to bypass ad blockers
@csrf_exempt
def posthog_proxy(request, path=''):
    """Proxy PostHog requests through our backend to bypass ad blockers"""
    posthog_host = 'https://us.i.posthog.com'
    
    # Build the full URL with the path from the URL parameter
    url = f"{posthog_host}/{path}"
    
    # Forward query parameters
    query_string = request.META.get('QUERY_STRING', '')
    if query_string:
        url += '?' + query_string
    
    try:
        headers = {
            'User-Agent': request.META.get('HTTP_USER_AGENT', 'Mozilla/5.0'),
        }
        
        if request.method == 'POST':
            headers['Content-Type'] = request.META.get('CONTENT_TYPE', 'application/json')
            response = requests.post(
                url,
                data=request.body,
                headers=headers,
                timeout=10
            )
        else:
            response = requests.get(
                url,
                headers=headers,
                timeout=10
            )
        
        # Return the response from PostHog
        django_response = HttpResponse(
            response.content,
            status=response.status_code,
        )
        
        # Copy important headers (NOT Content-Encoding - requests already decompresses)
        for header in ['Content-Type', 'Cache-Control']:
            if header in response.headers:
                django_response[header] = response.headers[header]
        
        return django_response
        
    except Exception as e:
        logger.error(f"[PostHog Proxy Error] {e}")
        return HttpResponse(
            json.dumps({'error': str(e)}),
            status=500,
            content_type='application/json'
        )
