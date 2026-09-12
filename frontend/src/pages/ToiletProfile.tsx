import { useParams, useNavigate } from "react-router-dom";
import { useApp } from "../store/AppContext";
import ThiBadge from "../components/ThiBadge";

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${(diff / 3600).toFixed(1)}h ago`;
}

function thiColor(thi: number) {
  if (thi >= 75) return "#16A34A";
  if (thi >= 50) return "#CA8A04";
  return "#DC2626";
}

export default function ToiletProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, dispatch, getToiletsForBuilding } = useApp();

  const toilet = state.toilets.find((t) => t.id === id);
  if (!toilet) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-slate-500 mb-4">Toilet not found.</p>
          <button onClick={() => navigate(-1)} className="text-[#1E3A5F] font-medium">
            ← Go back
          </button>
        </div>
      </div>
    );
  }

  const buildingToilets = getToiletsForBuilding(toilet.buildingId);

  const predictedHours = 3;
  const thiDrop = toilet.thiScore - toilet.predictedThi;

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div
        className="px-4 pt-10 pb-6"
        style={{
          background: `linear-gradient(135deg, #1E3A5F 0%, #1a4a7a 100%)`,
        }}
      >
        <button onClick={() => navigate(-1)} className="text-blue-200 text-sm mb-4 flex items-center gap-1">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Back
        </button>
        <p className="text-blue-200 text-xs font-mono mb-1">{toilet.buildingName}</p>
        <h1 className="text-xl font-bold text-white" style={{ fontFamily: "DM Sans, sans-serif" }}>
          {toilet.label}
        </h1>
        <p className="text-blue-100 text-sm mt-0.5 capitalize">{toilet.gender} • Floor {toilet.floor}</p>
      </div>

      {/* THI score card */}
      <div className="px-4 -mt-4 mb-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
          <div className="flex items-center gap-4">
            <div
              className="w-20 h-20 rounded-full flex flex-col items-center justify-center"
              style={{
                background: `${thiColor(toilet.thiScore)}15`,
                border: `3px solid ${thiColor(toilet.thiScore)}40`,
              }}
            >
              <span
                className="text-2xl font-bold font-mono"
                style={{ color: thiColor(toilet.thiScore) }}
              >
                {toilet.thiScore}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">THI</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <ThiBadge thi={toilet.thiScore} size="sm" />
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    toilet.priority === "OK"
                      ? "bg-green-100 text-green-700"
                      : toilet.priority === "Monitor"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {toilet.priority}
                </span>
              </div>
              <div className="mt-2">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Current</span>
                  <span>In {predictedHours}h</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${toilet.thiScore}%`,
                        background: thiColor(toilet.thiScore),
                      }}
                    />
                  </div>
                </div>
                {thiDrop > 0 && (
                  <p className="text-xs text-slate-500 mt-1">
                    Predicted: <span className="font-mono text-orange-600">{toilet.predictedThi}</span>
                    {" "}(−{thiDrop} in {predictedHours}h)
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="px-4 mb-4 grid grid-cols-3 gap-3">
        {[
          { label: "Complaints", value: toilet.complaints, mono: true },
          { label: "Footfall", value: toilet.footfall, mono: true },
          { label: "Last cleaned", value: timeAgo(toilet.lastCleaned), mono: false },
        ].map(({ label, value, mono }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-100 p-3 text-center">
            <p className="text-xs text-slate-400 mb-1">{label}</p>
            <p className={`font-bold text-slate-800 ${mono ? "font-mono" : "text-sm"}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Accessibility */}
      <div className="px-4 mb-4">
        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <h2
            className="font-semibold text-slate-800 mb-3"
            style={{ fontFamily: "DM Sans, sans-serif" }}
          >
            Accessibility
          </h2>
          <div className="flex gap-3">
            <div
              className={`flex-1 flex items-center gap-2 p-2.5 rounded-lg ${
                toilet.accessibility.wheelchairAccessible
                  ? "bg-green-50 text-green-700"
                  : "bg-slate-50 text-slate-400"
              }`}
            >
              <span className="text-lg">♿</span>
              <span className="text-xs font-medium">
                {toilet.accessibility.wheelchairAccessible ? "Wheelchair" : "No wheelchair"}
              </span>
            </div>
            <div
              className={`flex-1 flex items-center gap-2 p-2.5 rounded-lg ${
                toilet.accessibility.handrails
                  ? "bg-green-50 text-green-700"
                  : "bg-slate-50 text-slate-400"
              }`}
            >
              <span className="text-lg">🤲</span>
              <span className="text-xs font-medium">
                {toilet.accessibility.handrails ? "Handrails" : "No handrails"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 mb-4 space-y-2">
        <button
          onClick={() => navigate(`/report?toiletId=${toilet.id}`)}
          className="w-full py-3 bg-red-600 text-white rounded-xl font-semibold text-sm hover:bg-red-700 transition"
          style={{ fontFamily: "DM Sans, sans-serif" }}
        >
          Report an issue
        </button>
      </div>

      {/* Other toilets in building */}
      <div className="px-4">
        <h2
          className="font-semibold text-slate-800 mb-2"
          style={{ fontFamily: "DM Sans, sans-serif" }}
        >
          Other toilets in {toilet.buildingName}
        </h2>
        <div className="space-y-2">
          {buildingToilets
            .filter((t) => t.id !== toilet.id)
            .slice(0, 4)
            .map((t) => (
              <button
                key={t.id}
                onClick={() => navigate(`/toilet/${t.id}`)}
                className="w-full bg-white border border-slate-100 rounded-xl p-3 flex items-center gap-3 text-left hover:border-slate-200 transition"
              >
                <span
                  className="w-1.5 h-8 rounded-full flex-shrink-0"
                  style={{ background: thiColor(t.thiScore) }}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800">{t.label}</p>
                  <p className="text-xs text-slate-400 capitalize">{t.gender}</p>
                </div>
                <ThiBadge thi={t.thiScore} size="sm" />
              </button>
            ))}
        </div>
      </div>

      {/* Data note */}
      <div className="px-4 mt-6">
        <p className="text-xs text-slate-400 text-center leading-relaxed">
          Toilet locations are estimated for MVP demonstration. • Prototype campus data
        </p>
      </div>
    </div>
  );
}
