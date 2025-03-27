import requests
import base64, os
from django.conf import settings
from django.shortcuts import redirect
from django.http import JsonResponse

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

        # Store access token in session
        request.session["mal_access_token"] = access_token
        return JsonResponse({"message": "Login successful", "access_token": access_token})

    return JsonResponse({"error": "Failed to retrieve access token", "details": response.text}, status=400)