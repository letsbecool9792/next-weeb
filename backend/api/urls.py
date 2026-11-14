from django.urls import path, re_path

from .views import auth, chat, library, recommendations, system, tokens

urlpatterns = [
    # Health check
    path('health/', system.health_check, name='health_check'),
    path('showcase/', system.showcase, name='showcase'),

    # PostHog proxy to bypass ad blockers - catch all paths
    re_path(r'^posthog/(?P<path>.*)$', system.posthog_proxy, name='posthog_proxy'),

    # MAL login, then our own JWTs
    path('oauth-config/', auth.oauth_config, name='oauth_config'),
    path('exchange-token/', auth.exchange_oauth_token, name='exchange_oauth_token'),
    path('token/refresh/', tokens.RefreshView.as_view(), name='token_refresh'),
    path('logout/', tokens.LogoutView.as_view(), name='logout'),

    # The user's own data
    path('sync-profile/', library.sync_mal_profile, name='sync_mal_profile'),
    path('cached-profile/', library.cached_mal_profile, name='cached_mal_profile'),
    path('sync-animelist/', library.sync_anime_list, name='sync_anime_list'),
    path('cached-animelist/', library.get_cached_anime_list, name='get_cached_anime_list'),
    path('stats-data/', library.get_stats_data, name='get_stats_data'),

    # Any anime on MAL
    path('anime/<int:anime_id>/', library.anime_detail, name='anime_detail'),
    path('search-anime/', library.search_anime, name='search_anime'),

    # Recommendations
    path('recommendations/', recommendations.get_recommendations, name='get_recommendations'),
    path('ai-chat/', chat.ai_recommendation_chat, name='ai_recommendation_chat'),
]
