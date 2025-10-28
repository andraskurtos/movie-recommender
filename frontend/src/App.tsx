import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { UserProvider } from "./contexts/UserContext";
import Navbar from "./components/Navbar";
import SearchPage from "./pages/SearchPage";
import DiscoveryPage from "./pages/DiscoveryPage";
import ProfilePage from "./pages/ProfilePage";
import MoviePage from "./pages/MoviePage";
import LoginPage from "./pages/LoginPage";
import PageTransition from "./components/PageTransition";

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
        <Route path="/login" element={
          <PageTransition>
            <LoginPage/>
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
        <UserProvider>
          <Navbar />
          <main className="flex-1 overflow-y-auto scrollbar-none overflow-x-hidden">
            <AnimatedRoutes />
          </main>
        </UserProvider>
      </Router>
    </div>
  );
}

export default App;
