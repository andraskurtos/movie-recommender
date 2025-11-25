import csv
import time
import json
import os
from pathlib import Path
import requests
from dotenv import load_dotenv

# --- Environment Setup ---

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

# Critical check for API key
print(f"Environment variables loaded. TMDB API key {'found' if TMDB_API_KEY else 'NOT FOUND'}")
if not TMDB_API_KEY:
    raise ValueError("VITE_TMDB_API_KEY not found in environment variables. Stopping script.")

print(f"Using TMDB API key starting with: {TMDB_API_KEY[:4]}...")

# API and Rate Limit Constants
TMDB_API_BASE_URL = "https://api.themoviedb.org/3/movie/"
BACKEND_URL = "http://localhost:5253"
TIMEOUT = 10  # seconds for requests timeout

# --- CRITICAL ---
# We now make 2 API calls per movie (details + credits).
# To stay under the 40 req/sec limit, we can only process 20 movies per second.
RATE_LIMIT = 20  # movies per second (will result in 40 requests per second)
RATE_LIMIT_INTERVAL = 1  # second

# Optional limit for testing
POPULATE_LIMIT = int(os.getenv("POPULATE_LIMIT", "0"))  # 0 means no limit

# --- TMDB API Functions ---

def fetch_tmdb_data(tmdb_id):
    """
    Fetches both movie details and credits from TMDB and combines them.
    Returns a single 'movie_data' dictionary or None on failure.
    """
    params = {"api_key": TMDB_API_KEY}
    movie_data = None
    
    # 1. Get Movie Details
    details_url = f"{TMDB_API_BASE_URL}{tmdb_id}"
    try:
        response = requests.get(details_url, params=params, timeout=TIMEOUT)
        if response.status_code == 200:
            movie_data = response.json()
        else:
            print(f"TMDB Details error: Status {response.status_code} for TMDB ID {tmdb_id}")
            return None
    except requests.exceptions.RequestException as e:
        print(f"TMDB Details request failed for TMDB ID {tmdb_id}: {str(e)}")
        return None

    # 2. Get Movie Credits (to find director)
    credits_url = f"{TMDB_API_BASE_URL}{tmdb_id}/credits"
    director_name = ""
    try:
        response = requests.get(credits_url, params=params, timeout=TIMEOUT)
        if response.status_code == 200:
            credits_data = response.json()
            # Find the director in the 'crew' list
            for member in credits_data.get("crew", []):
                if member.get("job") == "Director":
                    director_name = member.get("name", "")
                    break # Found the first director
    except requests.exceptions.RequestException as e:
        print(f"TMDB Credits request failed for TMDB ID {tmdb_id}: {str(e)}")
        # Don't return None, just proceed without a director

    # 3. Get Production Company (from details)
    production_company_name = ""
    companies = movie_data.get("production_companies", [])
    if companies:
        production_company_name = companies[0].get("name", "") # Just take the first one

    # 4. Add new fields to the main movie_data object
    movie_data["director"] = director_name
    movie_data["production_company"] = production_company_name
    
    return movie_data

# --- Backend Post Function ---

