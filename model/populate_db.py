import csv
import time
import json
import os
from pathlib import Path
import requests
from dotenv import load_dotenv

# Load environment variables from frontend .env
env_path = os.path.join(os.path.dirname(__file__), "../frontend/.env")
print(f"Looking for .env file at: {env_path}")
if os.path.exists(env_path):
    print(".env file found")
    load_dotenv(env_path)
else:
    print("Warning: .env file not found!")

# Constants
TMDB_API_KEY = os.getenv("VITE_TMDB_API_KEY")
print(f"Environment variables loaded. TMDB API key {'found' if TMDB_API_KEY else 'not found'}")
if not TMDB_API_KEY:
    raise ValueError("VITE_TMDB_API_KEY not found in environment variables")

# Optional limit for testing
POPULATE_LIMIT = int(os.getenv("POPULATE_LIMIT", "0"))  # 0 means no limit
TIMEOUT = 10  # seconds for requests timeout
if not TMDB_API_KEY:
    raise ValueError("VITE_TMDB_API_KEY not found in environment variables")
print(f"Using TMDB API key: {TMDB_API_KEY}")
TMDB_SEARCH_URL = "https://api.themoviedb.org/3/search/movie"
BACKEND_URL = "http://localhost:5253"
RATE_LIMIT = 30  # requests per second
RATE_LIMIT_INTERVAL = 1  # second

def extract_year(title):
    try:
        # Look for a year in parentheses at the end of the title
        if title[-1] == ')' and '(' in title:
            year = title[title.rindex('(')+1:-1]
            if year.isdigit() and 1900 <= int(year) <= 2025:  # Sanity check
                return int(year), title[:title.rindex('(')].strip()
    except:
        pass
    return None, title

def search_tmdb(title, year):
    params = {
        "api_key": TMDB_API_KEY,
        "query": title,
        "year": year,
        "include_adult": "false"
    }
    
    try:
        response = requests.get(TMDB_SEARCH_URL, params=params, timeout=TIMEOUT)
        if response.status_code == 200:
            results = response.json().get("results", [])
            if results:
                return results[0]  # Return the first (best) match
    except requests.exceptions.RequestException as e:
        print(f"TMDB API error for {title}: {str(e)}")
    return None

def post_movie_to_backend(movie_data, genres):
    # Extract year from release date
    year = int(movie_data["release_date"].split("-")[0]) if movie_data.get("release_date") else 0
    
    movie_info = {
        "title": movie_data["title"],
        "year": year,
        "backdropUrl": movie_data.get("backdrop_path", ""),
        "posterUrl": movie_data.get("poster_path", ""),
        "originalLanguage": movie_data.get("original_language", ""),
        "overview": movie_data.get("overview", ""),
        "genres": genres
    }
    
    response = requests.post(f"{BACKEND_URL}/api/movies", json=movie_info)
    if response.status_code != 201:
        print(f"Error posting movie: Status {response.status_code}")
        print(f"Response: {response.text}")
    return response.status_code == 201

def main():
    # Get the directory where this script is located
    script_dir = Path(__file__).parent
    
    # Read links.csv to get TMDB IDs
    movies_path = script_dir / "ml-latest-small/movies.csv"
    links_path = script_dir / "ml-latest-small/links.csv"
    
    # Load genre mapping first
    genres_response = requests.get(f"{BACKEND_URL}/api/genres")
    if genres_response.status_code != 200:
        print("Failed to get genres from backend")
        return
        
    genres_data = genres_response.json()
    print("Got response:", type(genres_data))  # Debug print
    print(genres_data)  # Debug print full response
    
    # Extract genres from the response structure
    if isinstance(genres_data, dict) and "$values" in genres_data:
        genres_list = genres_data["$values"]
        genre_mapping = {genre["name"]: genre["tmdbId"] for genre in genres_list}
    elif isinstance(genres_data, list):
        genre_mapping = {genre["name"]: genre["tmdbId"] for genre in genres_data}
    else:
        print("Unexpected response format from genres endpoint")
        return

    print(f"Loaded {len(genre_mapping)} genres")

    movies = {}
    total_posted = 0
    rate_limit_counter = 0
    last_request_time = time.time()

    # Read movies and their genres
    with open(movies_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            movie_id = row['movieId']
            year, clean_title = extract_year(row['title'])
            genres = [genre.strip() for genre in row['genres'].split('|')]
            movies[movie_id] = {
                'title': clean_title,
                'year': year,
                'genres': [genre_mapping[g] for g in genres if g in genre_mapping]
            }

    print(f"Loaded {len(movies)} movies")

    # Read TMDB IDs
    with open(links_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            movie_id = row['movieId']
            
            # Only process movies with ID >= 4500
            if int(movie_id) < 4500:
                continue
                
            if movie_id not in movies:
                continue

            # Rate limiting
            rate_limit_counter += 1
            if rate_limit_counter >= RATE_LIMIT:
                time_passed = time.time() - last_request_time
                if time_passed < RATE_LIMIT_INTERVAL:
                    sleep_time = RATE_LIMIT_INTERVAL - time_passed
                    time.sleep(sleep_time)
                rate_limit_counter = 0
                last_request_time = time.time()

            movie = movies[movie_id]
            tmdb_data = search_tmdb(movie['title'], movie['year'])
            
            if tmdb_data:
                if post_movie_to_backend(tmdb_data, movie['genres']):
                    total_posted += 1
                    print(f"Posted movie: {movie['title']} ({movie['year']}) - TMDB ID: {tmdb_data['id']}")
                else:
                    print(f"Failed to post movie: {movie['title']}")
            else:
                print(f"No TMDB data found for: {movie['title']}")

    print(f"\nFinished! Posted {total_posted} movies to database")

if __name__ == "__main__":
    main()