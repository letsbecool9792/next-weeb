# for testing


import requests


# url = "https://api.jikan.moe/v4/recommendations/anime"

# response = requests.get(url)
# data = response.json()

# print(data)

studios = []


url = "https://api.jikan.moe/v4/anime/?q=" + str('bocchi') 
response = requests.get(url)
data = response.json()

firstResult = data['data'][0]

themes = []

themes1 = firstResult.get('themes', [])
# genres1 = firstResult.get('genres', [])
# studios1 = firstResult.get('studios', [])

# # studios.append(studios1['name'])

for theme in themes1:
    themes.append(theme['name'])


print(themes)
# print(genres1)
# print(studios1)


# themes output: 
# [{'mal_id': 52, 'type': 'anime', 'name': 'CGDCT', 'url': 'https://myanimelist.net/anime/genre/52/CGDCT'}, 
# {'mal_id': 19, 'type': 'anime', 'name': 'Music', 'url': 'https://myanimelist.net/anime/genre/19/Music'}]

# genres output:
# [{'mal_id': 4, 'type': 'anime', 'name': 'Comedy', 'url': 'https://myanimelist.net/anime/genre/4/Comedy'}]

# studios output
# [{'mal_id': 1835, 'type': 'anime', 'name': 'CloverWorks', 'url': 'https://myanimelist.net/anime/producer/1835/CloverWorks'}]