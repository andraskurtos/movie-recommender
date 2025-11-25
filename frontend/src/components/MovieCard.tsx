import { useRef, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

interface MovieCardProps {
  movie: {
    id?: number;
    posterUrl: string;
    title: string;
    year: number;
    overview: string; // Changed from description to overview
  };
}

const MovieCard = ({ movie }: MovieCardProps) => {
  const navigate = useNavigate();
  const [isFlipped, setIsFlipped] = useState(false);

  const handleClick = () => {
    if (isFlipped) {
      navigate(`/movie/${movie.id}`);
    } else {
      setIsFlipped(true);
    }
  };

  const handleMouseLeave = () => {
    if (isFlipped) {
      setIsFlipped(false);
    }
  };

  return (
    <div
      className="group w-28 md:w-56 lg:w-64 h-[17rem] md:h-[29rem] [perspective:1000px] cursor-pointer"
      onClick={handleClick}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className={`relative w-full h-full [transform-style:preserve-3d] transition-transform duration-700 ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}
      >
        {/* Front of the card */}
        <div className="absolute w-full h-full [backface-visibility:hidden] rounded-xl overflow-hidden shadow-lg transition-shadow duration-300 group-hover:shadow-2xl group-hover:shadow-yellow-500/20">
          <div className="MovieCard w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex flex-col">
            <div className="relative w-full flex-shrink-0">
              <div className="pb-[150%]"></div> {/* 2:3 Aspect Ratio */}
              <img className="absolute inset-0 w-full h-full object-cover" src={`https://media.themoviedb.org/t/p/w600_and_h900_bestv2/${movie.posterUrl}`} alt="Movie Poster" />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-800 via-transparent to-transparent"></div> {/* Vignette effect */}
            </div>
            <div className="flex flex-col flex-grow justify-end p-2 md:p-4 text-white">
              <h2 className="text-sm md:text-base font-bold line-clamp-2 md:line-clamp-1 text-center">{movie.title}</h2>
              <h3 className="text-xs md:text-sm text-center text-yellow-400 mt-1 mb-2">{movie.year}</h3>
            </div>
          </div>
        </div>

        {/* Back of the card */}
        <div className="absolute w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-xl overflow-hidden shadow-lg bg-gradient-to-br from-gray-800 to-gray-900">
          <div className="w-full h-full flex flex-col p-4">
            <div className="text-center mb-2 flex-shrink-0">
                <h2 className="text-base md:text-lg font-bold text-yellow-400">{movie.title}</h2>
                <h3 className="text-xs md:text-sm text-gray-300">{movie.year}</h3>
            </div>
            <div className="flex-grow overflow-hidden relative">
                <p className="text-gray-300 text-xs md:text-sm h-full overflow-y-auto pr-2 scrollbar-hide">{movie.overview}</p>
                <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-gray-800 to-transparent pointer-events-none"></div> {/* Fade out effect for scroll */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MovieCard;
