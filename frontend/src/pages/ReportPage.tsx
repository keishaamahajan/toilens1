import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useApp } from "../store/AppContext";
import ThiBadge from "../components/ThiBadge";

const ISSUE_TYPES = [
  "Unclean / dirty",
  "Out of supplies",
  "Broken fixture",
  "Bad odour",
  "Poor lighting",
  "Accessibility issue",
  "Other",
];

export default function ReportPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { state, dispatch, campusBuildings } = useApp();

  const preselectedId = searchParams.get("toiletId") ?? "";
  const [toiletId, setToiletId] = useState(preselectedId);
  const [issueType, setIssueType] = useState("");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const selectedToilet = state.toilets.find((t) => t.id === toiletId);

  function handleSubmit() {
    if (!toiletId || !issueType) return;
    dispatch({ type: "SUBMIT_COMPLAINT", toiletId });
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-6 pb-24">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
            <path d="M5 13l4 4L19 7" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
        <h2
          className="text-xl font-bold text-slate-800 mb-2 text-center"
          style={{ fontFamily: "DM Sans, sans-serif" }}
        >
          Report submitted
        </h2>
        <p className="text-slate-500 text-sm text-center mb-6">
          Thank you. The cleaning team will be notified and the THI score has been updated.
        </p>
        {selectedToilet && (
          <div className="bg-white border border-slate-100 rounded-xl p-4 w-full max-w-sm mb-4">
            <p className="font-medium text-slate-800 text-sm">{selectedToilet.buildingName}</p>
            <p className="text-xs text-slate-500 mb-2">{selectedToilet.label}</p>
            <ThiBadge thi={selectedToilet.thiScore} size="sm" />
          </div>
        )}
        <div className="flex gap-3 w-full max-w-sm">
          <button
            onClick={() => navigate("/")}
            className="flex-1 py-2.5 bg-[#1E3A5F] text-white rounded-xl font-medium text-sm"
          >
            Home
          </button>
          <button
            onClick={() => {
              setSubmitted(false);
              setIssueType("");
              setDescription("");
            }}
            className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-medium text-sm"
          >
            New report
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-[#1E3A5F] text-white px-4 pt-10 pb-6">
        <button onClick={() => navigate(-1)} className="text-blue-200 text-sm mb-4 flex items-center gap-1">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Back
        </button>
        <h1 className="text-xl font-bold" style={{ fontFamily: "DM Sans, sans-serif" }}>
          Report an Issue
        </h1>
        <p className="text-blue-200 text-sm mt-0.5">Help keep VIT campus clean</p>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Select toilet */}
        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest block mb-2">
            Select Toilet
          </label>
          <select
            value={toiletId}
            onChange={(e) => setToiletId(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">— Choose a toilet —</option>
            {campusBuildings.map((b) => {
              const toilets = state.toilets.filter((t) => t.buildingId === b.id);
              return (
                <optgroup key={b.id} label={b.name}>
                  {toilets.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </optgroup>
              );
            })}
          </select>

          {selectedToilet && (
            <div className="mt-3 flex items-center gap-3 bg-slate-50 rounded-lg p-2.5">
              <ThiBadge thi={selectedToilet.thiScore} size="sm" />
              <p className="text-xs text-slate-500">
                {selectedToilet.complaints} open complaint{selectedToilet.complaints !== 1 ? "s" : ""}
              </p>
            </div>
          )}
        </div>

        {/* Issue type */}
        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest block mb-2">
            Issue Type
          </label>
          <div className="flex flex-wrap gap-2">
            {ISSUE_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => setIssueType(type)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                  issueType === type
                    ? "bg-red-600 text-white border-red-600"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest block mb-2">
            Additional Details <span className="text-slate-400 normal-case">(optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the issue…"
            rows={3}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={!toiletId || !issueType}
          className="w-full py-3 bg-red-600 text-white rounded-xl font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-red-700 transition"
          style={{ fontFamily: "DM Sans, sans-serif" }}
        >
          Submit Report
        </button>
      </div>
    </div>
  );
}
