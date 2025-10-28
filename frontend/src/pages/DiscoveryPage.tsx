import { useEffect, useState } from "react";
import MovieCard from "../components/MovieCard";

function DiscoveryPage() {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMovies = async () => {
            try {
                const request = await fetch("http://localhost:5253/api/Movies");
                const data = await request.json();
                setMovies(data);
            } catch (error) {
                console.error("Error fetching movies:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMovies();
    }, []);

    if (loading) {
        return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Loading...</div>;
    }

    return (
      <div className="DiscoveryPage min-h-screen bg-gray-900 pt-6">
        <div className="sectionBar w-full flex justify-center items-center">
          <button className="text-2xl font-bold underline text-white mr-2">
            All Movies
          </button>
          <p className="text-2xl text-gray-500">|</p>
          <button className="text-2xl text-white active:text-bold ml-2" >Suggestions</button>
        </div>
        <div className="flex flex-wrap flex-row justify-center gap-6 p-6">
            {
                movies.map((movie: { id: number; posterUrl: string; title: string; year: number; }, index: number) => (
                    <MovieCard key={index} movie={movie} />
                ))
            }
        </div>
      </div>
    );
}
export default DiscoveryPage;   