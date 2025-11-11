import { useEffect, useState, useRef, useCallback } from "react";
import MovieCard from "../components/MovieCard";
import { movieService } from "../services/MovieService";

interface Movie {
    id: number;
    posterUrl: string;
    title: string;
    year: number;
}

interface Recommendation {
    movie: Movie;
    predictedRating: number;
}

function DiscoveryPage() {
    const [movies, setMovies] = useState<Movie[]>([]);
    const [suggestions, setSuggestions] = useState<Recommendation[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [suggestionsLoading, setSuggestionsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [activeTab, setActiveTab] = useState<'all' | 'suggestions'>('all');
    const containerRef = useRef<HTMLDivElement>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);
    const API_URL = import.meta.env.VITE_API_URL;

    const loadMovies = useCallback(async (page: number) => {
        try {
            const data = await movieService.getPaginatedMovies(page, 100);
            
            if (page === 1) {
                setMovies(data.data);
            } else {
                setMovies(prev => [...prev, ...data.data]);
            }
            
            setCurrentPage(page);
            setHasMore(data.hasNextPage);
            setLoading(false);
            setLoadingMore(false);
        } catch (error) {
            console.error("Error fetching movies:", error);
            setLoading(false);
            setLoadingMore(false);
        }
    }, []);

    const loadSuggestions = useCallback(async () => {
        try {
            setSuggestionsLoading(true);
            // Get the current user ID from localStorage or auth context
            const userId = localStorage.getItem('userId') || '1'; // Default to user 1 for now
            
            const response = await fetch(`${API_URL}/api/Recommendations/${userId}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch recommendations: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Recommendations received:', data);
            setSuggestions(data);
        } catch (error) {
            console.error("Error fetching suggestions:", error);
        } finally {
            setSuggestionsLoading(false);
        }
    }, [API_URL]);

    // Initial load
    useEffect(() => {
        loadMovies(1);
    }, [loadMovies]);

    // Load suggestions when tab changes to suggestions
    useEffect(() => {
        if (activeTab === 'suggestions' && suggestions.length === 0 && !suggestionsLoading) {
            loadSuggestions();
        }
    }, [activeTab, suggestions.length, suggestionsLoading, loadSuggestions]);

    // Infinite scroll observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
                    setLoadingMore(true);
                    loadMovies(currentPage + 1);
                }
            },
            { threshold: 0.1 }
        );

        const sentinel = sentinelRef.current;
        if (sentinel) {
            observer.observe(sentinel);
        }

        return () => {
            if (sentinel) {
                observer.unobserve(sentinel);
            }
        };
    }, [hasMore, loadingMore, loading, currentPage, loadMovies]);

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
        return (
            <div className="DiscoveryPage min-h-screen bg-gray-900 pt-6">
                <div className="sectionBar w-full flex justify-center items-center">
                    <button className="text-2xl font-bold underline text-white mr-2">
                        All Movies
                    </button>
                    <p className="text-2xl text-gray-500">|</p>
                    <button className="text-2xl text-gray-400 ml-2">Suggestions</button>
                </div>
                <div className="flex flex-wrap flex-row justify-center gap-6 p-6">
                    {[...Array(24)].map((_, i) => (
                        <SkeletonMovieCard key={i} />
                    ))}
                </div>
            </div>
        );
    }

    return (
      <div className="DiscoveryPage min-h-screen bg-gray-900 pt-6" ref={containerRef}>
        <div className="sectionBar w-full flex justify-center items-center">
          <button 
            onClick={() => setActiveTab('all')}
            className={`text-2xl font-bold mr-2 ${activeTab === 'all' ? 'underline text-white' : 'text-gray-400 hover:text-white'}`}
          >
            All Movies
          </button>
          <p className="text-2xl text-gray-500">|</p>
          <button 
            onClick={() => setActiveTab('suggestions')}
            className={`text-2xl ml-2 ${activeTab === 'suggestions' ? 'underline text-white font-bold' : 'text-gray-400 hover:text-white'}`}
          >
            Suggestions
          </button>
        </div>

        {activeTab === 'all' && (
          <div className="flex flex-wrap flex-row justify-center gap-6 p-6">
              {
                  movies.map((movie: Movie) => (
                      <MovieCard key={movie.id} movie={movie} />
                  ))
              }
          </div>
        )}

        {activeTab === 'suggestions' && (
          <div className="flex items-center justify-center min-h-[60vh]">
            {suggestionsLoading ? (
              <div className="flex flex-wrap flex-row justify-center gap-6 p-6 w-full">
                {[...Array(24)].map((_, i) => (
                    <SkeletonMovieCard key={i} />
                ))}
              </div>
            ) : suggestions.length > 0 ? (
              <div className="flex flex-wrap flex-row justify-center gap-6 p-6 w-full">
                {suggestions.map((rec: Recommendation) => (
                  <div key={rec.movie.id} className="relative">
                    <MovieCard movie={rec.movie} />
                    <div className="absolute top-2 right-2 bg-yellow-500 text-black px-2 py-1 rounded text-sm font-bold">
                      {(rec.predictedRating).toFixed(0)}/10
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center">
                <p className="text-gray-400 text-xl mb-4">No recommendations available</p>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'all' && (
          <div ref={sentinelRef} className="flex justify-center py-8">
              {loadingMore && <div className="text-white">Loading more movies...</div>}
              {!hasMore && movies.length > 0 && <div className="text-gray-500">No more movies to load</div>}
          </div>
        )}
      </div>
    );
}
export default DiscoveryPage;   