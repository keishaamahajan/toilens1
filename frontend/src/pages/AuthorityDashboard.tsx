import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../store/AppContext";
import ThiBadge from "../components/ThiBadge";
import { CampusBuilding } from "../data/campusData";

function thiColor(thi: number) {
  if (thi >= 75) return "#16A34A";
  if (thi >= 50) return "#CA8A04";
  return "#DC2626";
}

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${(diff / 3600).toFixed(1)}h ago`;
}

type SortKey = "thi" | "complaints" | "priority";

export default function AuthorityDashboard() {
  const { state, dispatch, campusBuildings, getBuildingStats, getToiletsForBuilding } = useApp();
  const navigate = useNavigate();

  const [view, setView] = useState<"buildings" | "toilets">("buildings");
  const [selectedBuilding, setSelectedBuilding] = useState<CampusBuilding | null>(null);
  const [sort, setSort] = useState<SortKey>("priority");

  const totalComplaints = state.toilets.reduce((s, t) => s + t.complaints, 0);
  const urgentCount = state.toilets.filter((t) => t.priority === "Urgent").length;
  const avgThi = state.toilets.length
    ? Math.round(state.toilets.reduce((s, t) => s + t.thiScore, 0) / state.toilets.length)
    : 0;

  const sortedBuildings = useMemo(() => {
    return campusBuildings
      .map((b) => ({ building: b, stats: getBuildingStats(b.id) }))
      .sort((a, b) => {
        if (sort === "thi") return a.stats.avgThi - b.stats.avgThi;
        if (sort === "complaints") return b.stats.openComplaints - a.stats.openComplaints;
        // priority: sort by worst THI
        return a.stats.worstThi - b.stats.worstThi;
      });
  }, [state.toilets, sort]);

  const buildingToilets = useMemo(() => {
    if (!selectedBuilding) return [];
    return getToiletsForBuilding(selectedBuilding.id).sort(
      (a, b) => a.thiScore - b.thiScore
    );
  }, [selectedBuilding, state.toilets]);

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-[#1E3A5F] text-white px-4 pt-10 pb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-blue-200 text-xs font-mono tracking-widest uppercase">
              Authority Dashboard
            </p>
            <h1 className="text-xl font-bold" style={{ fontFamily: "DM Sans, sans-serif" }}>
              VIT Sanitation Control
            </h1>
          </div>
          <button
            onClick={() => navigate("/map")}
            className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg font-medium"
          >
            Map view
          </button>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Avg THI", value: avgThi, color: thiColor(avgThi) },
            { label: "Complaints", value: totalComplaints, color: totalComplaints > 20 ? "#DC2626" : "#CA8A04" },
            { label: "Urgent", value: urgentCount, color: urgentCount > 0 ? "#DC2626" : "#16A34A" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-[#163059] rounded-lg p-2.5 text-center">
              <p className="text-[10px] text-blue-200 font-mono">{label}</p>
              <p className="font-mono font-bold text-lg" style={{ color }}>
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* View toggle */}
      <div className="px-4 pt-3 pb-2 flex items-center gap-2">
        <div className="flex bg-white border border-slate-200 rounded-lg p-0.5 gap-0.5">
          {(["buildings", "toilets"] as const).map((v) => (
            <button
              key={v}
              onClick={() => {
                setView(v);
                setSelectedBuilding(null);
              }}
              className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition ${
                view === v
                  ? "bg-[#1E3A5F] text-white"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="text-xs border border-slate-200 rounded-lg px-2 py-1 text-slate-600 focus:outline-none bg-white"
        >
          <option value="priority">Sort: Priority</option>
          <option value="thi">Sort: THI ↑</option>
          <option value="complaints">Sort: Complaints ↓</option>
        </select>
      </div>

      {/* Buildings view */}
      {view === "buildings" && (
        <div className="px-4 space-y-2">
          {selectedBuilding ? (
            <>
              <div className="flex items-center gap-2 mb-1">
                <button
                  onClick={() => setSelectedBuilding(null)}
                  className="text-[#1E3A5F] text-sm font-medium flex items-center gap-1"
                >
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                    <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  Buildings
                </button>
                <span className="text-slate-400">/</span>
                <span className="text-sm text-slate-700 font-medium">{selectedBuilding.name}</span>
              </div>

              <div className="space-y-2">
                {buildingToilets.map((t) => (
                  <div
                    key={t.id}
                    className="bg-white rounded-xl border border-slate-100 p-3.5"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="font-medium text-slate-800 text-sm">{t.label}</p>
                        <p className="text-xs text-slate-400 capitalize">{t.gender}</p>
                      </div>
                      <ThiBadge thi={t.thiScore} size="sm" />
                    </div>
                    <div className="flex gap-3 text-xs text-slate-500 mb-3">
                      <span>Complaints: <strong className="text-slate-800">{t.complaints}</strong></span>
                      <span>Cleaned: <strong className="text-slate-800">{timeAgo(t.lastCleaned)}</strong></span>
                      <span>Predicted: <strong className="font-mono" style={{ color: thiColor(t.predictedThi) }}>{t.predictedThi}</strong></span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => dispatch({ type: "MARK_CLEANED", toiletId: t.id })}
                        className="flex-1 py-1.5 bg-green-600 text-white text-xs rounded-lg font-medium hover:bg-green-700 transition"
                      >
                        Mark cleaned
                      </button>
                      <button
                        onClick={() => navigate(`/toilet/${t.id}`)}
                        className="flex-1 py-1.5 bg-slate-100 text-slate-700 text-xs rounded-lg font-medium hover:bg-slate-200 transition"
                      >
                        View profile
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            sortedBuildings.map(({ building, stats }) => (
              <button
                key={building.id}
                onClick={() => setSelectedBuilding(building)}
                className="w-full bg-white rounded-xl border border-slate-100 p-3.5 text-left hover:border-slate-200 hover:shadow-sm transition"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-semibold text-slate-800 text-sm" style={{ fontFamily: "DM Sans, sans-serif" }}>
                      {building.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {building.floors} floors • {stats.totalToilets} toilets
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className="font-mono font-bold text-lg"
                      style={{ color: thiColor(stats.avgThi) }}
                    >
                      {stats.avgThi}
                    </span>
                    <p className="text-[10px] text-slate-400 font-mono">avg THI</p>
                  </div>
                </div>

                {/* Health bar */}
                <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${stats.avgThi}%`,
                      background: thiColor(stats.avgThi),
                    }}
                  />
                </div>

                <div className="flex gap-3 text-xs text-slate-500">
                  <span>
                    Complaints:{" "}
                    <strong className={stats.openComplaints > 5 ? "text-red-600" : "text-slate-800"}>
                      {stats.openComplaints}
                    </strong>
                  </span>
                  <span>
                    Worst:{" "}
                    <strong className="font-mono" style={{ color: thiColor(stats.worstThi) }}>
                      {stats.worstThi}
                    </strong>
                  </span>
                  {stats.highestRisk && (
                    <span className="text-slate-400">Risk: {stats.highestRisk.label}</span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {/* All toilets view */}
      {view === "toilets" && (
        <div className="px-4 space-y-2">
          {state.toilets
            .slice()
            .sort((a, b) => {
              if (sort === "thi") return a.thiScore - b.thiScore;
              if (sort === "complaints") return b.complaints - a.complaints;
              return a.thiScore - b.thiScore;
            })
            .map((t) => (
              <div
                key={t.id}
                className="bg-white rounded-xl border border-slate-100 p-3"
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div>
                    <p className="font-medium text-slate-800 text-sm">{t.buildingName}</p>
                    <p className="text-xs text-slate-400">{t.label}</p>
                  </div>
                  <ThiBadge thi={t.thiScore} size="sm" />
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 mb-2">
                  <span>Complaints: <strong className="text-slate-800">{t.complaints}</strong></span>
                  <span>Cleaned: <strong className="text-slate-800">{timeAgo(t.lastCleaned)}</strong></span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => dispatch({ type: "MARK_CLEANED", toiletId: t.id })}
                    className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg font-medium hover:bg-green-700 transition"
                  >
                    Mark cleaned
                  </button>
                  <button
                    onClick={() => navigate(`/toilet/${t.id}`)}
                    className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs rounded-lg font-medium hover:bg-slate-200 transition"
                  >
                    Profile
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Prototype note */}
      <div className="px-4 mt-6">
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <p className="text-xs text-amber-800">
            <strong>Campus Data • VIT Vellore • Prototype</strong> — 18 mapped buildings •
            2 toilets / floor • Estimated toilet coverage
          </p>
        </div>
      </div>
    </div>
  );
}
