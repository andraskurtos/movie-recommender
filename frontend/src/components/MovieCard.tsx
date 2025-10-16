import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface MovieCardProps {
    movie: {
        id?: number;
        posterUrl: string;
        title: string;
        year: number;
    };
}

const MovieCard = ({ movie }: MovieCardProps) => {
    const navigate = useNavigate();
    const titleRef = useRef<HTMLHeadingElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isOverflowing, setIsOverflowing] = useState(false);
    const [animationDuration, setAnimationDuration] = useState(6);

    useEffect(() => {
        if (titleRef.current && containerRef.current) {
            const titleWidth = titleRef.current.scrollWidth;
            const containerWidth = containerRef.current.clientWidth;
            const overflow = titleWidth > containerWidth;
            setIsOverflowing(overflow);
            
            // Calculate duration based on overflow amount
            // Base duration is 6s, add time proportionally to overflow
            if (overflow) {
                const overflowAmount = titleWidth - containerWidth;
                // ~0.02s per pixel of overflow for consistent speed
                const duration = 6 + (overflowAmount * 0.02);
                setAnimationDuration(duration);
            }
        }
    }, [movie.title]);

    const handleClick = () => {
        if (movie.id) {
            navigate(`/movie/${movie.id}`);
        }
    };

    return (
        <div onClick={handleClick} className="MovieCard max-w-[16rem] max-h-[27rem] bg-gray-700 bg-opacity-50 rounded-xl overflow-hidden shadow-lg p-4 shrink-0 flex flex-col items-center hover:scale-105 transform transition duration-300 group cursor-pointer">
            <img className="w-max h-max object-cover rounded-lg" src={movie.posterUrl} alt="Movie Poster" />
            <div ref={containerRef} className="w-full overflow-hidden mt-3">
                <h2 
                    ref={titleRef}
                    className={`text-lg font-semibold text-white whitespace-nowrap inline-block ${
                        isOverflowing 
                            ? 'text-left group-hover:animate-marquee-bounce' 
                            : 'text-center w-full'
                    }`}
                    style={isOverflowing ? { 
                        animationDuration: `${animationDuration}s`
                    } : {}}
                >
                    {movie.title}
                </h2>
            </div>
            <h3 className="text-lg text-center text-white">{movie.year}</h3>
        </div>
    );
}

export default MovieCard;