import pandas as pd
import numpy as np
from surprise import Dataset, Reader, SVD
from surprise.model_selection import cross_validate
import pickle
import os
import time
import gc
import random

# --- THESIS CONFIGURATION ---
DATA_PATH = "datasets/ml-latest/ratings.csv"
SAVE_PATH = "saved_models/final_thesis_svd.pkl"

# Your "Goldilocks" Hyperparameters
BEST_EPOCHS = 40
BEST_LR = 0.01
BEST_REG = 0.05
BEST_FACTORS = 300

# High sample size for statistical significance
NUM_USERS_TO_SAMPLE = 200000 

def run_thesis_pipeline():
    print(f"[{time.strftime('%H:%M:%S')}] Script started.")

    # --- 1. Data Loading ---
    print(f"[{time.strftime('%H:%M:%S')}] Loading data...")
    try:
        df = pd.read_csv(
            DATA_PATH,
            usecols=["userId", "movieId", "rating"],
            dtype={"userId": "int32", "movieId": "int32", "rating": "float32"}
        )
    except FileNotFoundError:
        print("Error: File not found.")
        return

    # Sampling
    unique_users = df['userId'].unique()
    if len(unique_users) > NUM_USERS_TO_SAMPLE:
        print(f"[{time.strftime('%H:%M:%S')}] Sampling {NUM_USERS_TO_SAMPLE} users...")
        sampled_ids = random.sample(list(unique_users), NUM_USERS_TO_SAMPLE)
        df = df[df['userId'].isin(sampled_ids)]
    
    print(f"[{time.strftime('%H:%M:%S')}] Data ready. Rows: {len(df)}")

    # Surprise Conversion
    reader = Reader(rating_scale=(0.5, 5))
    data = Dataset.load_from_df(df[["userId", "movieId", "rating"]], reader)
    del df
    gc.collect()

    # --- 2. Model Initialization ---
    print(f"[{time.strftime('%H:%M:%S')}] Initializing SVD (Factors={BEST_FACTORS})...")
    model = SVD(
        n_epochs=BEST_EPOCHS, 
        lr_all=BEST_LR, 
        reg_all=BEST_REG, 
        n_factors=BEST_FACTORS, 
        verbose=False # Keep it clean for the report
    )

    # --- 3. THESIS VALIDATION STEP ---
    print(f"[{time.strftime('%H:%M:%S')}] Starting 5-Fold Cross Validation (Generating Metrics)...")
    
    # We add MSE (Mean Squared Error) which is often requested in papers
    cv_results = cross_validate(model, data, measures=['RMSE', 'MAE', 'MSE'], cv=5, verbose=True)

    # --- 4. GENERATE THESIS REPORT ---
    print("\n" + "="*60)
    print("FINAL THESIS PERFORMANCE REPORT")
    print("="*60)
    
    rmse_mean = cv_results['test_rmse'].mean()
    rmse_std = cv_results['test_rmse'].std()
    mae_mean = cv_results['test_mae'].mean()
    mae_std = cv_results['test_mae'].std()
    mse_mean = cv_results['test_mse'].mean()
    mse_std = cv_results['test_mse'].std()
    fit_time = np.mean(cv_results['fit_time'])
    
    print(f"Algorithm:        SVD")
    print(f"Hyperparameters:  Factors={BEST_FACTORS}, Epochs={BEST_EPOCHS}, LR={BEST_LR}, Reg={BEST_REG}")
    print(f"User Sample Size: {NUM_USERS_TO_SAMPLE}")
    print("-" * 60)
    print(f"{'Metric':<10} | {'Mean':<10} | {'Std Dev':<10}")
    print("-" * 60)
    print(f"{'RMSE':<10} | {rmse_mean:<10.4f} | {rmse_std:<10.4f}")
    print(f"{'MAE':<10} | {mae_mean:<10.4f} | {mae_std:<10.4f}")
    print(f"{'MSE':<10} | {mse_mean:<10.4f} | {mse_std:<10.4f}")
    print("-" * 60)
    print(f"Avg Fit Time:     {fit_time:.2f} seconds per fold")
    print("="*60 + "\n")

    # --- 5. Final Training & Save ---
    save_choice = input("Do you want to save the model trained on the FULL dataset? (y/n): ").lower()
    
    if save_choice == 'y':
        print(f"[{time.strftime('%H:%M:%S')}] Retraining on full dataset...")
        trainset = data.build_full_trainset()
        model.fit(trainset)
        
        if not os.path.exists("saved_models"):
            os.makedirs("saved_models")
            
        with open(SAVE_PATH, "wb") as f:
            pickle.dump(model, f)
        print(f"[{time.strftime('%H:%M:%S')}] Model saved to {SAVE_PATH}")

if __name__ == "__main__":
    run_thesis_pipeline()
