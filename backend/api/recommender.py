"""
Recommendation logic: how candidates are found and scored.
Kept apart from the views so the scoring can be read on its own.
"""
from .mal import MalNotFound, MalUnavailable, mal_get


# MAL Genre ID mapping (fetched from MAL API)
GENRE_IDS = {
    "Action": 1,
    "Adventure": 2,
    "Racing": 3,
    "Comedy": 4,
    "Avant Garde": 5,
    "Mythology": 6,
    "Mystery": 7,
    "Drama": 8,
    "Ecchi": 9,
    "Fantasy": 10,
    "Strategy Game": 11,
    "Historical": 13,
    "Horror": 14,
    "Kids": 15,
    "Martial Arts": 17,
    "Mecha": 18,
    "Music": 19,
    "Parody": 20,
    "Samurai": 21,
    "Romance": 22,
    "School": 23,
    "Sci-Fi": 24,
    "Shoujo": 25,
    "Girls Love": 26,
    "Shounen": 27,
    "Space": 29,
    "Sports": 30,
    "Super Power": 31,
    "Vampire": 32,
    "Harem": 35,
    "Slice of Life": 36,
    "Supernatural": 37,
    "Military": 38,
    "Detective": 39,
    "Psychological": 40,
    "Suspense": 41,
    "Seinen": 42,
    "Josei": 43,
    "Award Winning": 46,
    "Gourmet": 47,
    "Workplace": 48,
    "Adult Cast": 50,
    "Anthropomorphic": 51,
    "CGDCT": 52,
    "Childcare": 53,
    "Combat Sports": 54,
    "Delinquents": 55,
    "Educational": 56,
    "Gag Humor": 57,
    "Gore": 58,
    "High Stakes Game": 59,
    "Idols (Female)": 60,
    "Isekai": 62,
    "Iyashikei": 63,
    "Love Polygon": 64,
    "Magical Sex Shift": 65,
    "Mahou Shoujo": 66,
    "Medical": 67,
    "Organized Crime": 68,
    "Otaku Culture": 69,
    "Performing Arts": 70,
    "Reincarnation": 72,
    "Reverse Harem": 73,
    "Love Status Quo": 74,
    "Showbiz": 75,
    "Survival": 76,
    "Team Sports": 77,
    "Time Travel": 78,
    "Video Game": 79,
    "Crossdressing": 81,
    "Urban Fantasy": 82,
    "Villainess": 83,
}


def mal_get_or_empty(user, path, params):
    """
    For recommendation sections: if MAL fails for one section, that section
    comes back empty instead of the whole page failing. An expired MAL login
    is not swallowed here, so it still reaches the frontend.
    """
    try:
        return mal_get(user, path, params)
    except (MalUnavailable, MalNotFound):
        return {}


def get_genre_compatibility(genre1, genre2):
    """
    Calculate compatibility score between two genres.
    Higher score = genres that pair well together.
    """
    # Define genre compatibility matrix - genres that commonly pair well
    compatibility_map = {
        # Music pairs well with
        "Music": {"Slice of Life": 3, "Drama": 2, "Comedy": 2, "School": 2},
        # Action pairs well with
        "Action": {"Adventure": 3, "Fantasy": 3, "Sci-Fi": 2, "Supernatural": 2, "Shounen": 2},
        # Romance pairs well with
        "Romance": {"Comedy": 3, "Drama": 3, "School": 2, "Slice of Life": 2, "Shoujo": 2},
        # Drama pairs well with
        "Drama": {"Romance": 3, "Slice of Life": 2, "Psychological": 2, "Music": 2},
        # Comedy pairs well with
        "Comedy": {"Slice of Life": 3, "Romance": 3, "School": 2, "Parody": 2},
        # Slice of Life pairs well with
        "Slice of Life": {"Comedy": 3, "Music": 3, "School": 2, "Iyashikei": 3},
        # Psychological pairs well with
        "Psychological": {"Thriller": 3, "Mystery": 3, "Supernatural": 2, "Drama": 2},
        # Fantasy pairs well with
        "Fantasy": {"Adventure": 3, "Action": 3, "Magic": 3, "Isekai": 2},
        # Sci-Fi pairs well with
        "Sci-Fi": {"Action": 2, "Mecha": 3, "Space": 3, "Psychological": 2},
        # Mystery pairs well with
        "Mystery": {"Psychological": 3, "Thriller": 3, "Supernatural": 2, "Detective": 3},
        # Sports pairs well with
        "Sports": {"Drama": 2, "School": 2, "Comedy": 2},
        # Shounen pairs well with
        "Shounen": {"Action": 2, "Adventure": 2, "Supernatural": 2, "Comedy": 2},
    }
    
    # Check both directions for compatibility
    score = compatibility_map.get(genre1, {}).get(genre2, 0)
    if score == 0:
        score = compatibility_map.get(genre2, {}).get(genre1, 0)
    
    return score


