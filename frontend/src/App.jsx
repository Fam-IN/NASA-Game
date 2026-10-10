import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Missions from "./pages/Missions";
import Dashboard from "./pages/Dashboard";
import AdvancedDashboard from "./pages/AdvancedDashboard";
import SolarStorm from "./pages/SolarStorm";
import BranchingMission from "./pages/BranchingMission";
import MissionDebrief from "./pages/MissionDebrief";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-950 text-white">
        <Navbar />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/missions" element={<Missions />} />
          <Route path="/mission/:id" element={<Dashboard />} />
          <Route path="/advanced" element={<AdvancedDashboard />} />
          <Route path="/solar-storm" element={<SolarStorm />} />
          <Route path="/branching" element={<BranchingMission />} />
          <Route path="/debrief/:sessionId" element={<MissionDebrief />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}