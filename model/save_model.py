import pandas as pd
import numpy as np
from surprise import Dataset, Reader, SVD
from surprise.model_selection import train_test_split
import pickle
import os

# Load the data
ratings = pd.read_csv('ml-latest-small/ratings.csv')
reader = Reader(rating_scale=(0.5, 5.0))
data = Dataset.load_from_df(ratings[['userId', 'movieId', 'rating']], reader)

# Split into training and test sets
trainset = data.build_full_trainset()

# Train a basic SVD model
model = SVD(n_factors=100, n_epochs=20, lr_all=0.005, reg_all=0.02)
model.fit(trainset)

# Create directory if it doesn't exist
if not os.path.exists('saved_models'):
    os.makedirs('saved_models')

# Save the trained model
with open('saved_models/svd_model.pkl', 'wb') as f:
    pickle.dump(model, f)

print("Model saved successfully!")