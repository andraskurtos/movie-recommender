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

    def get_recommendations(self,
                          user_id: int,
                          user_ratings: List[Dict[str, any]],
                          n_recommendations: int = 50) -> List[Dict]:
        """
        Generate movie recommendations for a user based on their ratings.
        This method computes a user factor vector for the new user based on their ratings
        and then uses it to predict ratings for other movies.
        """

        # 1. Process user ratings
        rated_movies = []
        rated_movie_ids = set()
        for rating in user_ratings:
            ml_movie_id = self.find_movie_id(rating['title'], rating['year'])
            if ml_movie_id is not None:
                # Scale rating to the model's scale (e.g., 0.5-5 if original is 1-10)
                scaled_rating = float(rating['rating']) / 2
                rated_movies.append({'movie_id': ml_movie_id, 'rating': scaled_rating})
                rated_movie_ids.add(ml_movie_id)

        if not rated_movies:
            return []

        # 2. Prepare for solving for the new user's factor vector
        global_mean = self.model.trainset.global_mean
        item_factors = self.model.qi
        item_biases = self.model.bi

        Q = []
        y = []

        for rated in rated_movies:
            try:
                inner_iid = self.model.trainset.to_inner_iid(rated['movie_id'])
                q_i = item_factors[inner_iid]
                b_i = item_biases[inner_iid]

                Q.append(q_i)
                y.append(rated['rating'] - global_mean - b_i)
            except ValueError:
                continue

        if not Q:
            return []

        Q = np.array(Q)
        y = np.array(y)

        # 3. Solve for the user factor vector p_u using Ridge Regression
        n_factors = self.model.n_factors
        lambda_ = self.model.reg_pu

        A = Q.T @ Q + lambda_ * np.identity(n_factors)
        b = Q.T @ y
        p_u = np.linalg.solve(A, b)

        # 4. Predict ratings for all unrated movies
        all_movie_ids = set(self.movies_df['movieId'].unique())
        unrated_movie_ids = all_movie_ids - rated_movie_ids

        predictions = {}
        rating_scale = self.model.trainset.rating_scale

        for movie_id in unrated_movie_ids:
            try:
                inner_iid = self.model.trainset.to_inner_iid(movie_id)
                q_j = item_factors[inner_iid]
                b_j = item_biases[inner_iid]

                predicted_rating = global_mean + b_j + np.dot(p_u, q_j)

                if rating_scale is not None:
                    predicted_rating = np.clip(predicted_rating, rating_scale[0], rating_scale[1])

                predictions[movie_id] = predicted_rating
            except ValueError:
                continue

        # 5. Build recommendations list
        sorted_recs = sorted(predictions.items(), key=lambda x: x[1], reverse=True)

        recs = []
        for movie_id, est in sorted_recs[:n_recommendations]:
            movie_data = self.movies_df[self.movies_df['movieId'] == movie_id].iloc[0]
            recs.append({
                'title': movie_data['title'],
                'year': int(movie_data['year']) if pd.notnull(movie_data['year']) else None,
                'predicted_rating': float(est * 2)  # scale back to 1-10 for the backend
            })

        return recs

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
