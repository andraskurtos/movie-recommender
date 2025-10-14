import { BrowserRouter as Router, Routes, Route} from "react-router-dom";
import Navbar from "./components/Navbar";
import SearchPage from "./pages/SearchPage";
import DiscoveryPage from "./pages/DiscoveryPage";
import MoviePage from "./pages/MoviePage";

function App() {
  return (
    <div className="h-screen overflow-hidden flex flex-col">

    <Router>
      <Navbar />
      <main className="flex-1 overflow-y-auto scrollbar-none overflow-x-hidden">
        <Routes>
          <Route path="/" element={<DiscoveryPage/>} />
          <Route path="/search" element={<SearchPage/>} />
          <Route path="/profile" element={<MoviePage/>} />
        </Routes>
      </main>
      </Router>
    </div>
  );
}

export default App;
