import requests

BACKEND_URL = "http://localhost:5253"

def main():
    print("Clearing database...")
    
    # Delete all movies
    try:
        response = requests.delete(f"{BACKEND_URL}/api/movies")
        print(f"Deleted movies: {response.status_code}")
    except Exception as e:
        print(f"Error deleting movies: {e}")

    # Delete all genres
    try:
        response = requests.delete(f"{BACKEND_URL}/api/genres")
        print(f"Deleted genres: {response.status_code}")
    except Exception as e:
        print(f"Error deleting genres: {e}")

if __name__ == "__main__":
    main()