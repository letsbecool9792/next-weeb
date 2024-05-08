import requests


def getInfo(name):
    url = "https://api.jikan.moe/v4/anime/?q=" + str(name) 
    response = requests.get(url)
    data = response.json()

    firstResult = data['data'][0] #first result of the search, likely the anime being looked for

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

    themeNames = ''
    themes = firstResult.get('themes', [])
    for theme in themes:
        themeNames += theme['name'] + ', '    
    print('Themes: ' + themeNames[:-2])

    studio = firstResult.get('studios', [])
    studios = studio[0].get('name')
    print('Studios: ' + studios)

# dont need this as of right now for testing
# name = input('Enter the name of anime: ')
# getInfo(name)

def recommendationByShowsTheyWatched():
    # to make anime recommendation based off of the stuff they have already watched
    # input a bunch of anime they have watched

    print('Enter the shows that you have watched (s to stop)')

    showsWatched = []
    while True:
        show = input()
        if show == 's':
            break
        showsWatched.append(show)
    
    # find info such as genres, studios and themes
    # store it in an array ig?


    

    print(showsWatched)

recommendationByShowsTheyWatched()

