# for testing


import requests


# url = "https://api.jikan.moe/v4/recommendations/anime"

# response = requests.get(url)
# data = response.json()

# print(data)


url = "https://api.jikan.moe/v4/anime/?q=" + str('Bocchi') 
response = requests.get(url)
data = response.json()

firstResult = data['data'][0]


print(firstResult)