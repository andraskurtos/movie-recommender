import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MovieCard from "../components/MovieCard";
import { useUser } from "../hooks/useUser";

interface Movie {
    id: number;
    posterUrl: string;
    title: string;
    year: number;
    overview: string;
    originalLanguage: string;
    backdropUrl: string;
}

interface UserRating {
    id: number;
    movie: {
        id: number;
        title: string;
        year: number;
        posterUrl: string;
    };
    rating: number;
    reviewText?: string;
    createdAt?: string;
}

const MoviePage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useUser();
    const [movie, setMovie] = useState<Movie | null>(null);
    const [loading, setLoading] = useState(true);
    const [userRating, setUserRating] = useState<UserRating | null>(null);
    const [ratingInput, setRatingInput] = useState<number>(5);
    const [showRatingForm, setShowRatingForm] = useState(false);
    const [submittingRating, setSubmittingRating] = useState(false);
    const API_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        const fetchMovie = async () => {
            try {
                const response = await fetch(`${API_URL}/api/Movies/${id}`);
                const data = await response.json();
                setMovie(data);
                
                // Fetch user rating for this movie
                if (user && user.id && data.id) {
                    try {
                        const ratingResponse = await fetch(`${API_URL}/api/User/${user.id}/ratings`);
                        const ratings = await ratingResponse.json();
                        const movieRating = ratings.find((r: UserRating) => r.movie.id === data.id);
                        if (movieRating) {
                            setUserRating(movieRating);
                        }
                    } catch (error) {
                        console.error("Error fetching user ratings:", error);
                    }
                }
            } catch (error) {
                console.error("Error fetching movie:", error);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchMovie();
        }
    }, [id, API_URL, user]);

    const handleSubmitRating = async () => {
        if (!movie || !ratingInput) return;
        
        try {
            setSubmittingRating(true);

            const url = `${API_URL}/api/User/${user.id}/ratings`;
            console.log("Submitting rating to:", url);
            console.log("Rating data:", { movieId: movie.id, rating: ratingInput, review: '' });

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    movieId: movie.id,
                    rating: ratingInput,
                    review: ''
                })
            });

            console.log("Response status:", response.status);
            const text = await response.text();
            console.log("Response text:", text);

            if (!response.ok) {
                throw new Error(`Failed to submit rating: ${response.status} - ${text}`);
            }

            const newRating = JSON.parse(text);
            console.log("Rating submitted successfully:", newRating);
            setUserRating(newRating);
            setShowRatingForm(false);
        } catch (error) {
            console.error("Error submitting rating:", error);
            alert("Failed to submit rating: " + error);
        } finally {
            setSubmittingRating(false);
        }
    };

    if (loading) {
        return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white"></div>;
    }

    if (!movie) {
        return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Movie not found</div>;
    }

    return (
      <div className="MoviePage relative h-max flex flex-col bg-gray-900" style={{backgroundImage: `url(https://media.themoviedb.org/t/p/original/${movie.backdropUrl})`, backgroundAttachment: 'fixed', backgroundSize: 'cover', backgroundPosition: 'center'}}>
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black bg-opacity-60 pointer-events-none"></div>
        
        <div className="MovieData relative z-10 flex flex-row text-white w-full h-[18rem] px-6 pt-6">
          <img
            className="w-[12rem] h-[18rem] object-cover rounded-lg ml-6 shadow-lg"
            src={`https://media.themoviedb.org/t/p/w600_and_h900_bestv2/${movie.posterUrl}`}
            alt="Movie Poster"
          />
          <div className="MovieInfo flex flex-col ml-6 mr-6 bg-gray-900 bg-opacity-40 p-4 rounded-lg backdrop-blur-sm">
            <h2 className="text-2xl font-bold">{movie.title}</h2>
            <h3 className="text-lg text-gray-300">{movie.year}</h3>
            <p className="text-gray-100 h-max w-[40rem] overflow-scroll scrollbar-none text-sm leading-relaxed">{movie.overview}</p>
          </div>
          <div className="MovieDetails flex flex-col ml-6 mr-6 bg-gray-900 bg-opacity-40 p-4 rounded-lg backdrop-blur-sm">
            <h2 className="text-2xl font-bold">Details</h2>
            <h3 className="text-lg w-full text-gray-100">Director: John Doe</h3>
            <h3 className="text-lg w-full text-gray-100">Genre: Action, Sci-Fi</h3>
            <h3 className="text-lg w-full text-gray-100">Duration: 2h 15m</h3>
            <h3 className="text-lg w-full text-gray-100">Language: {movie.originalLanguage}</h3>
          </div>
          <div className="MovieRatings flex flex-col ml-6 mr-6 bg-gray-900 bg-opacity-40 p-4 rounded-lg backdrop-blur-sm">
            <h2 className="text-2xl font-bold">Ratings</h2>
            <h3 className="text-lg w-full text-gray-100">IMDb: 8.5/10</h3>
            <h3 className="text-lg w-full text-gray-100">Rotten Tomatoes: 95%</h3>
            <h2 className="text-2xl font-bold mt-6">Your Rating</h2>
            {userRating ? (
              <div>
                <h3 className="text-lg w-full text-gray-100">Rating: {userRating.rating}/10</h3>
                <h3 className="text-lg w-full text-gray-100">Rated on: {new Date(userRating.createdAt || '').toLocaleDateString()}</h3>
              </div>
            ) : showRatingForm ? (
              <div className="flex flex-col gap-3">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={ratingInput}
                  onChange={(e) => setRatingInput(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="text-lg text-gray-100">Rating: {ratingInput}/10</div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSubmitRating}
                    disabled={submittingRating}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 text-white px-3 py-1 rounded text-sm"
                  >
                    {submittingRating ? 'Submitting...' : 'Submit'}
                  </button>
                  <button
                    onClick={() => setShowRatingForm(false)}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : user ? (
              <button
                onClick={() => setShowRatingForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold w-max mt-2"
              >
                Add Rating
              </button>
            ) : (
              <div className="flex flex-col gap-3 mt-2">
                <p className="text-gray-100">Log in to rate movies</p>
                <button
                  onClick={() => navigate('/login')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold w-max"
                >
                  Go to Login
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="MovieRecommendations relative z-10 flex flex-col mt-2 ml-6 mr-6 h-1/3">
            <div className="sectionBar w-full flex-row flex p-4 justify-start gap-6">
                <button className="text-2xl font-bold text-white">Recommended Movies</button>
                <button className="text-2xl font-bold text-white">Movie Cast</button>
            </div>
            <div className="flex shrink-0 flex-row justify-top overflow-y-hidden overflow-x-scroll scrollbar-none gap-4 bg-gradient-to-r from-black via-transparent to-transparent bg-opacity-50 h-1/3 w-full rounded-lg p-4">
                <MovieCard movie={{posterUrl: "https://media.themoviedb.org/t/p/w600_and_h900_bestv2/cm8TNGBGG0aBfWj0LgrESHv8tir.jpg", title: "The Fantastic 4: First Steps", year: 2025}} />
            </div>
        </div>
      </div>
    );
};

export default MoviePage;