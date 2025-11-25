import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import SearchDropdown from './SearchDropdown';
import { movieService } from '../services/MovieService';
import { useUser } from '../hooks/useUser';


const Navbar = () => { 
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);
    const desktopSearchContainerRef = useRef<HTMLDivElement>(null);
    const mobileSearchContainerRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const { user, logout } = useUser();
    const location = useLocation();

    // Close dropdown on navigation
    useEffect(() => {
        setShowDropdown(false);
    }, [location]);
    
    // handle clicks outside the search container
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (desktopSearchContainerRef.current?.contains(target)) {
                return;
            }
            if (mobileSearchContainerRef.current?.contains(target)) {
                return;
            }
            setShowDropdown(false);
        };
        
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchQuery(value);
        setShowDropdown(value.trim().length > 0);
    };

    const SubmitSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Search submitted:", searchQuery);
        if (!searchQuery.trim()) return;

        try {
            // try to find the movie in the local database
            const localMovies = await movieService.searchLocalMovies(searchQuery);
            let movie = localMovies && localMovies[0];
            
            // if not found locally, search from TMDB and save
            if (!movie) {
                console.log('Searching from remote API');
                const remoteMovie = await SearchFromRemoteApi(searchQuery);
                if (remoteMovie) {
                    movie = remoteMovie;
                }
            }
            
            // navigate to the movie page if we found a movie
            if (movie && movie.id) {
                navigate(`/movie/${movie.id}`);
            } else {
                console.log('No movie found for search:', searchQuery);
            }
        } catch (error) {
            console.error('Error searching movies:', error);
        }
    }

    const SearchFromRemoteApi = async (query: string) => {
        try {
            return await movieService.findAndSaveMovie(query);
        } catch (error) {
            console.error('Error searching movies from remote API:', error);
            return null;
        }
    }
    
    return (
        <nav className="bg-gray-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex-shrink-0 md:hidden">
                {/* Placeholder for spacing */}
            </div>
            <div className="Title text-2xl font-bold flex-shrink-0">
                <Link to="/">MovieRatr</Link>
            </div>
            <div className="SearchBar text-gray-800 relative hidden md:block mx-auto" ref={desktopSearchContainerRef}>
                <form onSubmit={(e) => SubmitSearch(e)} className="flex">
                    <input 
                        type="text" 
                        placeholder="Search..." 
                        className="px-4 py-2 rounded-l-md" 
                        onChange={handleSearchInput}
                        value={searchQuery}
                        onFocus={() => {
                            if (searchQuery.trim().length > 0) {
                                setShowDropdown(true);
                            }
                        }}
                    />
                    <button type="submit" className="bg-yellow-400 text-gray-900 px-4 py-2 rounded-r-md">Search</button>
                        
                </form>
                
                <SearchDropdown 
                    isVisible={showDropdown} 
                    searchQuery={searchQuery} 
                />
            </div>
            <div className="Links hidden md:flex space-x-6 items-center">
              <Link to="/" className="hover:text-yellow-400 transition">
                Discover
              </Link>
              <Link to="/profile" className="hover:text-yellow-400 transition">
                My Profile
              </Link>
              {user ? (
                <button
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                  className="hover:text-yellow-400 transition"
                >
                  Log Out
                </button>
              ) : (
                <Link to="/login" className="hover:text-yellow-400 transition">
                  Log In
                </Link>
              )}
            </div>

            <div className="md:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-gray-200 hover:text-yellow-400 focus:outline-none focus:ring-yellow-400 focus:ring-2 rounded transition"
              >
                {isOpen ? 'X' : '='}
              </button>
            </div>
          </div>
        </div>
        <div
          className={`
    md:hidden bg-gray-800 overflow-hidden transform transition-all duration-300 ease-in-out
    ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
  `}
        >
          <div className="px-2 pt-2 pb-3 space-y-1">
            <div className="SearchBar text-gray-800 relative md:hidden" ref={mobileSearchContainerRef}>
                <form onSubmit={(e) => SubmitSearch(e)} className="flex">
                    <input 
                        type="text" 
                        placeholder="Search..." 
                        className="px-4 py-2 rounded-l-md w-full" 
                        onChange={handleSearchInput}
                        value={searchQuery}
                        onFocus={() => {
                            if (searchQuery.trim().length > 0) {
                                setShowDropdown(true);
                            }
                        }}
                    />
                    <button type="submit" className="bg-yellow-400 text-gray-900 px-4 py-2 rounded-r-md">Search</button>
                        
                </form>
                
                <SearchDropdown 
                    isVisible={showDropdown} 
                    searchQuery={searchQuery}
                />
            </div>
            <Link
              to="/"
              className="block px-3 py-2 rounded-md hover:bg-gray-700"
            >
              Discovery
            </Link>
            <Link
              to="/profile"
              className="block px-3 py-2 rounded-md hover:bg-gray-700"
              >
              My Profile
            </Link>
            <span>
                {user ? (
                  <button
                    onClick={() => {
                      logout();
                      navigate('/');
                    }}
                    className="block px-3 py-2 rounded-md hover:bg-gray-700 w-full text-left"
                  >
                    Log Out
                  </button>
                ) : (
                  <Link
                    to="/login"
                    className="block px-3 py-2 rounded-md hover:bg-gray-700"
                  >
                    Log In
                  </Link>
                )}
            </span>
          </div>
        </div>
      </nav>
    );
    
};

export default Navbar;
