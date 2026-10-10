import { Link, NavLink } from "react-router-dom";
import { Rocket } from "lucide-react";

const links = [
  { to: "/", label: "Home", end: true },
  { to: "/missions", label: "Missions" },
  { to: "/advanced", label: "Advanced" },
  { to: "/solar-storm", label: "Solar Storm" },
  { to: "/branching", label: "Branching + AI" },
];

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/95 px-4 py-4 backdrop-blur md:px-6">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2" aria-label="PARADOX home">
          <Rocket className="text-cyan-400" />
          <span className="text-xl font-bold tracking-widest">PARADOX</span>
        </Link>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm">
          {links.map(({to,label,end}) => (
            <NavLink key={to} to={to} end={end}
              className={({isActive}) => isActive ? "font-semibold text-cyan-400" : "text-slate-300 transition hover:text-cyan-400"}>
              {label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
