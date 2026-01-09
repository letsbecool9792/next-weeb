from django.urls import path, re_path
from .views import mal_login, mal_callback, exchange_oauth_token, sync_mal_profile, cached_mal_profile
from .views import sync_anime_list, get_cached_anime_list, session_status, mal_logout
from .views import anime_detail, search_anime, get_stats_data, health_check, get_csrf_token, debug_config
from .views import get_recommendations, ai_recommendation_chat, posthog_proxy

urlpatterns = [
    # Health check and debug
    path('health/', health_check, name='health_check'),
    path('debug-config/', debug_config, name='debug_config'),
    path('csrf-token/', get_csrf_token, name='get_csrf_token'),
    
    # PostHog proxy to bypass ad blockers - catch all paths
    re_path(r'^posthog/(?P<path>.*)$', posthog_proxy, name='posthog_proxy'),
    
    # OAuth and JWT auth
    path('login/', mal_login, name='mal_login'),
    path('callback/', mal_callback, name='mal_callback'),
    path('exchange-token/', exchange_oauth_token, name='exchange_oauth_token'),

    path('sync-profile/', sync_mal_profile, name = 'sync_mal_profile'),
    path('cached-profile/', cached_mal_profile, name = 'cached_mal_profile'),

    path('sync-animelist/', sync_anime_list, name = 'sync_anime_list'),
    path('cached-animelist/', get_cached_anime_list, name = 'get_cached_anime_list'),

    path('anime/<int:anime_id>/', anime_detail, name='anime_detail'),
    path('search-anime/', search_anime, name='search_anime'),
    path('stats-data/', get_stats_data, name='get_stats_data'),
    
    # Recommendations
    path('recommendations/', get_recommendations, name='get_recommendations'),
    path('ai-chat/', ai_recommendation_chat, name='ai_recommendation_chat'),

    path('session-status/', session_status, name = 'session_status'),

    path('logout/', mal_logout, name = 'logout'),
]