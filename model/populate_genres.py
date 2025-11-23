import requests

def fetch_tmdb_genres(api_key):
    """Fetch all movie genres from TMDB API"""
    url = f"https://api.themoviedb.org/3/genre/movie/list"
    headers = {
        "accept": "application/json",
        "Authorization": f"Bearer {api_key}"
    }
    
    response = requests.get(url, params={"api_key": api_key})
    if response.status_code == 200:
        return response.json()["genres"]
    else:
        print(f"Error fetching genres from TMDB: {response.status_code}")
        return None

def post_genre_to_api(genre, api_url):
    """Post a single genre to our API"""
    response = requests.post(
        f"{api_url}/api/Genres",
        json={
            "name": genre["name"],
            "tmdbId": genre["id"]
        }
    )
    
    if response.status_code in [200, 201]:
        status = "Created" if response.status_code == 201 else "Already exists"
        print(f"✓ Genre '{genre['name']}' (ID: {genre['id']}) - {status}")
    else:
        print(f"✕ Error posting genre '{genre['name']}': {response.status_code}")

def main():
    # Configuration
    TMDB_API_KEY = "e369b607d54c91cd7f5897b41b0d0635"
    API_URL = "http://localhost:5253"
    
    print("Fetching genres from TMDB...")
    genres = fetch_tmdb_genres(TMDB_API_KEY)
    
    if not genres:
        print("Failed to fetch genres from TMDB")
        return
    
    print(f"\nFound {len(genres)} genres. Posting to local API...")
    
    for genre in genres:
        post_genre_to_api(genre, API_URL)
    
    print("\nDone!")

if __name__ == "__main__":
    main()