import pandas as pd
from surprise import Dataset, Reader, SVD
from surprise.model_selection import GridSearchCV
import pickle
import os
import time
import gc
import random

def run_optimized_pipeline():
    print(f"[{time.strftime('%H:%M:%S')}] Script started.")

    # --- 1. Configuration ---
    DATA_PATH = "datasets/ml-latest/ratings.csv" 
    
    # Sampling settings to keep Grid Search fast
    SAMPLE_USERS = True
    NUM_USERS_TO_SAMPLE = 10000

    # --- 2. Data Loading (Optimized) ---
    print(f"[{time.strftime('%H:%M:%S')}] Loading data...")

    try:
        # Load essential columns only
        df = pd.read_csv(
            DATA_PATH,
            usecols=["userId", "movieId", "rating"],
            dtype={"userId": "int32", "movieId": "int32", "rating": "float32"}
        )
        print(f"[{time.strftime('%H:%M:%S')}] Data loaded. Total rows: {len(df)}")
        
        if SAMPLE_USERS:
            print(f"[{time.strftime('%H:%M:%S')}] Sampling {NUM_USERS_TO_SAMPLE} users for training speed...")
            unique_users = df['userId'].unique()
            if len(unique_users) > NUM_USERS_TO_SAMPLE:
                sampled_ids = random.sample(list(unique_users), NUM_USERS_TO_SAMPLE)
                df = df[df['userId'].isin(sampled_ids)]
                print(f"[{time.strftime('%H:%M:%S')}] Sampled dataset size: {len(df)} ratings.")
            else:
                print("Dataset is smaller than sample limit. Using all users.")

    except FileNotFoundError:
        print(f"Error: Could not find file at {DATA_PATH}")
        return

    # --- 3. Prepare for Surprise ---
    print(f"[{time.strftime('%H:%M:%S')}] Converting to Surprise Dataset...")
    reader = Reader(rating_scale=(0.5, 5))
    data = Dataset.load_from_df(df[["userId", "movieId", "rating"]], reader)
    
    # Clean up RAM
    del df
    gc.collect()

    # --- 4. Grid Search Configuration ---
    # This dictionary defines the "Grid" we will search over.
    # It will try every combination (2 x 2 x 2 x 2 = 16 combinations)
    param_grid = {
        'n_epochs': [40],      # LOCKED
        'lr_all': [0.01],      # LOCKED
        'reg_all': [0.05],     # LOCKED
        
        # THE EXPERIMENT: Testing heavier models
        'n_factors': [150, 200, 250, 300] 
    }
    print(f"[{time.strftime('%H:%M:%S')}] Starting Grid Search...")
    print("This will train multiple models to find the absolute best configuration.")
    
    # cv=3 means 3-fold cross-validation (faster than 5, good enough for tuning)
    gs = GridSearchCV(SVD, param_grid, measures=['rmse', 'mae'], cv=3, n_jobs=-1, joblib_verbose=10)
    
    gs.fit(data)

    # --- 5. Report Results ---
    print("-" * 50)
    print(f"[{time.strftime('%H:%M:%S')}] Grid Search Complete.")
    print(f"Best RMSE Score: {gs.best_score['rmse']:.4f}")
    print(f"Best Parameters: {gs.best_params['rmse']}")
    print("-" * 50)

    # --- 6. Final Training & Saving ---
    save_choice = input("Do you want to train the BEST model on the full dataset and save it? (y/n): ").lower()

    if save_choice == 'y':
        print(f"[{time.strftime('%H:%M:%S')}] Retraining best model on full data...")
        
        # Extract the best algorithm instance found by Grid Search
        best_algo = gs.best_estimator['rmse']
        
        # Build the full trainset (uses all data, no splitting)
        trainset = data.build_full_trainset()
        best_algo.fit(trainset)
        
        # Ensure directory exists
        if not os.path.exists("saved_models"):
            os.makedirs("saved_models")
            
        save_path = "saved_models/best_svd_model.pkl"
        print(f"[{time.strftime('%H:%M:%S')}] Saving model to {save_path}...")
        
        with open(save_path, "wb") as f:
            pickle.dump(best_algo, f)
            
        print(f"[{time.strftime('%H:%M:%S')}] Done! You can now load this pickle to make predictions.")
    else:
        print("Process finished without saving.")

if __name__ == "__main__":
    run_optimized_pipeline()
