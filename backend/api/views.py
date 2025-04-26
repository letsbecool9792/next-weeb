import requests
import base64, os

import jwt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from django.conf import settings
from django.shortcuts import redirect
from django.http import JsonResponse

from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.contrib.auth import login
from django.contrib.auth import logout

from django.views.decorators.csrf import csrf_exempt

from django.shortcuts import redirect

from .models import AnimeEntry
from .models import UserProfile

# OAuth URLs
MAL_AUTH_URL = "https://myanimelist.net/v1/oauth2/authorize"
MAL_TOKEN_URL = "https://myanimelist.net/v1/oauth2/token"

# Get CLIENT_ID and CLIENT_SECRET from settings safely
CLIENT_ID = getattr(settings, "MAL_CLIENT_ID", None)
CLIENT_SECRET = getattr(settings, "MAL_CLIENT_SECRET", None)
REDIRECT_URI = getattr(settings, "MAL_REDIRECT_URI", None)

FRONTEND_URL = "http://localhost:5173"

def generate_code_verifier():
    """ Generate a secure random code_verifier """
    return base64.urlsafe_b64encode(os.urandom(32)).decode("utf-8").rstrip("=")

def generate_code_challenge(code_verifier):
    """ For MAL, simply return the code_verifier """
    return code_verifier

def mal_login(request):
    """
    Redirects the user to MyAnimeList's OAuth authorization page.
    """
    code_verifier = generate_code_verifier()
    code_challenge = generate_code_challenge(code_verifier)

    # Store code_verifier in session
    request.session["code_verifier"] = code_verifier

    print(f"Generated code_verifier: {code_verifier}")
    print(f"Generated code_challenge: {code_challenge}")

    auth_url = (
        f"{MAL_AUTH_URL}?response_type=code"
        f"&client_id={CLIENT_ID}"
        f"&redirect_uri={REDIRECT_URI}"
        f"&code_challenge={code_challenge}"
        f"&code_challenge_method=plain"
    )

    return redirect(auth_url)

def mal_callback(request):
    """
    Handles the OAuth callback from MyAnimeList, exchanges the code for an access token.
    """
    code = request.GET.get("code")
    print(f"Received authorization code: {code}")

    if not code:
        return JsonResponse({"error": "Authorization failed, no code received."}, status=400) 

    code_verifier = request.session.get("code_verifier")
    print(f"Retrieved code_verifier from session: {code_verifier}")

    if not code_verifier:
        return JsonResponse({"error": "Missing PKCE code_verifier"}, status=400)

    # Exchange the authorization code for an access token
    token_data = {
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "code": code,
        "grant_type": "authorization_code",
        "redirect_uri": REDIRECT_URI,
        "code_verifier": code_verifier,
    }

    response = requests.post(MAL_TOKEN_URL, data=token_data)
    print(f"Token request response status: {response.status_code}")
    print(f"Token request response text: {response.text}")

    if response.status_code == 200:
        token_json = response.json()
        access_token = token_json.get("access_token")

        request.session["mal_access_token"] = access_token

        user_info_response = requests.get(
            "https://api.myanimelist.net/v2/users/@me",
            headers={"Authorization": f"Bearer {access_token}"},
        )

        if user_info_response.status_code != 200:
            return JsonResponse({"error": "Failed to fetch MAL user info"}, status = 400)
        
        mal_user = user_info_response.json()
        mal_username = mal_user.get("name")

        user, _ = User.objects.get_or_create(username=mal_username)

        profile, _ = UserProfile.objects.get_or_create(user=user)
        profile.mal_access_token = access_token
        profile.save()

        login(request, user)

        print(f"Is user authenticated in Django? {request.user.is_authenticated}")
        print(f"Logged in as: {request.user.username}")


        # return JsonResponse({"message": "Login successful", "access_token": access_token})
        return redirect(f"{FRONTEND_URL}/dashboard")  # Or whatever route you want to land on in React

    return JsonResponse({"error": "Failed to retrieve access token", "details": response.text}, status=400)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def sync_mal_profile(request):
    """ Fetch from MAL and store in UserProfile """
    token = request.session.get("mal_access_token")
    if not token:
        return Response({"error": "Not authenticated"}, status=401)

    headers = {"Authorization": f"Bearer {token}"}
    r = requests.get("https://api.myanimelist.net/v2/users/@me", headers=headers)
    if r.status_code != 200:
        return Response({"error": "MAL error", "details": r.text}, status=400)

    data = r.json()
    prof = request.user.userprofile
    prof.name = data.get("name")
    prof.birthday = data.get("birthday")
    prof.location = data.get("location")
    prof.joined_at = data.get("joined_at")
    prof.picture = data.get("picture") # or data.get("main_picture", {}).get("medium")
    prof.save()

    return Response({"message": "Profile synced"})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def cached_mal_profile(request):
    """ Return the stored profile """
    prof = request.user.userprofile
    return Response({
        "name": prof.name,
        "birthday": prof.birthday,
        "location": prof.location,
        "joined_at": prof.joined_at,
        "picture": prof.picture,
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def sync_anime_list(request):
    access_token = request.session.get("mal_access_token")
    if not access_token:
        return JsonResponse({"error": "User not authenticated"}, status=401)

    headers = {"Authorization": f"Bearer {access_token}"}
    url = "https://api.myanimelist.net/v2/users/@me/animelist"
    params = {"fields": "list_status", "limit": 1000}
    response = requests.get(url, headers=headers, params=params)

    if response.status_code != 200:
        return JsonResponse({"error": "Failed to fetch anime list", "details": response.text}, status=400)

    anime_list = response.json().get("data", [])

    AnimeEntry.objects.filter(user=request.user).delete()

    for item in anime_list:
        anime = item["node"]
        status = item["list_status"]
        AnimeEntry.objects.create(
            user=request.user,
            mal_id=anime["id"],
            title=anime["title"],
            status=status.get("status", ""),
            image_url=anime.get("main_picture", {}).get("medium"),
            score=status.get("score"),
            episodes_watched=status.get("num_episodes_watched"),
            is_rewatching=status.get("is_rewatching", False),
            start_date=status.get("start_date") or None,
            finish_date=status.get("finish_date") or None,
            last_updated=status.get("updated_at") or None
        )

    return JsonResponse({"message": "Anime list synced", "count": len(anime_list)})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_cached_anime_list(request):
    entries = AnimeEntry.objects.filter(user=request.user).values(
        "title",
        "image_url",
        "status",
        "score",
        "episodes_watched",
        "is_rewatching",
        "start_date",
        "finish_date",
        "last_updated",
    )
    return JsonResponse(list(entries), safe=False)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def session_status(request):
    return Response({
        "is_authenticated": True,
        "username": request.user.username,
    })

#@csrf_exempt
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mal_logout(request):
    logout(request)
    return JsonResponse({"message": "Logout successful"})