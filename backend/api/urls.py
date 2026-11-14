from django.urls import path, re_path
from .views import oauth_config, exchange_oauth_token, sync_mal_profile, cached_mal_profile
from .views import sync_anime_list, get_cached_anime_list
from .views import anime_detail, search_anime, get_stats_data, health_check
from .views import get_recommendations, ai_recommendation_chat, posthog_proxy, refresh_jwt_token

urlpatterns = [
    # Health check
    path('health/', health_check, name='health_check'),

    # PostHog proxy to bypass ad blockers - catch all paths
    re_path(r'^posthog/(?P<path>.*)$', posthog_proxy, name='posthog_proxy'),

    # OAuth and JWT auth
    path('oauth-config/', oauth_config, name='oauth_config'),
    path('exchange-token/', exchange_oauth_token, name='exchange_oauth_token'),
    path('token/refresh/', refresh_jwt_token, name='refresh_jwt_token'),

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
]
