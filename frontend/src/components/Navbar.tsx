import { useState } from 'react';
import { Link } from 'react-router-dom';


const Navbar = () => { 
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const API_URL = import.meta.env.VITE_API_URL;

    const SubmitSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Search submitted:", searchQuery);
        // Implement search functionality here
        if (!searchQuery.trim()) return;
        try {
          const response = await fetch(`${API_URL}/api/Movies/search?query=${searchQuery}`);
          if (!response.ok) {
            throw new Error('Failed to find movies');
          }
          const data = await response.json();
          console.log(data);
        } catch (error) {
          console.error('Error searching movies:', error);
        }
    }
    
    return (
        <nav className="bg-gray-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="Title text-2xl font-bold flex-shrink-0">MovieRatr</div>
            <div className="SearchBar text-gray-800">
                <form onSubmit={(e) => SubmitSearch(e)} className="flex">
                    <input type="text" placeholder="Search..." className="px-4 py-2 rounded-l-md" onChange={(e) => setSearchQuery(e.target.value)}/>
                    <button type="submit" className="bg-yellow-400 text-gray-900 px-4 py-2 rounded-r-md">Search</button>
                </form>
            </div>
            <div className="Links hidden md:flex space-x-6 items-center">
              <Link to="/" className="hover:text-yellow-400 transition">
                Discover
              </Link>
              <Link to="/search" className="hover:text-yellow-400 transition">
                Search
              </Link>
              <Link to="/profile" className="hover:text-yellow-400 transition">
                My Profile
              </Link>
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
    ${isOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}
  `}
        >
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              to="/"
              className="block px-3 py-2 rounded-md hover:bg-gray-700"
            >
              Discovery
            </Link>
            <Link
              to="/search"
              className="block px-3 py-2 rounded-md hover:bg-gray-700"
            >
              Search
            </Link>
            <Link
              to="/profile"
              className="block px-3 py-2 rounded-md hover:bg-gray-700"
            >
              My Profile
            </Link>
          </div>
        </div>
      </nav>
    );
    
};

export default Navbar;