import { Link, useNavigate } from "react-router-dom";
import {movieService} from '../services/MovieService';

interface SearchMovieCardProps {
    movie: {
        id?: number;
        posterUrl: string;
        title: string;
        year: number;
        isTmdb?: boolean;
    };
}

const SearchMovieCard = ({ movie } : SearchMovieCardProps ) => {
    const navigate = useNavigate();
    
    const handleTmdbClick = () => {
        movieService.getMovieDetails(movie.id!).then(tmdbMovie => {
            const payload = movieService.convertTmdbToPayload(tmdbMovie!);
            movieService.saveMovie(payload).then(savedMovie => {
                if (savedMovie && savedMovie.id) {
                    navigate(`/movie/${savedMovie.id}`);
                } else {
                    console.error('Failed to save movie from TMDB');
                }
            }).catch(err => {
                console.error('Error saving movie from TMDB:', err);
            });
        });
    };

    const cardContent = (
        <>
            <img src={movie.posterUrl} alt={movie.title} className="w-16 h-24 mr-4" />
            <div>
                <h3 className="text-lg font-semibold">{movie.title}</h3>
                <p className="text-sm text-gray-500">{movie.year}</p>
            </div>
        </>
    );

    if (movie.isTmdb) {
        return (
            <div 
                className="flex flex-row items-center p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-100" 
                onClick={handleTmdbClick}
            >
                {cardContent}
            </div>
        );
    }

    return (
        <Link 
            to={`/movie/${movie.id}`} 
            className="flex flex-row items-center p-4 border-b border-gray-200 hover:bg-gray-100"
        >
            {cardContent}
        </Link>
    );
};

export default SearchMovieCard;