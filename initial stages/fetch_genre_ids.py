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

# We'll fetch a bunch of popular anime and collect all unique genres with their IDs
print("Fetching top-ranked anime to extract genre IDs...\n")

all_genres = {}

# Fetch top anime by different rankings to get diverse genre coverage
ranking_types = ['all', 'airing', 'upcoming', 'bypopularity', 'favorite']

for ranking_type in ranking_types:
    print(f"Fetching ranking: {ranking_type}...")
    
    url = "https://api.myanimelist.net/v2/anime/ranking"
    params = {
        'ranking_type': ranking_type,
        'limit': 100,
        'fields': 'genres'
    }
    
    response = requests.get(url, headers=headers, params=params)
    
    if response.status_code == 200:
        data = response.json()
        
        for item in data.get('data', []):
            anime = item.get('node', {})
            genres = anime.get('genres', [])
            
            for genre in genres:
                genre_id = genre.get('id')
                genre_name = genre.get('name')
                
                if genre_id and genre_name:
                    all_genres[genre_name] = genre_id
        
        print(f"  Found {len(data.get('data', []))} anime")
    else:
        print(f"  ERROR: {response.status_code} - {response.text}")

print(f"\n{'='*60}")
print(f"TOTAL UNIQUE GENRES FOUND: {len(all_genres)}")
print(f"{'='*60}\n")

# Sort by genre ID
sorted_genres = dict(sorted(all_genres.items(), key=lambda x: x[1]))

print("GENRE_IDS = {")
for genre_name, genre_id in sorted_genres.items():
    print(f'    "{genre_name}": {genre_id},')
print("}\n")

# Save to JSON file
output_file = os.path.join(os.path.dirname(__file__), 'mal_genre_ids.json')
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(sorted_genres, f, indent=2, ensure_ascii=False)

print(f"Genre IDs saved to: {output_file}")
print("\nYou can now copy the GENRE_IDS dictionary into your views.py!")
