import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Navbar from "./components/Navbar";
import SearchPage from "./pages/SearchPage";
import DiscoveryPage from "./pages/DiscoveryPage";
import ProfilePage from "./pages/ProfilePage";
import MoviePage from "./pages/MoviePage";
import PageTransition from "./components/PageTransition";

// This component must be inside Router to use useLocation
const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={
          <PageTransition>
            <DiscoveryPage/>
          </PageTransition>
        } />
        <Route path="/search" element={
          <PageTransition>
            <SearchPage/>
          </PageTransition>
        } />
        <Route path="/profile" element={
          <PageTransition>
            <ProfilePage/>
          </PageTransition>
        } />
        <Route path="/movie/:id" element={
          <PageTransition>
            <MoviePage/>
          </PageTransition>
        } />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <div className="h-screen overflow-hidden flex flex-col bg-gray-900">
      <Router>
        <Navbar />
        <main className="flex-1 overflow-y-auto scrollbar-none overflow-x-hidden">
          <AnimatedRoutes />
        </main>
      </Router>
    </div>
  );
}

export default App;
