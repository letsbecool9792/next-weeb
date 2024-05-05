# bunch of extra stuff that im trying out 
# but they didnt make it into the final product


# animeID = 47917

# url = "https://api.jikan.moe/v4/anime/" + str(animeID)

# response = requests.get(url)





# def getGenre(id):
#     data = response.json().get('data', {})
#     # try:
#     genres = data.get('genres', [])

#     genreName = genres[0].get('name')

#     print(genres)
#     print(genreName)
#     # except:
#     #     print("Error: 'genres' key not found in JSON response:")

# getGenre(animeID)







# if response.status_code == 200:
#     data = response.json().get('data', {})
#     try:
#         # Access the 'titles' list
#         titles = data.get('titles', [])
        
#         title = None

#         # Iterate through the list to find the title with type 'Default'
#         for title_info in titles:
#             if title_info['type'] == 'Default':
#                 title = title_info['title']
#                 break  

#         # If the 'Default' title is not found, try to fetch the first title in the list
#         if title is None and titles:
#             title = titles[0]['title']

#         # Print the fetched title
#         print("Title:", title)


#     except KeyError:
#         print("Error: 'titles' key not found in JSON response:")
#         print(data)
# else:
#     print(f"Error: {response.status_code}")