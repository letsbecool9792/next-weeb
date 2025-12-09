import requests
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'backend', '.env.development'))

MAL_CLIENT_ID = os.getenv('MAL_CLIENT_ID')

if not MAL_CLIENT_ID:
    print("ERROR: MAL_CLIENT_ID not found in .env.development")
    exit(1)

headers = {
    'X-MAL-Client-ID': MAL_CLIENT_ID
}

# Test genre: CGDCT (ID 52) - we know this has anime
test_genre_id = 52
test_genre_name = "CGDCT"

print(f"Testing undocumented MAL API endpoints for genre: {test_genre_name} (ID: {test_genre_id})")
print("="*80)

# Test cases - different possible endpoint patterns
test_cases = [
    {
        "name": "Pattern 1: /anime with genre param",
        "url": "https://api.myanimelist.net/v2/anime",
        "params": {
            "genre": str(test_genre_id),
            "limit": 10,
            "fields": "id,title,genres"
        }
    },
    {
        "name": "Pattern 2: /anime with genres param",
        "url": "https://api.myanimelist.net/v2/anime",
        "params": {
            "genres": str(test_genre_id),
            "limit": 10,
            "fields": "id,title,genres"
        }
    },
    {
        "name": "Pattern 3: /anime with genre_id param",
        "url": "https://api.myanimelist.net/v2/anime",
        "params": {
            "genre_id": str(test_genre_id),
            "limit": 10,
            "fields": "id,title,genres"
        }
    },
    {
        "name": "Pattern 4: /genre/{id}/anime",
        "url": f"https://api.myanimelist.net/v2/genre/{test_genre_id}/anime",
        "params": {
            "limit": 10,
            "fields": "id,title,genres"
        }
    },
    {
        "name": "Pattern 5: /anime/genre/{id}",
        "url": f"https://api.myanimelist.net/v2/anime/genre/{test_genre_id}",
        "params": {
            "limit": 10,
            "fields": "id,title,genres"
        }
    },
    {
        "name": "Pattern 6: /anime with filter[genre]",
        "url": "https://api.myanimelist.net/v2/anime",
        "params": {
            "filter[genre]": str(test_genre_id),
            "limit": 10,
            "fields": "id,title,genres"
        }
    },
    {
        "name": "Pattern 7: /anime with nsfw and genre",
        "url": "https://api.myanimelist.net/v2/anime",
        "params": {
            "genre": str(test_genre_id),
            "nsfw": "true",
            "limit": 10,
            "fields": "id,title,genres"
        }
    },
]

results = {}

for i, test in enumerate(test_cases, 1):
    print(f"\n[{i}/{len(test_cases)}] Testing: {test['name']}")
    print(f"URL: {test['url']}")
    print(f"Params: {test['params']}")
    
    try:
        response = requests.get(test['url'], headers=headers, params=test['params'], timeout=10)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            
            # Check if we got results
            anime_data = data.get('data', [])
            
            if anime_data:
                print(f"✅ SUCCESS! Got {len(anime_data)} results")
                print(f"First result: {anime_data[0].get('node', {}).get('title', 'N/A')}")
                
                # Verify it actually has the genre
                first_anime_genres = anime_data[0].get('node', {}).get('genres', [])
                genre_names = [g.get('name') for g in first_anime_genres]
                
                if test_genre_name in genre_names:
                    print(f"✅ VERIFIED: Anime has {test_genre_name} genre!")
                else:
                    print(f"⚠️  WARNING: Anime doesn't have {test_genre_name} genre. Genres: {genre_names}")
                
                results[test['name']] = {
                    "status": "SUCCESS",
                    "count": len(anime_data),
                    "sample": anime_data[:3]  # Save first 3 for inspection
                }
            else:
                print(f"❌ FAILED: Got 200 but no data")
                print(f"Response: {json.dumps(data, indent=2)[:500]}")
                results[test['name']] = {"status": "EMPTY", "response": data}
        
        elif response.status_code == 404:
            print(f"❌ FAILED: 404 Not Found - Endpoint doesn't exist")
            results[test['name']] = {"status": "NOT_FOUND"}
        
        elif response.status_code == 403:
            print(f"❌ FAILED: 403 Forbidden - Not allowed")
            results[test['name']] = {"status": "FORBIDDEN"}
        
        else:
            print(f"❌ FAILED: {response.status_code}")
            try:
                error_data = response.json()
                print(f"Error: {json.dumps(error_data, indent=2)}")
                results[test['name']] = {"status": f"ERROR_{response.status_code}", "error": error_data}
            except:
                print(f"Response: {response.text[:500]}")
                results[test['name']] = {"status": f"ERROR_{response.status_code}", "text": response.text[:500]}
    
    except requests.exceptions.Timeout:
        print(f"❌ FAILED: Request timeout")
        results[test['name']] = {"status": "TIMEOUT"}
    
    except Exception as e:
        print(f"❌ FAILED: {type(e).__name__}: {str(e)}")
        results[test['name']] = {"status": "EXCEPTION", "error": str(e)}

print("\n" + "="*80)
print("SUMMARY")
print("="*80)

successful = [name for name, result in results.items() if result.get("status") == "SUCCESS"]

if successful:
    print(f"\n✅ FOUND {len(successful)} WORKING ENDPOINT(S):")
    for name in successful:
        print(f"  - {name}")
        print(f"    Results: {results[name]['count']} anime")
else:
    print("\n❌ NO WORKING ENDPOINTS FOUND")
    print("\nConclusion: MAL API v2 does NOT support genre-based filtering via any endpoint.")
    print("We must use alternative approaches:")
    print("  1. Fetch ranking/popular anime and filter by genre IDs in Python")
    print("  2. Use Jikan API (unofficial scraper)")
    print("  3. Use text search and filter results")

# Save detailed results
output_file = os.path.join(os.path.dirname(__file__), 'genre_endpoint_test_results.json')
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(results, f, indent=2, ensure_ascii=False)

print(f"\nDetailed results saved to: {output_file}")