def post_movie_to_backend(movie_data, genre_ids):
    """Posts the formatted movie data to your .NET backend."""
    
    release_date = movie_data.get("release_date")
    year = 0
    if release_date:
        try:
            year = int(release_date.split("-")[0])
        except (ValueError, IndexError):
            pass
    
    # Construct the payload for your backend
    movie_info = {
        # Original fields
        "title": movie_data.get("title", "No Title Provided"),
        "year": year,
        "backdropUrl": f"https://image.tmdb.org/t/p/original{movie_data.get('backdrop_path', '')}" if movie_data.get('backdrop_path') else "",
        "posterUrl": f"https://image.tmdb.org/t/p/w500{movie_data.get('poster_path', '')}" if movie_data.get('poster_path') else "",
        "originalLanguage": movie_data.get("original_language", ""),
        "overview": movie_data.get("overview", ""),
        "genres": genre_ids,
        
        # --- NEW FIELDS ---
        # Use .get() with defaults to make them "optional"
        "runtime": movie_data.get("runtime", 0),
        "tagline": movie_data.get("tagline", ""),
        "voteAverage": movie_data.get("vote_average", 0.0),
        "productionCompany": movie_data.get("production_company", ""),
        "director": movie_data.get("director", "")
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/api/movies", json=movie_info, timeout=TIMEOUT)
        if response.status_code == 201: # 201 Created
            return True
        # Handle 200 OK which you use for duplicates
        if response.status_code == 200 and response.headers.get("X-Movie-Status") == "Existing":
            print(f"Duplicate found: {movie_info['title']}")
            return True # Still counts as a success
        else:
            print(f"Error posting movie '{movie_info['title']}': Status {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"Backend request failed for movie '{movie_info['title']}': {str(e)}")
        return False

# --- Main Execution ---

def main():
    # Get the directory where this script is located
    script_dir = Path(__file__).parent
    
    # --- 1. Load Genre Mapping from Backend ---
    print("Loading genre mapping from backend...")
    try:
        genres_response = requests.get(f"{BACKEND_URL}/api/genres")
        if genres_response.status_code != 200:
            print(f"Failed to get genres from backend. Status: {genres_response.status_code}")
            return
            
        genres_data = genres_response.json()
        
        if isinstance(genres_data, dict) and "$values" in genres_data:
            genres_list = genres_data["$values"]
        elif isinstance(genres_data, list):
            genres_list = genres_data
        else:
            print(f"Unexpected response format from genres endpoint: {genres_data}")
            return
            
        genre_mapping = {genre["name"]: genre["tmdbId"] for genre in genres_list if "name" in genre and "tmdbId" in genre}
        print(f"Loaded {len(genre_mapping)} genres from backend.")
        
    except requests.exceptions.RequestException as e:
        print(f"Could not connect to backend to get genres: {e}")
        return

    # --- 2. Load Movies.csv ---
    print("Loading movies.csv...")
    movies_path = script_dir / "datasets/ml-latest/movies.csv"
    movies = {}
    try:
        with open(movies_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                movie_id = row['movieId']
                genre_names = [genre.strip() for genre in row['genres'].split('|')]
                genre_ids = [genre_mapping[g] for g in genre_names if g in genre_mapping]
                
                movies[movie_id] = {
                    'title': row['title'],
                    'genres': genre_ids
                }
    except FileNotFoundError:
        print(f"Error: movies.csv not found at {movies_path}")
        return
    print(f"Loaded {len(movies)} movies from movies.csv.")

    # --- 3. Load links.csv and Process Movies ---
    print("Loading links.csv and starting population...")
    links_path = script_dir / "datasets/ml-latest/links.csv"
    
    total_posted = 0
    total_processed = 0
    rate_limit_counter = 0
    last_request_time = time.time()

    try:
        with open(links_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                movie_id = row['movieId']
                tmdb_id = row.get('tmdbId')
                
                if movie_id not in movies or not tmdb_id:
                    continue
                    
                total_processed += 1
                
                # --- Rate Limiting ---
                rate_limit_counter += 1
                if rate_limit_counter >= RATE_LIMIT:
                    time_passed = time.time() - last_request_time
                    if time_passed < RATE_LIMIT_INTERVAL:
                        sleep_time = RATE_LIMIT_INTERVAL - time_passed
                        time.sleep(sleep_time)
                    rate_limit_counter = 0
                    last_request_time = time.time()
                
                # --- Get Data and Post to Backend ---
                movie = movies[movie_id]
                
                # This function now gets all details, including director
                tmdb_data = fetch_tmdb_data(tmdb_id) 
                
                if tmdb_data:
                    if post_movie_to_backend(tmdb_data, movie['genres']):
                        total_posted += 1
                        print(f"[{total_posted}] Posted: {tmdb_data.get('title', 'Unknown Title')} (TMDB ID: {tmdb_id})")
                    else:
                        print(f"Failed to post: {movie['title']} (TMDB ID: {tmdb_id})")
                else:
                    print(f"No TMDB data found for TMDB ID: {tmdb_id} (MovieLens ID: {movie_id})")

                # --- Population Limit (for testing) ---
                if POPULATE_LIMIT > 0 and total_posted >= POPULATE_LIMIT:
                    print(f"Reached populate limit of {POPULATE_LIMIT}. Stopping.")
                    break
                    
    except FileNotFoundError:
        print(f"Error: links.csv not found at {links_path}")
        return

    print(f"\n--- Finished! ---")
    print(f"Processed {total_processed} movies from links.csv.")
    print(f"Successfully posted {total_posted} movies to database.")

if __name__ == "__main__":
    main()
