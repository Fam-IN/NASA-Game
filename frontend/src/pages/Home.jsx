import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Rocket, BrainCircuit, GitBranch } from "lucide-react";

export default function Home() {
    const [apiStatus, setApiStatus] = useState("Connecting...");

useEffect(() => {
  fetch("http://127.0.0.1:8000/api/game")
    .then((response) => {
      if (!response.ok) throw new Error("API request failed");
      return response.json();
    })
    .then((data) => {
      setApiStatus(`${data.name} API Connected`);
    })
    .catch(() => {
      setApiStatus("Backend Offline");
    });
}, []);
  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center px-6 text-center">
      <div className="mb-6 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-5 py-2 text-sm text-cyan-300">
        AI-Powered Space Mission Investigation
      </div>

      <h1 className="text-5xl font-black tracking-widest text-white md:text-7xl">
        PARADOX
      </h1>

      <h2 className="mt-4 text-xl text-cyan-400 md:text-2xl">
        The Mission That Never Happened
      </h2>

      <p className="mt-6 max-w-2xl text-slate-400">
        Investigate failed space missions, uncover hidden clues,
        make critical decisions, and rewrite the future of space exploration.
      </p>
      <p className="mt-4 text-sm text-green-400">
        Backend Status: {apiStatus}
      </p>
      <Link
        to="/missions"
        className="mt-9 rounded-xl bg-cyan-500 px-8 py-4 font-bold text-slate-950 transition hover:bg-cyan-400"
      >
        Launch Investigation →
      </Link>

      <div className="mt-20 grid max-w-4xl gap-6 md:grid-cols-3">
        {[
          { icon: Rocket, title: "8 Missions", desc: "24 unique scenarios" },
          { icon: BrainCircuit, title: "AI Co-Pilot", desc: "Intelligent mission assistance" },
          { icon: GitBranch, title: "Parallel Timelines", desc: "Every decision changes the outcome" }
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <Icon className="mx-auto mb-4 text-cyan-400" size={30} />
            <h3 className="font-bold">{title}</h3>
            <p className="mt-2 text-sm text-slate-400">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}