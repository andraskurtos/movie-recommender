from surprise import SVD
import pandas as pd
import numpy as np
from typing import List, Dict, Tuple
import os
import sys
import re
import pickle

class MovieRecommender:
    def __init__(self, model_path: str = 'saved_models/svd_model.pkl'):
        # Load movies data for metadata
        self.movies_df = pd.read_csv('ml-latest-small/movies.csv')
        
        # Load the model from pickle file
        with open(model_path, 'rb') as f:
            self.model = pickle.load(f)
        
        # Extract year from title and create clean title
        self.movies_df['clean_title'] = self.movies_df['title'].apply(lambda x: re.sub(r'\s*\(\d{4}\)\s*$', '', x).lower().strip())
        self.movies_df['year'] = self.movies_df['title'].str.extract(r'\((\d{4})\)').astype(float)
        
    def find_movie_id(self, title: str, year: int) -> int:
        """Find the MovieLens ID for a movie based on its title and year."""
        clean_title = title.lower().strip()
        
        # Try exact match first
        matches = self.movies_df[
            (self.movies_df['clean_title'] == clean_title) &
            (self.movies_df['year'] == year)
        ]
        
        if len(matches) == 1:
            return int(matches.iloc[0]['movieId'])
        
        # If no exact match, try fuzzy matching on title with same year
        year_matches = self.movies_df[self.movies_df['year'] == year]
        if len(year_matches) > 0:
            # Simple fuzzy match - check if clean_title is contained in or contains any of the year_matches
            for _, movie in year_matches.iterrows():
                if clean_title in movie['clean_title'] or movie['clean_title'] in clean_title:
                    return int(movie['movieId'])
        
        return None

    def predict_rating(self, user_id: int, movie_id: int) -> float:
        """Predict rating for a specific user and movie."""
        prediction = self.model.predict(user_id, movie_id)
        return prediction.est
    
    def get_recommendations(self, 
                          user_id: int, 
                          user_ratings: List[Dict[str, any]],
                          n_recommendations: int = 50) -> List[Dict]:
        """
        Generate movie recommendations for a user based on their ratings.
        
        Args:
            user_id: The database ID of the user
            user_ratings: List of dictionaries containing title, year, and rating
            n_recommendations: Number of recommendations to return
            
        Returns:
            List of dictionaries containing movie details and predicted ratings
        """
        # Convert user ratings to MovieLens IDs
        rated_movies = []
        for rating in user_ratings:
            ml_movie_id = self.find_movie_id(rating['title'], rating['year'])
            if ml_movie_id is not None:
                rated_movies.append({
                    'movie_id': ml_movie_id,
                    'rating': rating['rating']
                })
        
        # Get all movie IDs
        all_movie_ids = self.movies_df['movieId'].unique()
        
        # Get IDs of movies the user has already rated
        rated_movie_ids = {r['movie_id'] for r in rated_movies}
        
        # Get unrated movies
        unrated_movie_ids = [mid for mid in all_movie_ids if mid not in rated_movie_ids]
        
        # Predict ratings for all unrated movies
        predictions = []
        for movie_id in unrated_movie_ids:
            predicted_rating = self.predict_rating(user_id, movie_id)
            movie_data = self.movies_df[self.movies_df['movieId'] == movie_id].iloc[0]
            
            predictions.append({
                'title': movie_data['title'],
                'year': int(movie_data['year']) if pd.notnull(movie_data['year']) else None,
                'predicted_rating': float(predicted_rating * 2)  # Convert back from 0.5-5 to 1-10 scale
            })
        
        # Sort by predicted rating and get top N
        recommendations = sorted(predictions, 
                               key=lambda x: x['predicted_rating'], 
                               reverse=True)[:n_recommendations]
        
        return recommendations

    def update_user_ratings(self, user_id: int, new_ratings: List[Dict[str, int]]) -> None:
        """
        Update the model with new user ratings.
        
        Args:
            user_id: The database ID of the user
            new_ratings: List of dictionaries containing movie_id and rating
        """
        # In the current version, the model is static
        # This is a placeholder for future implementation of online learning
        pass

# Command line interface
if __name__ == "__main__":
    import argparse
    import json
    
    parser = argparse.ArgumentParser(description='Get movie recommendations for a user')
    parser.add_argument('--user-id', type=int, required=True, help='Database ID of the user')
    parser.add_argument('--ratings', type=str, required=True, help='JSON string of user ratings with title and year')
    
    args = parser.parse_args()
    
    try:
        # Parse ratings from JSON string
        user_ratings = json.loads(args.ratings)
        
        # Initialize recommender
        recommender = MovieRecommender()
        
        # Get recommendations
        recommendations = recommender.get_recommendations(
            user_id=args.user_id,
            user_ratings=user_ratings
        )
        
        # Output as JSON
        print(json.dumps(recommendations))
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)
