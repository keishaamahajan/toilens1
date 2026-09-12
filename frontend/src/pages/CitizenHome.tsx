import { useNavigate } from "react-router-dom";
import { useApp } from "../store/AppContext";
import ThiBadge from "../components/ThiBadge";

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${(diff / 3600).toFixed(1)}h ago`;
}

export default function CitizenHome() {
  const { state, campusBuildings } = useApp();
  const navigate = useNavigate();

  // Campus-wide average THI
  const allThi = state.toilets.map((t) => t.thiScore);
  const avgThi = allThi.length
    ? Math.round(allThi.reduce((a, b) => a + b, 0) / allThi.length)
    : 0;
  const goodCount = state.toilets.filter((t) => t.thiScore >= 75).length;
  const urgentCount = state.toilets.filter((t) => t.thiScore < 50).length;

  // Nearest / best toilets (top 5 by THI)
  const nearby = state.toilets
    .slice()
    .sort((a, b) => b.thiScore - a.thiScore)
    .slice(0, 5);

  const thiColor = (thi: number) =>
    thi >= 75 ? "#16A34A" : thi >= 50 ? "#CA8A04" : "#DC2626";

  const thiRing = (thi: number) =>
    thi >= 75
      ? "ring-green-200 bg-green-50"
      : thi >= 50
      ? "ring-yellow-200 bg-yellow-50"
      : "ring-red-200 bg-red-50";

  return (
    <div className="pb-20 min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-[#1E3A5F] text-white px-4 pt-10 pb-6">
        <div className="flex items-start justify-between mb-1">
          <div>
            <p className="text-blue-200 text-xs font-mono tracking-widest uppercase mb-1">
              VIT Vellore • Campus
            </p>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "DM Sans, sans-serif" }}>
              ToiLens
            </h1>
          </div>
          <div className="text-right">
            <p className="text-blue-200 text-xs">Buildings mapped</p>
            <p className="text-white font-mono text-lg font-semibold">
              {campusBuildings.length}
            </p>
          </div>
        </div>
        <p className="text-blue-100 text-sm mt-1">Campus sanitation monitoring</p>
      </header>

      {/* THI Card */}
      <div className="px-4 -mt-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-800" style={{ fontFamily: "DM Sans, sans-serif" }}>
              Campus Health Index
            </h2>
            <span className="text-xs text-slate-400 font-mono">THI</span>
          </div>

          {/* Big THI ring */}
          <div className="flex items-center gap-4 mb-4">
            <div
              className={`w-20 h-20 rounded-full flex flex-col items-center justify-center ring-4 ${thiRing(avgThi)}`}
            >
              <span
                className="text-2xl font-bold font-mono"
                style={{ color: thiColor(avgThi) }}
              >
                {avgThi}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">/ 100</span>
            </div>
            <div className="flex-1 space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-2 h-2 bg-green-500 rounded-full" />
                  Good
                </span>
                <span className="font-mono text-slate-800 font-medium">{goodCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full" />
                  Monitor
                </span>
                <span className="font-mono text-slate-800 font-medium">
                  {state.toilets.filter((t) => t.thiScore >= 50 && t.thiScore < 75).length}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-2 h-2 bg-red-500 rounded-full" />
                  Urgent
                </span>
                <span className="font-mono text-slate-800 font-medium">{urgentCount}</span>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${avgThi}%`,
                background: thiColor(avgThi),
              }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-slate-400 font-mono">0</span>
            <span className="text-[10px] text-slate-400 font-mono">100</span>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="px-4 mt-4 grid grid-cols-2 gap-3">
        <button
          onClick={() => navigate("/map")}
          className="bg-[#1E3A5F] text-white rounded-xl p-3.5 text-left transition hover:bg-[#1a3356] active:scale-95"
        >
          <div className="mb-2">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
              <path
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6-3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 9m0 8V9M9 7l6 2"
                stroke="white"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <p className="font-semibold text-sm" style={{ fontFamily: "DM Sans, sans-serif" }}>
            Campus Map
          </p>
          <p className="text-blue-200 text-xs mt-0.5">Find clean toilets</p>
        </button>

        <button
          onClick={() => navigate("/map?mode=cleanest")}
          className="bg-green-700 text-white rounded-xl p-3.5 text-left transition hover:bg-green-800 active:scale-95"
        >
          <div className="mb-2">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
              <path
                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                stroke="white"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <p className="font-semibold text-sm" style={{ fontFamily: "DM Sans, sans-serif" }}>
            Find Cleanest
          </p>
          <p className="text-green-200 text-xs mt-0.5">Best nearby</p>
        </button>
      </div>

      {/* Best available toilet */}
      {nearby[0] && (
        <div className="px-4 mt-4">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-xs font-mono text-green-700 tracking-widest uppercase mb-2">
              Best Available
            </p>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-slate-800" style={{ fontFamily: "DM Sans, sans-serif" }}>
                  {nearby[0].buildingName}
                </p>
                <p className="text-sm text-slate-500 mt-0.5">{nearby[0].label}</p>
                <p className="text-xs text-slate-400 mt-1">
                  Cleaned {timeAgo(nearby[0].lastCleaned)}
                </p>
              </div>
              <ThiBadge thi={nearby[0].thiScore} size="sm" />
            </div>
            <button
              onClick={() => navigate(`/toilet/${nearby[0].id}`)}
              className="mt-3 w-full py-2 text-sm font-medium text-green-800 bg-green-100 hover:bg-green-200 rounded-lg transition"
            >
              View details
            </button>
          </div>
        </div>
      )}

      {/* Nearby toilets list */}
      <div className="px-4 mt-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-slate-800" style={{ fontFamily: "DM Sans, sans-serif" }}>
            Top Toilets by Health
          </h2>
          <button
            onClick={() => navigate("/map")}
            className="text-xs text-[#1E3A5F] font-medium"
          >
            See all →
          </button>
        </div>
        <div className="space-y-2">
          {nearby.slice(1).map((toilet) => (
            <button
              key={toilet.id}
              onClick={() => navigate(`/toilet/${toilet.id}`)}
              className="w-full bg-white border border-slate-100 rounded-xl p-3.5 flex items-center gap-3 text-left hover:border-slate-200 hover:shadow-sm transition"
            >
              <div
                className="w-2 h-10 rounded-full flex-shrink-0"
                style={{ background: thiColor(toilet.thiScore) }}
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800 text-sm truncate">
                  {toilet.buildingName}
                </p>
                <p className="text-xs text-slate-500">{toilet.label}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <span
                  className="font-mono font-bold text-sm"
                  style={{ color: thiColor(toilet.thiScore) }}
                >
                  {toilet.thiScore}
                </span>
                <p className="text-[10px] text-slate-400 font-mono">THI</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Prototype disclaimer */}
      <div className="px-4 mt-6 mb-2">
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
          <p className="text-xs text-amber-800 leading-relaxed">
            <span className="font-semibold">Prototype campus data</span> — Building coordinates are
            campus geotags. Toilet-level locations and sanitation metrics are simulated for MVP
            demonstration.
          </p>
        </div>
      </div>
    </div>
  );
}
