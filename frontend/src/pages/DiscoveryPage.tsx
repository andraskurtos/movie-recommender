import MovieCard from "../components/MovieCard";

function DiscoveryPage() {
    return (
      <div className="DiscoveryPage min-h-screen bg-gray-900 pt-6">
        <div className="sectionBar w-full flex justify-center items-center">
          <button className="text-2xl font-bold text-white">Suggestions</button>
          <button className="text-2xl font-bold text-white ml-4">
            All Movies
          </button>
        </div>
        <div className="flex flex-wrap flex-row justify-center gap-6 p-6">
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
    );
}
export default DiscoveryPage;   