def calculate_similarity_score(anchor_anime, candidate_anime):
    """
    Calculate comprehensive similarity score between anchor and candidate.
    Factors: genre matching (weighted), theme overlap, score proximity, popularity tier.
    """
    anchor_genres = [g["name"] for g in anchor_anime.get("genres", [])]
    candidate_genres = [g["name"] for g in candidate_anime.get("genres", [])]
    anchor_themes = [t["name"] for t in anchor_anime.get("themes", [])]
    candidate_themes = [t["name"] for t in candidate_anime.get("themes", [])]
    
    # 1. Primary genre match (first 2 genres are most important)
    primary_genre_bonus = 0
    if anchor_genres and candidate_genres:
        # Exact match on primary genre is huge
        if anchor_genres[0] == candidate_genres[0]:
            primary_genre_bonus = 5
        # Primary genre appears anywhere in candidate
        elif anchor_genres[0] in candidate_genres:
            primary_genre_bonus = 3
        # Secondary genre match
        if len(anchor_genres) > 1 and anchor_genres[1] in candidate_genres[:2]:
            primary_genre_bonus += 2
    
    # 2. Genre compatibility bonus (do these genres work well together?)
    compatibility_bonus = 0
    for ag in anchor_genres[:2]:  # Check anchor's top 2 genres
        for cg in candidate_genres[:2]:  # Against candidate's top 2
            compatibility_bonus += get_genre_compatibility(ag, cg)
    
    # 3. Overall genre overlap (remaining genres)
    genre_set_overlap = len(set(anchor_genres) & set(candidate_genres))
    
    # 4. Theme overlap
    theme_overlap = len(set(anchor_themes) & set(candidate_themes))
    
    # 5. Score proximity bonus (same quality tier)
    anchor_score = anchor_anime.get("mean", 0)
    candidate_score = candidate_anime.get("mean", 0)
    score_diff = abs(anchor_score - candidate_score)
    
    # Lower bound only: if anchor is 8.7, accept 7.7-10.0
    min_acceptable_score = max(7.5, anchor_score - 1.0)
    if candidate_score < min_acceptable_score:
        return 0  # Reject if too low quality
    
    # Bonus for similar scores (within 0.5 = great, within 1.0 = good)
    if score_diff <= 0.5:
        score_proximity_bonus = 3
    elif score_diff <= 1.0:
        score_proximity_bonus = 2
    else:
        score_proximity_bonus = 0
    
    # 6. Popularity tier matching
    anchor_pop = anchor_anime.get("popularity", 99999)
    candidate_pop = candidate_anime.get("popularity", 99999)
    
    popularity_bonus = 0
    if anchor_pop < 500:  # Very popular anchor
        # Prefer popular recommendations
        if candidate_pop < 1000:
            popularity_bonus = 2
    elif anchor_pop < 2000:  # Moderately popular
        if candidate_pop < 3000:
            popularity_bonus = 1
    # No penalty for niche anchors - let genre/score guide
    
    # TOTAL SIMILARITY SCORE
    similarity = (
        primary_genre_bonus * 5 +      # Primary genre match is crucial (0-25 points)
        compatibility_bonus * 2 +       # Genre compatibility (0-12 points)
        genre_set_overlap * 2 +         # Other matching genres (0-10 points)
        theme_overlap * 1 +             # Themes (0-5 points)
        score_proximity_bonus * 3 +     # Similar quality (0-9 points)
        popularity_bonus * 2            # Popularity tier (0-4 points)
    )
    
    return similarity


