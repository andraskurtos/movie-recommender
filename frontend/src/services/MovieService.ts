// Define interfaces for movie data
export interface MoviePayload {
    title: string;
    overview: string;
    year: number;
    posterUrl: string;
    backdropUrl: string;
    originalLanguage: string;
    genres: number[];
}

export interface TmdbMovieResult {
    id: number;
    title?: string;
    original_title?: string;
    overview?: string;
    release_date?: string;
    poster_path?: string;
    backdrop_path?: string;
    original_language?: string;
    genre_ids?: number[];
    results?: TmdbMovieResult[];
}

export interface Movie {
    id: number;
    title: string;
    year: number;
    overview?: string;
    posterUrl: string;
    backdropUrl?: string;
    originalLanguage?: string;
}

class MovieService {
    private apiUrl: string;
    private tmdbApiKey: string;

    constructor() {
        this.apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5253';
        this.tmdbApiKey = import.meta.env.VITE_TMDB_API_KEY || '';
    }

    /**
     * Search for a movie in the local database
     */
    async searchLocalMovies(query: string): Promise<Movie[]> {
        if (!query.trim()) return [];

        try {
            const url = `${this.apiUrl}/api/Movies/search?query=${encodeURIComponent(query)}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                console.error('Local search failed with status:', response.status);
                return [];
            }
            
            const data = await response.json();
            console.log('Local search results:', data);
            return data;
        } catch (error) {
            console.error('Error searching local movies:', error);
            return [];
        }
    }

    /**
     * Search for a movie in the TMDB API
     */
    async searchTmdbMovies(query: string): Promise<TmdbMovieResult[]> {
        if (!query.trim() || !this.tmdbApiKey) return [];

        try {
            const response = await fetch(
                `https://api.themoviedb.org/3/search/movie?api_key=${this.tmdbApiKey}&query=${encodeURIComponent(query)}`
            );
            
            if (!response.ok) {
                throw new Error(`TMDB API returned ${response.status}`);
            }
            
            const data = await response.json();
            return data.results || [];
        } catch (error) {
            console.error('Error searching TMDB:', error);
            return [];
        }
    }

    /**
     * Convert TMDB movie data to our MoviePayload format
     */
    convertTmdbToPayload(tmdbMovie: TmdbMovieResult): MoviePayload {
        return {
            title: tmdbMovie.original_title || tmdbMovie.title || '',
            overview: tmdbMovie.overview || '',
            year: tmdbMovie.release_date ? parseInt(tmdbMovie.release_date.split('-')[0]) || 0 : 0,
            posterUrl: tmdbMovie.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbMovie.poster_path}` : '',
            backdropUrl: tmdbMovie.backdrop_path ? `https://image.tmdb.org/t/p/w500${tmdbMovie.backdrop_path}` : '',
            originalLanguage: tmdbMovie.original_language || '',
            genres: Array.isArray(tmdbMovie.genre_ids) ? tmdbMovie.genre_ids : []
        };
    }

    async getMovieDetails(tmdbId: number): Promise<TmdbMovieResult | null> {
        if (!tmdbId) return Promise.resolve(null);

        try {
            const response = await fetch(
                `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${this.tmdbApiKey}`
            );
            
            if (!response.ok) {
                throw new Error(`TMDB API returned ${response.status}`);
            }
            const data = await response.json();
            const movie = {
                id: data.id,
                title: data.title,
                original_title: data.original_title,
                overview: data.overview,
                release_date: data.release_date,
                poster_path: data.poster_path,
                backdrop_path: data.backdrop_path,
                original_language: data.original_language,
                genre_ids: data.genres ? data.genres.map((g: { id: number; }) => g.id) : []
            };
            
            return movie;
        } catch (error) {
            console.error('Error fetching movie details from TMDB:', error);
            return null;
        }
    }

    /**
     * Save a movie to the local database
     */
    async saveMovie(payload: MoviePayload): Promise<Movie> {
        if (!this.apiUrl) {
            throw new Error('API URL is not defined');
        }

        const response = await fetch(`${this.apiUrl}/api/Movies`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const text = await response.text().catch(() => '');
            throw new Error(`Failed to save movie: ${response.status} ${text}`);
        }

        return await response.json();
    }

    /**
     * Find a movie in TMDB and save it to the local database
     */
    async findAndSaveMovie(query: string): Promise<Movie | null> {
        try {
            const tmdbResults = await this.searchTmdbMovies(query);
            
            if (!tmdbResults.length) {
                console.log('No results found on TMDB');
                return null;
            }

            const firstResult = tmdbResults[0];
            console.log('Found on TMDB:', firstResult.original_title || firstResult.title);
            
            // Convert to our payload format
            const payload = this.convertTmdbToPayload(firstResult);
            
            // Save to local database
            const savedMovie = await this.saveMovie(payload);
            return savedMovie;
            
        } catch (error) {
            console.error('Error in findAndSaveMovie:', error);
            return null;
        }
    }
}

// Export as singleton instance
export const movieService = new MovieService();

// Export the class for testing/mocking
export default MovieService;