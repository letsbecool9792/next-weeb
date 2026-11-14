"""The AI chat on the recommendations page (Google Gemini)."""
import os

from google import genai
from google.genai import types
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ..throttles import AiChatThrottle


# Configure Gemini using new SDK
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')
gemini_client = None
if GEMINI_API_KEY:
    gemini_client = genai.Client(api_key=GEMINI_API_KEY)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@throttle_classes([AiChatThrottle])
def ai_recommendation_chat(request):
    """
    AI chatbot for recommendations - enhances algorithm results with natural language
    """
    print(f"[AI Chat] Request received from user: {request.user.username}")
    
    if not GEMINI_API_KEY:
        print("[AI Chat] ERROR: No Gemini API key configured")
        return Response({"error": "AI service not configured"}, status=503)
    
    user_message = request.data.get("message", "")
    user_anime_context = request.data.get("context", [])
    algorithm_suggestions = request.data.get("suggestions", [])
    
    print(f"[AI Chat] User message: {user_message[:50]}...")
    
    if not user_message:
        return Response({"error": "Message is required"}, status=400)
    
    # Build context prompt
    watched_titles = [anime.get("title", "") for anime in user_anime_context[:10]]
    suggested_titles = [anime.get("title", "") for anime in algorithm_suggestions[:10]]
    
    prompt = f"""You are a concise anime recommendation assistant.

User has watched and enjoyed: {', '.join(watched_titles)}

User asks: "{user_message}"

Respond in 2-3 short sentences. Be direct and helpful."""
    
    # Debug: Log prompt details
    print(f"[AI Chat] Watched titles count: {len(watched_titles)}")
    print(f"[AI Chat] Total prompt length: {len(prompt)} chars")
    
    try:
        print("[AI Chat] Calling Gemini API...")
        import time
        start_time = time.time()
        
        # Configure safety settings using new SDK
        config = types.GenerateContentConfig(
            temperature=0.7,
            max_output_tokens=2000,
            safety_settings=[
                types.SafetySetting(
                    category=types.HarmCategory.HARM_CATEGORY_HARASSMENT,
                    threshold=types.HarmBlockThreshold.BLOCK_NONE,
                ),
                types.SafetySetting(
                    category=types.HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                    threshold=types.HarmBlockThreshold.BLOCK_NONE,
                ),
                types.SafetySetting(
                    category=types.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                    threshold=types.HarmBlockThreshold.BLOCK_NONE,
                ),
                types.SafetySetting(
                    category=types.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                    threshold=types.HarmBlockThreshold.BLOCK_NONE,
                ),
            ]
        )
        
        response = gemini_client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=config
        )
        
        elapsed = time.time() - start_time
        print(f"[AI Chat] Gemini responded in {elapsed:.2f}s")
        
        # Check if response has text
        if not response.text:
            print("[AI Chat] Response blocked or empty.")
            if response.candidates and len(response.candidates) > 0:
                finish_reason = response.candidates[0].finish_reason
                print(f"[AI Chat] Finish reason: {finish_reason}")
                
                if finish_reason == 'MAX_TOKENS':
                    return Response({
                        "message": "Response got cut off (too long). Try asking a shorter question.",
                        "suggestions": suggested_titles
                    })
                elif finish_reason == 'SAFETY':
                    return Response({
                        "message": "Content was filtered by safety settings. Try rephrasing your question.",
                        "suggestions": suggested_titles
                    })
            
            return Response({
                "message": "Couldn't generate a response. Try asking differently.",
                "suggestions": suggested_titles
            })
        
        print(f"[AI Chat] Response length: {len(response.text)} chars")
        
        return Response({
            "message": response.text,
            "suggestions": suggested_titles
        })
    except Exception as e:
        print(f"[AI Chat] ERROR: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        
        # Parse error and give user-friendly messages
        error_str = str(e).lower()
        
        if '503' in error_str or 'overloaded' in error_str or 'unavailable' in error_str:
            error_message = "Gemini is lowkey overloaded right now. Try again in a few minutes."
        elif '429' in error_str or 'rate limit' in error_str or 'quota' in error_str:
            error_message = "Hit the rate limit! We're sending too many requests. Wait a minute and try again."
        elif '401' in error_str or 'unauthorized' in error_str or 'api key' in error_str:
            error_message = "API key issue. Something's wrong on our end. Contact support."
        elif '400' in error_str or 'invalid' in error_str:
            error_message = "Your message couldn't be processed. Try rephrasing?"
        elif 'timeout' in error_str or 'timed out' in error_str:
            error_message = "Request timed out. Gemini's taking too long. Try again."
        else:
            error_message = f"AI ran into an issue: {type(e).__name__}. Try again or rephrase your question."
        
        return Response({
            "message": error_message,
            "suggestions": suggested_titles
        })