def find_similar_anime(user, anchor_anime, watched_ids):
    """Find anime similar to the anchor by fetching popular anime and filtering by genre"""
    import json
    from pathlib import Path
    
    # Search using anchor's main genre
    if not anchor_anime.get("genres"):
        return []
    
    anchor_genres = anchor_anime.get("genres", [])
    main_genre = anchor_genres[0]["name"] if anchor_genres else ""
    secondary_genre = anchor_genres[1]["name"] if len(anchor_genres) > 1 else None
    anchor_score = anchor_anime.get("mean", 0)
    anchor_popularity = anchor_anime.get("popularity", 99999)
    
    # Initialize debug log
    debug_log = {
        "anchor_anime": {
            "title": anchor_anime.get("title"),
            "score": anchor_score,
            "popularity": anchor_popularity,
            "genres": [g["name"] for g in anchor_genres],
            "themes": [t["name"] for t in anchor_anime.get("themes", [])]
        },
        "search_strategy": {},
        "filters": {},
        "final_results": []
    }
    
    # Get genre IDs for filtering
    main_genre_id = GENRE_IDS.get(main_genre)
    secondary_genre_id = GENRE_IDS.get(secondary_genre) if secondary_genre else None
    
    # Fetch top-ranked anime by popularity and filter by genre
    all_candidates = {}
    
    # Fetch popular anime (increased limit for better coverage)
    params = {
        "ranking_type": "bypopularity",
        "limit": 500,  # Increased from 100 to 500
        "fields": "id,title,main_picture,genres,themes,mean,popularity,num_list_users"
    }
    
    search_results = []
    ranking = mal_get_or_empty(user, "/anime/ranking", params)

    if ranking:
        for item in ranking.get("data", []):
            anime = item["node"]
            anime_genre_ids = [g.get("id") for g in anime.get("genres", [])]
            
            # Only include if it has the main or secondary genre
            if main_genre_id in anime_genre_ids or (secondary_genre_id and secondary_genre_id in anime_genre_ids):
                all_candidates[anime["id"]] = anime
                search_results.append({
                    "id": anime["id"],
                    "title": anime.get("title"),
                    "score": anime.get("mean", 0),
                    "popularity": anime.get("popularity", 99999),
                    "genres": [g["name"] for g in anime.get("genres", [])]
                })
    
    debug_log["search_strategy"] = {
        "method": "Popular anime ranking filtered by genre",
        "ranking_type": "bypopularity",
        "limit": 500,
        "main_genre": main_genre,
        "main_genre_id": main_genre_id,
        "secondary_genre": secondary_genre,
        "secondary_genre_id": secondary_genre_id,
        "filter": f"Has {main_genre} (ID:{main_genre_id})" + (f" or {secondary_genre} (ID:{secondary_genre_id})" if secondary_genre_id else ""),
        "total_found": len(search_results),
        "results": search_results
    }
    
    debug_log["total_unique_candidates"] = len(all_candidates)
    
    results = list(all_candidates.values())
    similar = []
    seen_base_titles = set()
    
    # Track filtering stages
    filtered_already_watched = []
    filtered_low_score = []
    filtered_low_popularity = []
    filtered_sequels = []
    passed_filters = []
    
    for anime in results:
        anime_id = anime["id"]
        title = anime.get("title", "")
        score = anime.get("mean", 0)
        popularity_rank = anime.get("popularity", 99999)
        num_users = anime.get("num_list_users", 0)
        
        anime_info = {
            "id": anime_id,
            "title": title,
            "score": score,
            "popularity": popularity_rank,
            "num_users": num_users,
            "genres": [g["name"] for g in anime.get("genres", [])]
        }
        
        # Filter 1: Already watched
        if anime_id in watched_ids:
            filtered_already_watched.append(anime_info)
            continue
        
        # Filter 2: Score too low (relaxed from 7.5 to 7.0 minimum)
        min_score = max(7.0, anchor_score - 1.5)
        if score < min_score:
            filtered_low_score.append({**anime_info, "reason": f"Score {score} < {min_score}"})
            continue
        
        # Filter 3: Popularity/users filters (relaxed limits for larger pool)
        failed_popularity = False
        popularity_reason = ""
        
        # More lenient filters since we're working with top 500 popular anime
        if anchor_popularity < 500:
            # Very popular anchor - still prefer popular shows but more lenient
            if num_users < 30000:
                failed_popularity = True
                popularity_reason = f"Anchor very popular (<500), candidate users={num_users} too low"
        elif anchor_popularity < 2000:
            # Moderately popular - accept wider range
            if num_users < 15000:
                failed_popularity = True
                popularity_reason = f"Anchor moderate (<2000), candidate users={num_users} too low"
        else:
            # Niche anchor - very lenient
            if num_users < 5000:
                failed_popularity = True
                popularity_reason = f"Anchor niche, candidate users={num_users} too low"
        
        if failed_popularity:
            filtered_low_popularity.append({**anime_info, "reason": popularity_reason})
            continue
        
        # Filter 4: Sequels
        base_title = extract_base_title(title)
        if base_title in seen_base_titles:
            filtered_sequels.append({**anime_info, "base_title": base_title})
            continue
        seen_base_titles.add(base_title)
        
        # Calculate comprehensive similarity score
        similarity_score = calculate_similarity_score(anchor_anime, anime)
        
        if similarity_score > 0:
            anime_with_similarity = {
                **anime_info,
                "similarity_score": similarity_score
            }
            passed_filters.append(anime_with_similarity)
            
            similar.append({
                "id": anime["id"],
                "title": title,
                "image": anime.get("main_picture", {}).get("medium"),
                "score": score,
                "popularity": popularity_rank,
                "similarity": similarity_score
            })
    
    debug_log["filters"] = {
        "filter_1_already_watched": {
            "count": len(filtered_already_watched),
            "anime": filtered_already_watched
        },
        "filter_2_low_score": {
            "count": len(filtered_low_score),
            "min_required": max(7.0, anchor_score - 1.5),
            "note": "Relaxed from 7.5 to 7.0 minimum, anchor -1.5 instead of -1.0",
            "anime": filtered_low_score
        },
        "filter_3_popularity_users": {
            "count": len(filtered_low_popularity),
            "anime": filtered_low_popularity
        },
        "filter_4_sequels": {
            "count": len(filtered_sequels),
            "anime": filtered_sequels
        },
        "passed_all_filters": {
            "count": len(passed_filters),
            "anime": sorted(passed_filters, key=lambda x: x["similarity_score"], reverse=True)
        }
    }
    
    # Sort by COMBINED similarity and score (not just similarity alone)
    final_sorted = sorted(similar, key=lambda x: (x["similarity"], x["score"]), reverse=True)
    
    debug_log["final_results"] = [{
        "rank": i+1,
        "title": a["title"],
        "score": a["score"],
        "popularity": a["popularity"],
        "similarity_score": a["similarity"]
    } for i, a in enumerate(final_sorted)]
    
    # Save debug log to file
    anchor_title_clean = "".join(c for c in anchor_anime.get("title", "unknown") if c.isalnum() or c in (' ', '-', '_')).strip()
    anchor_title_clean = anchor_title_clean.replace(" ", "-")[:50]  # Limit filename length
    
    debug_dir = Path(__file__).parent.parent / "debug_recommendations"
    debug_dir.mkdir(exist_ok=True)
    
    debug_file = debug_dir / f"{anchor_title_clean}-recs.json"
    with open(debug_file, 'w', encoding='utf-8') as f:
        json.dump(debug_log, f, indent=2, ensure_ascii=False)
    
    print(f"DEBUG: Saved recommendation analysis to {debug_file}")
    
    return final_sorted


