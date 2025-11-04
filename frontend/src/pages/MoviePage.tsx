import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import MovieCard from "../components/MovieCard";

interface Movie {
    id: number;
    posterUrl: string;
    title: string;
    year: number;
    overview: string;
    originalLanguage: string;
    backdropUrl: string;
}

const MoviePage = () => {
    const { id } = useParams<{ id: string }>();
    const [movie, setMovie] = useState<Movie | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMovie = async () => {
            try {
                const response = await fetch(`http://localhost:5253/api/Movies/${id}`);
                const data = await response.json();
                setMovie(data);
            } catch (error) {
                console.error("Error fetching movie:", error);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchMovie();
        }
    }, [id]);

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
            <h3 className="text-lg w-full text-gray-100">Rating: 9/10</h3>
            <h3 className="text-lg w-full text-gray-100">Rated on: 2025-10-14</h3>
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