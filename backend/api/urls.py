from django.urls import path
from .views import mal_login, mal_callback, mal_user_profile

urlpatterns = [
    # path('test/', test_api, name='test_api'),
    path('login/', mal_login, name='mal_login'),
    path('callback/', mal_callback, name='mal_callback'),
    path("profile/", mal_user_profile, name="mal_user_profile"),
]