from django.urls import path
from .views import mal_login, mal_callback, sync_mal_profile, cached_mal_profile
from .views import sync_anime_list, get_cached_anime_list, session_status, mal_logout
from .views import anime_detail, search_anime, get_stats_data

urlpatterns = [
    # path('test/', test_api, name='test_api'),
    path('login/', mal_login, name = 'mal_login'),
    path('callback/', mal_callback, name = 'mal_callback'),

    path('sync-profile/', sync_mal_profile, name = 'sync_mal_profile'),
    path('cached-profile/', cached_mal_profile, name = 'cached_mal_profile'),

    path('sync-animelist/', sync_anime_list, name = 'sync_anime_list'),
    path('cached-animelist/', get_cached_anime_list, name = 'get_cached_anime_list'),

    path('anime/<int:anime_id>/', anime_detail, name='anime_detail'),
    path('search-anime/', search_anime, name='search_anime'),
    path('stats-data/', get_stats_data, name='get_stats_data'),

    path('session-status/', session_status, name = 'session_status'),

    path('logout/', mal_logout, name = 'logout'),
]