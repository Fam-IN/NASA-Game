import { Link } from "react-router-dom";
import { ArrowRight, Orbit } from "lucide-react";

export default function MissionCard({ mission }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900 p-6 transition hover:border-cyan-500/50">
      <div className="mb-5 flex items-center justify-between">
        <Orbit className="text-cyan-400" size={30} />
        <span className="text-xs text-slate-500">
          MISSION {String(mission.id).padStart(2, "0")}
        </span>
      </div>

      <h3 className="text-xl font-bold">{mission.title}</h3>
      <p className="mt-2 text-xs uppercase tracking-wider text-cyan-400">
        {mission.category}
      </p>

      <p className="mt-4 min-h-14 text-sm text-slate-400">
        {mission.scenarios.length} investigation scenarios available.
      </p>

      <p className="mb-5 text-xs text-slate-500">
        {mission.scenarios.length} Scenarios Available
      </p>

      <Link
        to={`/mission/${mission.id}`}
        className="flex items-center justify-between rounded-lg bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-300 hover:bg-cyan-500/20"
      >
        Investigate Mission
        <ArrowRight size={18} />
      </Link>
    </div>
  );
}