from django.urls import path
from .views import mal_login, mal_callback, mal_user_profile, mal_anime_list, sync_anime_list, get_cached_anime_list

urlpatterns = [
    # path('test/', test_api, name='test_api'),
    path('login/', mal_login, name = 'mal_login'),
    path('callback/', mal_callback, name = 'mal_callback'),
    path('profile/', mal_user_profile, name = 'mal_user_profile'),
    path('animelist/', mal_anime_list, name = 'mal_anime_list'),
    path('sync-animelist/', sync_anime_list, name = 'sync_anime_list'),
    path('cached-animelist/', get_cached_anime_list, name = 'get_cached_anime_list'),
]