import { BrowserRouter as Router, Routes, Route} from "react-router-dom";
import Navbar from "./components/Navbar";
import SearchPage from "./pages/SearchPage";
import ProfilePage from "./pages/ProfilePage";
import DiscoveryPage from "./pages/DiscoveryPage";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<DiscoveryPage/>} />
        <Route path="/search" element={<SearchPage/>} />
        <Route path="/profile" element={<ProfilePage/>} />
      </Routes>
    </Router>
  );
}

export default App;
