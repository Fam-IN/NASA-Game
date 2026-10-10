import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft, Activity, AlertTriangle,
  CheckCircle, XCircle, RotateCcw
} from "lucide-react";

const API = "http://127.0.0.1:8000";

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API}${path}`, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Request failed");
  }

  return data;
}

export default function Dashboard() {
  const { id } = useParams();

  const [mission, setMission] = useState(null);
  const [scenarioId, setScenarioId] = useState(1);
  const [difficulty, setDifficulty] = useState("Easy");
  const [session, setSession] = useState(null);
  const [selectedAction, setSelectedAction] = useState("");
  const [revealed, setRevealed] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    setMission(null);
    setSession(null);
    setScenarioId(1);
    setSelectedAction("");
    setRevealed([]);
    setError("");

    apiRequest(`/api/missions/${id}`)
      .then((data) => {
        if (!cancelled) setMission(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });

    return () => { cancelled = true; };
  }, [id]);

  async function startMission() {
    setBusy(true);
    setError("");
    setSession(null);
    setSelectedAction("");
    setRevealed([]);

    try {
      const data = await apiRequest("/api/session/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mission_id: Number(id),
          scenario_id: scenarioId,
          difficulty
        })
      });

      setSession(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function executeAction() {
    if (!session || !selectedAction || busy) return;

    setBusy(true);
    setError("");

    try {
      const data = await apiRequest("/api/session/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: session.session_id,
          action_id: selectedAction
        })
      });

      setSession(data);
      setSelectedAction("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!mission) {
    return (
      <div className="p-10 text-slate-300">
        {error || "Loading mission..."}
      </div>
    );
  }

  const currentScenario = mission.scenarios.find(
    (s) => s.id === scenarioId
  );

  const isActive = session?.status === "ACTIVE";
  const isFinished = session && !isActive;

  const resourceLabels = {
    power: "Power",
    fuel: "Fuel",
    oxygen: "Oxygen",
    integrity: "System Integrity",
    time: "Time Remaining"
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <Link
        to="/missions"
        className="flex items-center gap-2 text-cyan-400"
      >
        <ArrowLeft size={18} />
        Back to Missions
      </Link>

      <div className="mt-8">
        <p className="text-sm uppercase tracking-widest text-cyan-400">
          Mission Control
        </p>

        <h1 className="mt-2 text-4xl font-bold">
          {mission.title}
        </h1>

        <p className="mt-2 text-slate-400">
          {mission.category}
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">

          {/* Mission Setup */}
          <section className="rounded-2xl border border-white/10 bg-slate-900 p-6">
            <h2 className="mb-5 text-xl font-bold">
              Mission Configuration
            </h2>

            <label className="text-sm text-slate-400">
              Scenario
            </label>

            <select
              value={scenarioId}
              disabled={!!session || busy}
              onChange={(e) =>
                setScenarioId(Number(e.target.value))
              }
              className="mt-2 w-full rounded-lg bg-slate-800 p-3 disabled:opacity-50"
            >
              {mission.scenarios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <p className="mt-5 mb-3 text-sm text-slate-400">
              Difficulty
            </p>

            <div className="flex flex-wrap gap-3">
              {["Easy", "Medium", "Hard"].map((level) => (
                <button
                  key={level}
                  disabled={!!session || busy}
                  onClick={() => setDifficulty(level)}
                  className={`rounded-lg px-5 py-2 disabled:opacity-50 ${
                    difficulty === level
                      ? "bg-cyan-500 text-slate-950"
                      : "bg-slate-800 text-white"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>

            {!session && (
              <button
                onClick={startMission}
                disabled={busy}
                className="mt-6 w-full rounded-xl bg-cyan-500 p-4 font-bold text-slate-950 disabled:opacity-50"
              >
                {busy ? "Initializing..." : "Start Mission"}
              </button>
            )}

            {session && (
              <button
                onClick={() => {
                  setSession(null);
                  setSelectedAction("");
                  setRevealed([]);
                  setError("");
                }}
                disabled={busy}
                className="mt-6 flex items-center gap-2 text-cyan-400 disabled:opacity-50"
              >
                <RotateCcw size={16} />
                Configure New Mission
              </button>
            )}
          </section>

          {session && (
            <>
              {/* Emergency Briefing */}
              <section className="rounded-2xl border border-red-500/20 bg-slate-900 p-6">
                <div className="flex items-center gap-2 text-red-400">
                  <AlertTriangle size={20} />
                  <h2 className="text-xl font-bold">
                    Emergency Briefing
                  </h2>
                </div>

                <h3 className="mt-5 font-semibold">
                  {currentScenario.name}
                </h3>

                <p className="mt-2 text-slate-300">
                  {session.problem}
                </p>
              </section>

              {/* Investigation */}
              <section className="rounded-2xl border border-white/10 bg-slate-900 p-6">
                <h2 className="mb-5 text-xl font-bold">
                  Investigation Room
                </h2>

                <div className="space-y-3">
                  {session.clues.map((clue, index) => (
                    <div
                      key={index}
                      className="rounded-lg bg-slate-800 p-4"
                    >
                      {revealed.includes(index) ? (
                        <p className="text-cyan-300">
                          Clue {index + 1}: {clue}
                        </p>
                      ) : (
                        <button
                          onClick={() =>
                            setRevealed((previous) => [
                              ...previous, index
                            ])
                          }
                          className="text-cyan-400"
                        >
                          Reveal Clue {index + 1} →
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {/* Decision Room */}
              {isActive && (
                <section className="rounded-2xl border border-white/10 bg-slate-900 p-6">
                  <h2 className="mb-3 text-xl font-bold">
                    Decision Room
                  </h2>

                  <p className="mb-5 text-sm text-slate-400">
                    Select an engineering action.
                  </p>

                  <div className="space-y-3">
                    {session.actions.map((action) => (
                      <button
                        key={action.id}
                        disabled={busy}
                        onClick={() =>
                          setSelectedAction(action.id)
                        }
                        className={`w-full rounded-xl border p-4 text-left disabled:opacity-50 ${
                          selectedAction === action.id
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
                    disabled={!selectedAction || busy}
                    className="mt-6 w-full rounded-xl bg-cyan-500 p-4 font-bold text-slate-950 disabled:opacity-40"
                  >
                    {busy ? "Evaluating..." : "Execute Decision"}
                  </button>
                </section>
              )}

              {/* Decision History */}
              <section className="rounded-2xl border border-white/10 bg-slate-900 p-6">
                <h2 className="mb-5 text-xl font-bold">
                  Decision History
                </h2>

                {session.history.length === 0 && (
                  <p className="text-sm text-slate-400">
                    No decisions made yet.
                  </p>
                )}

                <div className="space-y-4">
                  {session.history.map((entry) => (
                    <div
                      key={entry.step}
                      className="rounded-lg bg-slate-800 p-4"
                    >
                      <p className="font-semibold">
                        Step {entry.step}: {entry.action}
                      </p>

                      <p className={`mt-2 text-sm ${
                        entry.correct
                          ? "text-green-400"
                          : "text-red-400"
                      }`}>
                        {entry.feedback}
                      </p>

                      {entry.event && (
                        <p className="mt-2 text-sm text-amber-400">
                          {entry.event}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          {error && (
            <p className="text-red-400">{error}</p>
          )}
        </div>

        {/* Mission Sidebar */}
        <aside className="space-y-6">
          {session && (
            <>
              <section className="rounded-2xl border border-white/10 bg-slate-900 p-6">
                <div className="flex items-center gap-2">
                  <Activity className="text-cyan-400" />
                  <h2 className="font-bold">
                    Mission Telemetry
                  </h2>
                </div>

                <p className="mt-4 text-sm text-slate-400">
                  Decision {session.step}/{session.max_steps}
                </p>

                <div className="mt-6 space-y-5">
                  {Object.entries(session.resources).map(
                    ([name, value]) => (
                      <div key={name}>
                        <div className="mb-2 flex justify-between text-sm">
                          <span>{resourceLabels[name]}</span>
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
                </div>

                <p className="mt-5 text-xs text-slate-500">
                  Simulated gameplay units, not real telemetry.
                </p>
              </section>

              {isFinished && (
                <section className="rounded-2xl border border-white/10 bg-slate-900 p-6">
                  <div className="flex items-center gap-2">
                    {session.status === "SUCCESS" ? (
                      <CheckCircle className="text-green-400" />
                    ) : (
                      <XCircle className="text-red-400" />
                    )}

                    <h2 className="font-bold">
                      Mission {session.status}
                    </h2>
                  </div>

                  <p className="mt-4 text-sm text-slate-400">
                    {session.status === "SUCCESS"
                      ? "The primary mission failure was resolved."
                      : "The mission objectives were not achieved."}
                  </p>

                  <button
                    onClick={startMission}
                    disabled={busy}
                    className="mt-5 w-full rounded-lg bg-cyan-500 p-3 font-bold text-slate-950 disabled:opacity-50"
                  >
                    {busy ? "Restarting..." : "Retry Mission"}
                  </button>
                </section>
              )}
            </>
          )}

          <section className="rounded-2xl border border-white/10 bg-slate-900 p-6">
            <h2 className="font-bold">AI Co-Pilot</h2>
            <p className="mt-3 text-sm text-slate-400">
              AI assistance is planned for Phase 6.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}