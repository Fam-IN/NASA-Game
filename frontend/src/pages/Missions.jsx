import { useEffect, useState } from "react";
import MissionCard from "../components/MissionCard";

const API = "http://127.0.0.1:8000";

export default function Missions() {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API}/api/missions`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load missions");
        }
        return response.json();
      })
      .then(setMissions)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <p className="text-sm uppercase tracking-widest text-cyan-400">
        Mission Database
      </p>

      <h1 className="mt-3 text-4xl font-bold">
        Select Your Mission
      </h1>

      <p className="mt-3 mb-10 text-slate-400">
        Investigate 8 missions with 24 different scenarios.
      </p>

      {loading && <p>Loading missions...</p>}
      {error && <p className="text-red-400">{error}</p>}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {missions.map((mission) => (
          <MissionCard
            key={mission.id}
            mission={mission}
          />
        ))}
      </div>
    </div>
  );
}
















