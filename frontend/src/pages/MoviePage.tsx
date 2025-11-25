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
    runtime: number;
}

interface Recommendation {
    movie: Movie;
    predictedRating: number;
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
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [recommendationsLoading, setRecommendationsLoading] = useState(true);
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

        const loadRecommendations = async () => {
            if (!user) {
                setRecommendationsLoading(false);
                return;
            }
    
            try {
                setRecommendationsLoading(true);
                
                const response = await fetch(`${API_URL}/api/Recommendations/${user.id}`);
                if (!response.ok) {
                    throw new Error(`Failed to fetch recommendations: ${response.status}`);
                }
                
                const data = await response.json();
                console.log('Recommendations received:', data);
                setRecommendations(data);
            } catch (error) {
                console.error("Error fetching recommendations:", error);
            } finally {
                setRecommendationsLoading(false);
            }
        };

        if (id) {
            fetchMovie();
            loadRecommendations();
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
        } catch (error)
        {
            console.error("Error submitting rating:", error);
            alert("Failed to submit rating: " + error);
        } finally {
            setSubmittingRating(false);
        }
    };

    const formatRuntime = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}h ${remainingMinutes}m`;
    };

    // Skeleton Loader Component
    const SkeletonMovieCard = () => (
        <div className="MovieCard max-w-[16rem] max-h-[27rem] bg-gray-700 bg-opacity-50 rounded-xl overflow-hidden shadow-lg p-4 shrink-0 flex flex-col items-center animate-pulse group">
            <div className="w-[220px] h-[330px] bg-gray-600 rounded-lg object-cover"></div>
            <div className="w-full overflow-hidden mt-3">
                <div className="w-full h-6 bg-gray-600 rounded mb-2"></div>
            </div>
            <div className="h-6 bg-gray-600 rounded w-12"></div>
        </div>
    );

    if (loading) {
        return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white"></div>;
    }

    if (!movie) {
        return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Movie not found</div>;
    }
    
    return (
      <div className="MoviePage relative min-h-screen bg-gray-900" style={{backgroundImage: `url(https://media.themoviedb.org/t/p/original/${movie.backdropUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed'}}>
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black bg-opacity-70 pointer-events-none"></div>
        
        <div className="relative z-10 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          {/* --- MOVIE DATA SECTION --- */}
          <div className="MovieData flex flex-col md:flex-row md:items-start gap-6 mb-8">
            <img
              className="w-48 md:w-60 lg:w-72 h-auto object-cover rounded-lg mx-auto md:mx-0 shadow-lg flex-shrink-0"
              src={`https://media.themoviedb.org/t/p/w600_and_h900_bestv2/${movie.posterUrl}`}
              alt="Movie Poster"
            />
            <div className="flex flex-col gap-6 flex-grow">
              {/* Movie Info, Details, and Ratings now stack on mobile */}
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="MovieInfo flex-grow bg-gray-900 bg-opacity-50 p-4 rounded-lg backdrop-blur-sm text-white">
                    <h2 className="text-3xl md:text-4xl font-bold">{movie.title}</h2>
                    <h3 className="text-xl text-gray-300 mb-4">{movie.year}</h3>
                    <p className="text-gray-200 text-base leading-relaxed overflow-y-auto max-h-48 md:max-h-full scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">{movie.overview}</p>
                </div>
                <div className="flex flex-col sm:flex-row lg:flex-col gap-6 flex-shrink-0">
                  <div className="MovieDetails bg-gray-900 bg-opacity-50 p-4 rounded-lg backdrop-blur-sm text-white">
                      <h2 className="text-2xl font-bold mb-2">Details</h2>
                      <h3 className="text-lg w-full text-gray-200">Duration: {formatRuntime(movie.runtime)}</h3>
                      <h3 className="text-lg w-full text-gray-200">Language: {movie.originalLanguage.toUpperCase()}</h3>
                  </div>
                  <div className="MovieRatings flex-grow bg-gray-900 bg-opacity-50 p-4 rounded-lg backdrop-blur-sm text-white">
                      <h2 className="text-2xl font-bold mb-2">Your Rating</h2>
                      {/* --- RATING LOGIC --- */}
                      {userRating ? (
                        <div>
                          <h3 className="text-2xl font-bold text-yellow-400">{userRating.rating}/10</h3>
                          <p className="text-xs text-gray-400">Rated on: {new Date(userRating.createdAt || '').toLocaleDateString()}</p>
                        </div>
                      ) : showRatingForm ? (
                        <div className="flex flex-col gap-3">
                          <input
                            type="range" min="1" max="10"
                            value={ratingInput}
                            onChange={(e) => setRatingInput(parseInt(e.target.value))}
                            className="w-full"
                          />
                          <div className="text-lg text-gray-100">{ratingInput}/10</div>
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
              </div>
            </div>
          </div>
          
          {/* --- RECOMMENDATIONS SECTION --- */}
          <div className="MovieRecommendations relative z-10 mt-8">
              <div className="sectionBar flex justify-between items-center p-4">
                  <h2 className="text-2xl font-bold text-white">Recommended Movies</h2>
                  {/* Optional: Add cast button back if needed */}
                  {/* <button className="text-xl font-bold text-white">Movie Cast</button> */}
              </div>
              {/* Grid for mobile, horizontal scroll for larger screens */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:flex lg:overflow-x-auto lg:scrollbar-none gap-4 lg:gap-6 lg:p-4 rounded-lg">
                  {recommendationsLoading ? (
                      [...Array(10)].map((_, i) => (
                          <div key={i} className="flex-shrink-0 lg:w-56">
                              <SkeletonMovieCard />
                          </div>
                      ))
                  ) : recommendations.length > 0 ? (
                      recommendations
                          .filter(rec => rec.movie.id !== movie.id)
                          .map((rec: Recommendation) => (
                              <div key={rec.movie.id} className="relative flex-shrink-0 lg:w-56">
                                  <MovieCard movie={rec.movie} />
                                  <div className="absolute top-2 right-2 bg-yellow-500 text-black px-2 py-1 rounded text-sm font-bold">
                                      {(rec.predictedRating).toFixed(0)}/10
                                  </div>
                              </div>
                          ))
                  ) : (
                      <div className="text-white col-span-full">No recommendations available.</div>
                  )}
              </div>
          </div>
        </div>
      </div>
    );
};

export default MoviePage;
