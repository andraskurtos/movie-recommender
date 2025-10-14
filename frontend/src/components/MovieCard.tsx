const MovieCard = () => {
    return (
        <div className="MovieCard max-w-[16rem] max-h-[27rem] bg-gray-700 bg-opacity-50 rounded-xl overflow-hidden shadow-lg p-4 shrink-0 flex flex-col items-center hover:scale-105 transform transition duration-300">
            <img className="w-max h-max object-cover rounded-lg" src="https://media.themoviedb.org/t/p/w600_and_h900_bestv2/cm8TNGBGG0aBfWj0LgrESHv8tir.jpg" alt="Movie Poster" />
            <h2 className="text-lg text-center font-semibold text-white mt-3">Fantasztikus Faszos</h2>
            <h3 className="text-lg text-center text-white">2025</h3>
        </div>

    );
}

export default MovieCard;