def extract_base_title(title):
    """Extract base title without season/sequel markers"""
    # Remove common sequel markers
    import re
    # Remove patterns like: 2nd Season, Season 2, Part 2, II, III, etc.
    base = re.sub(r'\s+(2nd|3rd|Season|Part|Episode|OVA|Movie|Special|Final).*', '', title, flags=re.IGNORECASE)
    base = re.sub(r'\s+[IVX]+$', '', base)  # Remove roman numerals at end
    base = re.sub(r'\s+\d+$', '', base)  # Remove numbers at end
    base = re.sub(r'[:\-].*', '', base)  # Remove everything after : or -
    return base.strip()


def search_by_genre(user, genre_name, watched_ids, limit=10):
    """Search anime by genre"""
    params = {
        "q": genre_name,
        "limit": 50,
        "fields": "id,title,main_picture,mean,popularity,genres,num_list_users"
    }
    
    results = mal_get_or_empty(user, "/anime", params).get("data", [])
    anime_list = []
    seen_base_titles = set()
    
    for item in results:
        anime = item["node"]
        if anime["id"] in watched_ids:
            continue
        
        # Quality filters
        score = anime.get("mean", 0)
        popularity_rank = anime.get("popularity", 99999)
        num_users = anime.get("num_list_users", 0)
        
        if score < 6.5 or popularity_rank > 5000 or num_users < 10000:
            continue
        
        # Filter sequels
        title = anime.get("title", "")
        base_title = extract_base_title(title)
        if base_title in seen_base_titles:
            continue
        seen_base_titles.add(base_title)
        
        # Check if genre matches
        if any(g["name"].lower() == genre_name.lower() for g in anime.get("genres", [])):
            anime_list.append({
                "id": anime["id"],
                "title": title,
                "image": anime.get("main_picture", {}).get("medium"),
                "score": score
            })
    
    return sorted(anime_list, key=lambda x: x["score"], reverse=True)[:limit]


