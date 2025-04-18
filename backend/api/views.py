import requests
import base64, os
from django.conf import settings
from django.shortcuts import redirect
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from .models import UserProfile
from django.contrib.auth.models import User
from django.contrib.auth import login

# OAuth URLs
MAL_AUTH_URL = "https://myanimelist.net/v1/oauth2/authorize"
MAL_TOKEN_URL = "https://myanimelist.net/v1/oauth2/token"

# Get CLIENT_ID and CLIENT_SECRET from settings safely
CLIENT_ID = getattr(settings, "MAL_CLIENT_ID", None)
CLIENT_SECRET = getattr(settings, "MAL_CLIENT_SECRET", None)
REDIRECT_URI = getattr(settings, "MAL_REDIRECT_URI", None)

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
        # if created:
        #     user.set_unusable_password()
        #     user.save()

        profile, _ = UserProfile.objects.get_or_create(user=user)
        profile.mal_access_token = access_token
        profile.save()

        login(request, user)

        print(f"Is user authenticated in Django? {request.user.is_authenticated}")
        print(f"Logged in as: {request.user.username}")


        return JsonResponse({"message": "Login successful", "access_token": access_token})
    

    return JsonResponse({"error": "Failed to retrieve access token", "details": response.text}, status=400)


def mal_user_profile(request):
    access_token = request.session.get("mal_access_token")

    if not access_token:
        return JsonResponse({"error": "User not authenticated"}, status=401)
    
    headers = {"Authorization": f"Bearer {access_token}"}
    response = requests.get("https://api.myanimelist.net/v2/users/@me", headers=headers)

    if response.status_code == 200:
        return JsonResponse(response.json())

    return JsonResponse({"error": "Failed to fetch profile", "details": response.text}, status=400)