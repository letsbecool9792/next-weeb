import requests


def getInfo(name):
    url = "https://api.jikan.moe/v4/anime/?q=" + str(name) 
    response = requests.get(url)
    data = response.json()

    firstResult = data['data'][0] #first result of the search, likely the anime been looked for

    titles = firstResult.get('titles', [])
    for title in titles:
        if title['type'] == 'English':
            print('Title: ' + title['title'])

    episodes = firstResult.get('episodes', [])
    print('Episodes: ' + str(episodes))

    status = firstResult.get('status', [])
    print('Status: ' + status)

    genreNames = ''
    genres = firstResult.get('genres', [])
    for genre in genres:
        genreNames += genre['name'] + ', '
        
    print('Genres: ' + genreNames[:-2])


name = input('Enter the name of anime: ')
getInfo(name)

def reccomendation():
    # reccommendation based off of anime they've watched
    print('hi')