def search_by_studio(user, studio_name, watched_ids, limit=8):
    """Search anime by studio"""
    params = {
        "q": studio_name,
        "limit": 50,
        "fields": "id,title,main_picture,mean,studios,popularity,num_list_users"
    }
    
    results = mal_get_or_empty(user, "/anime", params).get("data", [])
    anime_list = []
    seen_base_titles = set()
    
    for item in results:
        anime = item["node"]
        if anime["id"] in watched_ids:
            continue
        
        # Quality filters
        score = anime.get("mean", 0)
        popularity_rank = anime.get("popularity", 99999)
        num_users = anime.get("num_list_users", 0)
        
        if score < 6.5 or popularity_rank > 5000 or num_users < 10000:
            continue
        
        # Filter sequels
        title = anime.get("title", "")
        base_title = extract_base_title(title)
        if base_title in seen_base_titles:
            continue
        seen_base_titles.add(base_title)
        
        if any(s["name"].lower() == studio_name.lower() for s in anime.get("studios", [])):
            anime_list.append({
                "id": anime["id"],
                "title": title,
                "image": anime.get("main_picture", {}).get("medium"),
                "score": score
            })
    
    return sorted(anime_list, key=lambda x: x["score"], reverse=True)[:limit]


def find_hidden_gems(user, genres, watched_ids):
    """Find highly-rated but less popular anime"""
    all_gems = []
    seen_base_titles = set()
    
    for genre in genres[:2]:  # Search top 2 genres
        params = {
            "q": genre,
            "limit": 30,
            "fields": "id,title,main_picture,mean,popularity,num_list_users"
        }
        
        found = mal_get_or_empty(user, "/anime", params)
        if found:
            results = found.get("data", [])
            for item in results:
                anime = item["node"]
                if anime["id"] not in watched_ids:
                    score = anime.get("mean", 0)
                    popularity = anime.get("popularity", 99999)
                    num_users = anime.get("num_list_users", 0)
                    
                    # Hidden gem: good score (>7.0), somewhat popular but not mainstream (1000-5000), decent user count
                    if score > 7.0 and 1000 < popularity < 5000 and num_users > 5000:
                        title = anime.get("title", "")
                        base_title = extract_base_title(title)
                        if base_title in seen_base_titles:
                            continue
                        seen_base_titles.add(base_title)
                        
                        all_gems.append({
                            "id": anime["id"],
                            "title": title,
                            "image": anime.get("main_picture", {}).get("medium"),
                            "score": score,
                            "popularity": popularity
                        })
    
    return sorted(all_gems, key=lambda x: x["score"], reverse=True)
