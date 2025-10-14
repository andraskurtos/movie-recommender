import MovieCard from "../components/MovieCard";

const MoviePage = () => {
    return (
      <div className="MoviePage h-max flex-col bg-gray-900 pt-6 flex ">
        <div className="MovieData flex flex-row text-white w-full h-[18rem] px-6">
          <img
            className="w-[12rem] h-[18rem] object-cover rounded-lg ml-6"
            src="https://media.themoviedb.org/t/p/w600_and_h900_bestv2/cm8TNGBGG0aBfWj0LgrESHv8tir.jpg"
            alt="Movie Poster"
          />
          <div className="MovieInfo flex flex-col ml-6 mr-6">
            <h2 className="text-2xl font-bold">Fantasztikus Faszos</h2>
            <h3 className="text-lg">2025</h3>
            <p className="text-gray-400 h-max w-[40rem] overflow-scroll scrollbar-none">Amikor kiderül, hogy az univerzális faszszopó GalAKTUS meg akarja baszni a Földet, a fantasztikus faszosok az egyetlenek, akik megállthatják őt. Riley Reid és a többiek a szuperképességeikkel, mint a szuper nyúlós fasz, szuper kemény fasz, égő fasz és láthatatlan fasz csak úgy állíthatják meg ezt az intergalaktikus predátort, ha saját gyerekük életét kockáztatják, akinek szuperfaszképességei még ismeretlenek. Amikor kiderül, hogy az univerzális faszszopó GalAKTUS meg akarja baszni a Földet, a fantasztikus faszosok az egyetlenek, akik megállthatják őt. Riley Reid és a többiek a szuperképességeikkel, mint a szuper nyúlós fasz, szuper kemény fasz, égő fasz és láthatatlan fasz csak úgy állíthatják meg ezt az intergalaktikus predátort, ha saját gyerekük életét kockáztatják, akinek szuperfaszképességei még ismeretlenek. Amikor kiderül, hogy az univerzális faszszopó GalAKTUS meg akarja baszni a Földet, a fantasztikus faszosok az egyetlenek, akik megállthatják őt. Riley Reid és a többiek a szuperképességeikkel, mint a szuper nyúlós fasz, szuper kemény fasz, égő fasz és láthatatlan fasz csak úgy állíthatják meg ezt az intergalaktikus predátort, ha saját gyerekük életét kockáztatják, akinek szuperfaszképességei még ismeretlenek.</p>
          </div>
          <div className="MovieDetails flex flex-col ml-6 mr-6">
            <h2 className="text-2xl font-bold">Details</h2>
            <h3 className="text-lg w-full">Director: John Doe</h3>
            <h3 className="text-lg w-full">Genre: Action, Sci-Fi</h3>
            <h3 className="text-lg w-full">Duration: 2h 15m</h3>
            <h3 className="text-lg w-full">Language: English</h3>
          </div>
          <div className="MovieRatings flex flex-col ml-6 mr-6">
            <h2 className="text-2xl font-bold">Ratings</h2>
            <h3 className="text-lg w-full">IMDb: 8.5/10</h3>
            <h3 className="text-lg w-full">Rotten Tomatoes: 95%</h3>
            <h2 className="text-2xl font-bold mt-6">Your Rating</h2>
            <h3 className="text-lg w-full">Rating: 9/10</h3>
            <h3 className="text-lg w-full">Rated on: 2025-10-14</h3>
          </div>
        </div>
        <div className="MovieRecommendations flex flex-col mt-2 ml-6 mr-6 h-1/3">
            <div className="sectionBar w-full flex-row flex p-4 justify-start gap-6">
                <button className="text-2xl font-bold text-white">Recommended Movies</button>
                <button className="text-2xl font-bold text-white">Movie Cast</button>
            </div>
            <div className="flex shrink-0 flex-row justify-top overflow-y-hidden overflow-x-scroll scrollbar-none gap-4 bg-gray-900 h-1/3 w-full">
                <MovieCard />
                <MovieCard />
                <MovieCard />
                <MovieCard />
                <MovieCard />
                <MovieCard />
                <MovieCard />
                <MovieCard />
                <MovieCard />
                <MovieCard />
                <MovieCard />
                <MovieCard />
                <MovieCard />
                <MovieCard />
                <MovieCard />
                <MovieCard />
            </div>
        </div>
      </div>
    );
};

export default MoviePage;