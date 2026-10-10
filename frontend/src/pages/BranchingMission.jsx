import CopilotPanel from "../components/CopilotPanel";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  GitBranch,
  Satellite,
  Activity,
  RotateCcw,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";

const API = "http://127.0.0.1:8000";

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      typeof data.detail === "string"
        ? data.detail
        : "Request failed"
    );
  }

  return data;
}

export default function BranchingMission() {
  const [events, setEvents] = useState([]);
  const [eventId, setEventId] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [game, setGame] = useState(null);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadEvents() {
      try {
        const data = await request("/api/nasa/solar-flares");

        if (!cancelled) {
          setEvents(data.events);
          setEventId(data.events[0]?.event_id || "");
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setEventsLoading(false);
      }
    }

    loadEvents();

    return () => {
      cancelled = true;
    };
  }, []);

  async function startMission() {
    if (!eventId || loading) return;

    setLoading(true);
    setError("");
    setSelected("");

    try {
      const data = await request("/api/branching/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          event_id: eventId,
          difficulty
        })
      });

      setGame(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function executeAction() {
    if (!selected || !game || loading) return;

    setLoading(true);
    setError("");

    try {
      const data = await request("/api/branching/action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          session_id: game.session_id,
          action_id: selected
        })
      });

      setGame(data);
      setSelected("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const active = game?.status === "ACTIVE";
  const finished = game && !active;

  const resourceLabels = {
    power: "Power",
    fuel: "Fuel",
    oxygen: "Oxygen",
    integrity: "System Integrity",
    time: "Time Remaining"
  };

  return (
    <main className="mx-auto max-w-7xl px-6 py-10 text-white">
      <Link
        to="/missions"
        className="flex items-center gap-2 text-cyan-400"
      >
        <ArrowLeft size={18} />
        Back to Missions
      </Link>

      <header className="mt-8">
        <div className="flex items-center gap-3">
          <GitBranch size={32} className="text-cyan-400" />
          <div>
            <h1 className="text-3xl font-bold">
              Solar Storm: Decision Cascade
            </h1>
            <p className="mt-1 text-slate-400">
              Dynamic Branching Investigation
            </p>
          </div>
        </div>
      </header>

      {!game && (
        <section className="mt-8 rounded-2xl border border-white/10 bg-slate-900 p-6">
          <h2 className="text-xl font-bold">
            Mission Configuration
          </h2>

          <label className="mt-6 block text-sm text-slate-400">
            NASA Solar Flare Event
          </label>

          <select
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            disabled={eventsLoading}
            className="mt-2 w-full rounded-lg bg-slate-800 p-3"
          >
            {events.map((event) => (
              <option
                key={event.event_id}
                value={event.event_id}
              >
                {event.class_type || "Unknown"}
                {" — "}
                {event.begin_time}
              </option>
            ))}
          </select>

          <label className="mt-5 block text-sm text-slate-400">
            Difficulty
          </label>

          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="mt-2 w-full rounded-lg bg-slate-800 p-3"
          >
            <option>Easy</option>
            <option>Medium</option>
            <option>Hard</option>
          </select>

          <button
            onClick={startMission}
            disabled={!eventId || loading || eventsLoading}
            className="mt-6 rounded-xl bg-cyan-500 px-8 py-3 font-bold text-slate-950 disabled:opacity-40"
          >
            {loading ? "Initializing..." : "Start Branching Mission"}
          </button>

          {!eventsLoading && events.length === 0 && !error && (
            <p className="mt-4 text-sm text-slate-400">
              No recent NASA events are available.
            </p>
          )}
        </section>
      )}

      {game && (
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">

            <section className="rounded-2xl border border-cyan-500/20 bg-slate-900 p-6">
              <div className="flex items-center gap-2 text-cyan-400">
                <Satellite size={20} />
                <h2 className="text-xl font-bold">
                  NASA DONKI Event
                </h2>
              </div>

              <div className="mt-5 space-y-2 text-sm text-slate-300">
                <p>Event ID: {game.nasa_event.event_id}</p>
                <p>Flare Class: {game.nasa_event.class_type}</p>
                <p>Begin: {game.nasa_event.begin_time}</p>
                <p>Peak: {game.nasa_event.peak_time}</p>
                <p>End: {game.nasa_event.end_time || "Unknown"}</p>
              </div>

              <p className="mt-4 text-xs text-slate-500">
                NASA event is historical. Spacecraft conditions are simulated.
              </p>
            </section>

            <section className="rounded-2xl border border-white/10 bg-slate-900 p-6">
              <p className="text-sm uppercase tracking-wider text-cyan-400">
                Decision {game.decision_count + (active ? 1 : 0)}
                {" / "}
                {game.max_decisions}
              </p>

              <h2 className="mt-3 text-2xl font-bold">
                {active ? game.stage : `Mission ${game.status}`}
              </h2>

              <p className="mt-4 text-slate-300">
                {game.briefing ||
                  "The branching investigation has ended."}
              </p>

              <p className="mt-4 text-xs text-slate-500">
                Current Node: {game.node_id}
              </p>
            </section>

            {active && (
              <>
                <section className="rounded-2xl border border-white/10 bg-slate-900 p-6">
                  <div className="mb-5 flex items-center gap-2">
                    <Activity className="text-cyan-400" />
                    <h2 className="text-xl font-bold">
                      Simulated Telemetry
                    </h2>
                  </div>

                  {Object.entries(game.telemetry).map(
                    ([key, value]) => (
                      <div
                        key={key}
                        className="flex justify-between gap-4 border-b border-white/10 py-3 text-sm"
                      >
                        <span className="capitalize text-slate-400">
                          {key.replaceAll("_", " ")}
                        </span>
                        <span className="text-right text-cyan-300">
                          {value}
                        </span>
                      </div>
                    )
                  )}
                </section>

                <section className="rounded-2xl border border-white/10 bg-slate-900 p-6">
                  <h2 className="mb-5 text-xl font-bold">
                    Engineering Decisions
                  </h2>

                  <div className="space-y-3">
                    {game.actions.map((action) => (
                      <button
                        key={action.id}
                        onClick={() => setSelected(action.id)}
                        disabled={loading}
                        className={`w-full rounded-xl border p-4 text-left disabled:opacity-50 ${
                          selected === action.id
                            ? "border-cyan-400 bg-cyan-500/10"
                            : "border-white/10 bg-slate-800"
                        }`}
                      >
                        <span className="mr-3 font-bold text-cyan-400">
                          {action.id}.
                        </span>
                        {action.label}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={executeAction}
                    disabled={!selected || loading}
                    className="mt-6 w-full rounded-xl bg-cyan-500 p-4 font-bold text-slate-950 disabled:opacity-40"
                  >
                    {loading ? "Evaluating..." : "Execute Decision"}
                  </button>
                </section>
              </>
            )}

            <section className="rounded-2xl border border-white/10 bg-slate-900 p-6">
              <h2 className="mb-5 text-xl font-bold">
                Decision Path & History
              </h2>

              {game.history.length === 0 && (
                <p className="text-slate-400">
                  No decisions have been made.
                </p>
              )}

              <div className="space-y-4">
                {game.history.map((entry) => (
                  <div
                    key={entry.step}
                    className="rounded-xl bg-slate-800 p-4"
                  >
                    <p className="font-semibold text-cyan-300">
                      Decision {entry.step}
                    </p>

                    <p className="mt-2 text-sm text-slate-300">
                      {entry.from_node} → {entry.to_node}
                    </p>

                    <p className="mt-2 font-medium">
                      {entry.action}
                    </p>

                    <p className="mt-2 text-sm text-slate-400">
                      {entry.feedback}
                    </p>

                    <p className="mt-3 text-xs text-slate-500">
                      Engineering Principle: {entry.principle}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {Object.entries(entry.resource_changes).map(
                        ([name, change]) => (
                          <span
                            key={name}
                            className="rounded-md bg-slate-700 px-2 py-1 text-xs"
                          >
                            {name}: {change > 0 ? "+" : ""}
                            {change}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <CopilotPanel
              sessionId={game.session_id}
              nodeId={game.node_id}
              active={game.status === "ACTIVE"}
            />
            <section className="rounded-2xl border border-white/10 bg-slate-900 p-6">
              <h2 className="mb-5 text-xl font-bold">
                Mission Resources
              </h2>

              {Object.entries(game.resources).map(
                ([key, value]) => (
                  <div key={key} className="mb-5">
                    <div className="mb-2 flex justify-between text-sm">
                      <span>{resourceLabels[key] || key}</span>
                      <span>{value}/100</span>
                    </div>

                    <div className="h-2 rounded-full bg-slate-700">
                      <div
                        className={`h-2 rounded-full ${
                          value <= 25
                            ? "bg-red-400"
                            : value <= 50
                            ? "bg-amber-400"
                            : "bg-cyan-400"
                        }`}
                        style={{ width: `${value}%` }}
                      />
                    </div>
                  </div>
                )
              )}

              <p className="text-xs text-slate-500">
                Gameplay units, not actual spacecraft measurements.
              </p>
            </section>

            {finished && (
              <section className="rounded-2xl border border-white/10 bg-slate-900 p-6">
                <div className="flex items-center gap-2">
                  {game.status === "SUCCESS" ? (
                    <CheckCircle2 className="text-green-400" />
                  ) : (
                    <AlertTriangle className="text-red-400" />
                  )}

                  <h2 className="text-xl font-bold">
                    Mission {game.status}
                  </h2>
                </div>

                <p className="mt-4 text-sm text-slate-400">
                  {game.scientific_note}
                </p>
                <Link
                  to={`/debrief/${game.session_id}`}
                  className="mt-5 block rounded-xl bg-violet-500 px-5 py-3 text-center font-bold text-white hover:bg-violet-600"
                >
                  View Scientific Mission Debrief
                </Link>
                <button
                  onClick={startMission}
                  disabled={loading}
                  className="mt-5 flex items-center gap-2 rounded-lg bg-cyan-500 px-5 py-3 font-bold text-slate-950 disabled:opacity-50"
                >
                  <RotateCcw size={16} />
                  Retry Mission
                </button>

                <button
                  onClick={() => {
                    setGame(null);
                    setSelected("");
                    setError("");
                  }}
                  className="mt-4 block text-sm text-cyan-400"
                >
                  Choose Another Event
                </button>
              </section>
            )}
          </aside>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-6 text-red-400">
          {error}
        </p>
      )}
    </main>
  );
}
