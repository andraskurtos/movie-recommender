import pandas as pd
from surprise import Dataset, Reader, SVDpp, accuracy
from surprise.model_selection import GridSearchCV
import pickle
import os
import time
import gc
import random

print(f"[{time.strftime('%H:%M:%S')}] Script started.")

# --- Data Loading and Sampling ---
print(f"[{time.strftime('%H:%M:%S')}] Starting data loading and sampling...")

# Get all unique user IDs
print(f"[{time.strftime('%H:%M:%S')}] Step 1/3: Getting unique user IDs...")
chunk_size = 1000000
unique_user_ids = set()
for chunk in pd.read_csv(
    "ml-latest/ratings.csv",
    usecols=["userId"],
    dtype={"userId": "int32"},
    chunksize=chunk_size,
):
    unique_user_ids.update(chunk["userId"].unique())
print(f"[{time.strftime('%H:%M:%S')}] Found {len(unique_user_ids)} unique users.")

# Sample a subset of user IDs
num_users_to_sample = 50000  # Calculated to get ~2 million ratings
print(
    f"[{time.strftime('%H:%M:%S')}] Step 2/3: Sampling {num_users_to_sample} random users..."
)
sampled_user_ids = set(random.sample(list(unique_user_ids), num_users_to_sample))
del unique_user_ids
gc.collect()
print(f"[{time.strftime('%H:%M:%S')}] Finished sampling users.")

# Load ratings for the sampled users
print(f"[{time.strftime('%H:%M:%S')}] Step 3/3: Loading ratings for sampled users...")
ratings_chunks = []
for chunk in pd.read_csv(
    "ml-latest/ratings.csv",
    usecols=["userId", "movieId", "rating"],
    dtype={"userId": "int32", "movieId": "int32", "rating": "float32"},
    chunksize=chunk_size,
):
    ratings_chunks.append(chunk[chunk["userId"].isin(sampled_user_ids)])
ratings = pd.concat(ratings_chunks, ignore_index=True)
del ratings_chunks
del sampled_user_ids
gc.collect()
print(
    f"[{time.strftime('%H:%M:%S')}] Finished loading CSV. {len(ratings)} ratings loaded."
)

print(
    f"[{time.strftime('%H:%M:%S')}] Preparing data for Surprise library... (This may take a while)"
)
reader = Reader(rating_scale=(0.5, 5))
data = Dataset.load_from_df(ratings[["userId", "movieId", "rating"]], reader)
print(f"[{time.strftime('%H:%M:%S')}] Data prepared.")

# Define parameter grid for GridSearchCV
# You can change these values to compare different models
param_grid = {
    "n_epochs": [60, 80, 100],
    "lr_all": [0.01, 0.015, 0.02],
    "reg_all": [0.02, 0.05, 0.1],
    "n_factors": [100, 150, 200],
}
# Initialize GridSearchCV
print(f"[{time.strftime('%H:%M:%S')}] Initializing GridSearchCV...")
gs = GridSearchCV(SVDpp, param_grid, measures=["rmse", "mae"], cv=3, n_jobs=1)

# Fit the grid search to the data
print(
    f"[{time.strftime('%H:%M:%S')}] Running GridSearchCV... (This will take a long time)"
)
gs.fit(data)
print(f"[{time.strftime('%H:%M:%S')}] GridSearchCV finished.")

# Print best score and parameters
print(f"[{time.strftime('%H:%M:%S')}] Best RMSE score: {gs.best_score['rmse']}")
print(f"[{time.strftime('%H:%M:%S')}] Best parameters: {gs.best_params['rmse']}")

# Get the best model
best_params = gs.best_params["rmse"]
print(
    f"[{time.strftime('%H:%M:%S')}] Initializing SVDpp model with best parameters: {best_params}"
)
model = SVDpp(
    n_epochs=best_params["n_epochs"],
    lr_all=best_params["lr_all"],
    reg_all=best_params["reg_all"],
)

# Train the best model on the full training set
print(f"[{time.strftime('%H:%M:%S')}] Training best model on the full dataset...")
trainset = data.build_full_trainset()
model.fit(trainset)
print(f"[{time.strftime('%H:%M:%S')}] Model training finished.")

# Free up memory
del trainset
del gs
del data
gc.collect()

# Ask user if they want to save the model
save_model_choice = input(
    f"[{time.strftime('%H:%M:%S')}] Do you want to save the trained model? (y/n): "
).lower()

if save_model_choice == "y":
    # Create directory if it doesn't exist
    if not os.path.exists("saved_models"):
        os.makedirs("saved_models")

    # Save the trained model
    print(
        f"[{time.strftime('%H:%M:%S')}] Saving model to saved_models/svd_model.pkl..."
    )
    with open("saved_models/svd_model.pkl", "wb") as f:
        pickle.dump(model, f)

    print(f"[{time.strftime('%H:%M:%S')}] Model saved successfully!")
else:
    print(f"[{time.strftime('%H:%M:%S')}] Model not saved as per user's choice.")
