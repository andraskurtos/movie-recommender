import { useEffect, useState } from "react";
import SearchMovieCard from "./SearchMovieCard";

interface SearchDropdownProps {
    isVisible: boolean;
    searchQuery: string;
}

const SearchDropdown = ({ isVisible, searchQuery }: SearchDropdownProps) => {

    const [movies, setMovies] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(true);
    const API_URL = import.meta.env.VITE_API_URL;
    const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

    interface Movie {
        id: number;
        title: string;
        year: number;
        posterUrl: string;
        isTmdb: boolean;
    }

    useEffect(() => {
        const fetchMovies = async () => {
            if (!searchQuery.trim()) {
                setMovies([]);
                setLoading(false);
                return;
            }
            
            setLoading(true);

            try {
                // get local results immediately (no debounce for local API for faster feedback)
                const baseUrl = API_URL || 'http://localhost:5253';
                let dataLocal: Movie[] = [];
                
                try {
                    const responseLocal = await fetch(`${baseUrl}/api/Movies/search?query=${encodeURIComponent(searchQuery)}`);
                    if (responseLocal.ok) {
                        dataLocal = await responseLocal.json();
                        // update with local results first
                        const localMovies = dataLocal.map(movie => ({
                            ...movie,
                            isTmdb: false
                        }));
                        setMovies(localMovies);
                        setLoading(false);
                    }
                } catch (localError) {
                    console.error("Error fetching from local API:", localError);
                }
                
                // only fetch from remote API if we have an API key
                if (API_KEY) {
                    try {
                        const responseRemote = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(searchQuery)}`);
                        if (responseRemote.ok) {
                            const dataRemote = await responseRemote.json();
                            
                            // map remote results to the expected format
                            const remoteMovies = dataRemote.results.map((movie: { 
                                id: number; 
                                original_title?: string; 
                                title?: string;
                                release_date?: string; 
                                poster_path?: string; 
                            }) => ({
                                id: movie.id,
                                title: movie.original_title || movie.title || "Unknown Title",
                                year: movie.release_date ? parseInt(movie.release_date.split('-')[0]) : 0,
                                posterUrl: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 'https://via.placeholder.com/150x225?text=No+Image',
                                isTmdb: true
                            }));
                            
                            // Merge and deduplicate results
                            const combined = [...dataLocal, ...remoteMovies];
                            const uniqueMovies = Array.from(
                                new Map(combined.map(item => [
                                    `${item.title}-${item.year}-${item.posterUrl.slice(-20)}`, 
                                    item
                                ])).values()
                            );
                            
                            setMovies(uniqueMovies);
                        }
                    } catch (remoteError) {
                        console.error("Error fetching from TMDB API:", remoteError);
                    } finally {
                        setLoading(false);
                    }
                }
            } catch (error) {
                console.error("Error fetching movie:", error);
                setLoading(false);
            }
        };
        
        // only immediate fetch for local API if there's a query
        if (searchQuery.trim()) {
            fetchMovies();
        } else {
            setMovies([]);
            setLoading(false);
        }
    }, [API_URL, API_KEY, searchQuery]);
    
    // separate effect with debounce for remote API
    useEffect(() => {
        if (!searchQuery.trim() || !API_KEY) return;
        
        // use a debounce for remote API calls to reduce load
        const timerId = setTimeout(async () => {
            try {
                // fetch from remote TMDB API
                const responseRemote = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(searchQuery)}`);
                if (responseRemote.ok) {
                    const dataRemote = await responseRemote.json();
                    
                    // map remote results to our format
                    const remoteMovies = dataRemote.results.map((movie: { 
                        id: number; 
                        original_title?: string; 
                        title?: string;
                        release_date?: string; 
                        poster_path?: string; 
                    }) => ({
                        id: movie.id,
                        title: movie.original_title || movie.title || "Unknown Title",
                        year: movie.release_date ? parseInt(movie.release_date.split('-')[0]) : 0,
                        posterUrl: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 'https://via.placeholder.com/150x225?text=No+Image',
                        isTmdb: true
                    }));
                    
                    // update state with new movies
                    setMovies(prev => {
                        // merge local and remote results
                        const combined = [...prev, ...remoteMovies];
                        // deduplicate based on title, year and poster
                        return Array.from(
                            new Map(combined.map(item => [
                                `${item.title}-${item.year}-${item.posterUrl.slice(-20)}`, 
                                item
                            ])).values()
                        );
                    });
                }
            } catch (error) {
                console.error("Error in debounced remote API fetch:", error);
            }
        }, 500);
        
        return () => clearTimeout(timerId);
    }, [API_KEY, searchQuery]);

    return (
        <div className={`absolute top-full left-0 right-0 mt-1 bg-white rounded-md shadow-lg max-h-96 overflow-y-auto z-50 transition-all duration-200 ${
            isVisible 
                ? 'opacity-100 translate-y-0 pointer-events-auto' 
                : 'opacity-0 -translate-y-2 pointer-events-none'
        }`}>
            <div className="py-2">
                {loading ? (
                    <div className="px-4 py-6 flex items-center justify-center min-h-[80px]">
                        <div className="flex flex-col items-center">
                            <div className="animate-pulse flex space-x-4 w-full">
                                <div className="rounded-md bg-gray-200 h-24 w-16"></div>
                                <div className="flex-1 space-y-4 py-1">
                                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                </div>
                            </div>
                            <div className="mt-2 text-gray-500">Searching...</div>
                        </div>
                    </div>
                ) : movies.length > 0 ? (
                    movies.map((movie: { id: number; title: string; year: number; posterUrl: string; isTmdb: boolean }, index: number) => (
                        <SearchMovieCard 
                            key={index} 
                            movie={movie} 
                        />
                    ))
                ) : (
                    <div className="px-4 py-6 text-gray-500 min-h-[80px] flex items-center justify-center">No results found</div>
                )}
            </div>
        </div>
    );
};

export default SearchDropdown;
