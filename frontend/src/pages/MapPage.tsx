import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  Circle,
  Polyline,
} from "react-leaflet";
import L from "leaflet";
import { useApp } from "../store/AppContext";
import { CampusBuilding, ToiletRecord } from "../data/campusData";
import ThiBadge from "../components/ThiBadge";

// Fix Leaflet default icon in Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function makeCircleIcon(color: string, size = 14) {
  return L.divIcon({
    className: "",
    html: `<div style="width:${size}px;height:${size}px;background:${color};border:2.5px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function makeBuildingIcon(name: string, active: boolean) {
  return L.divIcon({
    className: "",
    html: `<div style="
      background:${active ? "#2563EB" : "#1E3A5F"};
      color:white;
      padding:3px 7px;
      border-radius:4px;
      font-size:10px;
      font-family:DM Sans,sans-serif;
      font-weight:600;
      white-space:nowrap;
      box-shadow:0 2px 6px rgba(0,0,0,0.4);
      border:${active ? "2px solid #93C5FD" : "2px solid transparent"};
    ">${name}</div>`,
    iconSize: [1, 1],
    iconAnchor: [0, 0],
  });
}

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

// Component to fly map to a position
function MapFlyTo({ lat, lng, zoom }: { lat: number; lng: number; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], zoom, { duration: 1 });
  }, [lat, lng, zoom, map]);
  return null;
}

type FloorFilter = "all" | number;

export default function MapPage() {
  const { state, campusBuildings, getToiletsForBuilding, getBuildingStats } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [selectedBuilding, setSelectedBuilding] = useState<CampusBuilding | null>(null);
  const [selectedToilet, setSelectedToilet] = useState<ToiletRecord | null>(null);
  const [floorFilter, setFloorFilter] = useState<FloorFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCleanest, setShowCleanest] = useState(searchParams.get("mode") === "cleanest");
  const [flyTarget, setFlyTarget] = useState<{ lat: number; lng: number; zoom: number } | null>(null);

  const toilets = state.toilets;
  const routes = state.routes;

  // Building stats (memoized)
  const buildingStats = useMemo(() => {
    const map = new Map<string, ReturnType<typeof getBuildingStats>>();
    campusBuildings.forEach((b) => {
      map.set(b.id, getBuildingStats(b.id));
    });
    return map;
  }, [state.toilets]);

  // Search: find building or toilet
  function handleSearch(q: string) {
    setSearchQuery(q);
    if (!q.trim()) return;
    const lower = q.toLowerCase();

    // Try building match
    const bMatch = campusBuildings.find((b) => b.name.toLowerCase().includes(lower));
    if (bMatch) {
      setSelectedBuilding(bMatch);
      setFloorFilter("all");
      setFlyTarget({ lat: bMatch.lat, lng: bMatch.lng, zoom: 18 });
      return;
    }

    // Try toilet match
    const tMatch = toilets.find(
      (t) =>
        t.buildingName.toLowerCase().includes(lower) ||
        t.label.toLowerCase().includes(lower) ||
        t.id.toLowerCase().includes(lower)
    );
    if (tMatch) {
      const building = campusBuildings.find((b) => b.id === tMatch.buildingId);
      if (building) setSelectedBuilding(building);
      setSelectedToilet(tMatch);
      setFlyTarget({ lat: tMatch.lat, lng: tMatch.lng, zoom: 19 });
    }
  }

  // Filtered toilets for current building + floor
  const buildingToilets = useMemo(() => {
    if (!selectedBuilding) return [];
    const all = getToiletsForBuilding(selectedBuilding.id);
    if (floorFilter === "all") return all;
    return all.filter((t) => t.floor === floorFilter);
  }, [selectedBuilding, floorFilter, state.toilets]);

  // Cleanest sorted
  const cleanest = useMemo(
    () =>
      [...toilets]
        .sort(
          (a, b) =>
            b.thiScore - a.thiScore ||
            a.complaints - b.complaints ||
            new Date(b.lastCleaned).getTime() - new Date(a.lastCleaned).getTime()
        )
        .slice(0, 5),
    [toilets]
  );

  const stats = selectedBuilding ? buildingStats.get(selectedBuilding.id) : null;
  const buildingFloors = selectedBuilding
    ? Array.from({ length: selectedBuilding.floors }, (_, i) => i + 1)
    : [];

  return (
    <div className="flex flex-col bg-slate-900" style={{ height: "calc(100vh - 56px)" }}>
      {/* Top bar */}
      <div className="bg-[#1E3A5F] text-white px-4 pt-8 pb-3 space-y-2 flex-shrink-0 z-10">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold flex-1" style={{ fontFamily: "DM Sans, sans-serif" }}>
            Campus Map
          </h1>
        </div>
        {/* Search */}
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            width="14"
            height="14"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
            <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Search campus building or toilet…"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-[#163059] text-white placeholder-slate-400 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </div>
        <div className="flex items-center justify-between">
            <span className="text-xs text-blue-200 font-mono">
              Live API locations • {campusBuildings.length} locations
            </span>
            <button
              onClick={() => setShowCleanest(!showCleanest)}
              className={`text-xs px-2 py-0.5 rounded-full font-medium transition ${
                showCleanest ? "bg-green-500 text-white" : "bg-[#163059] text-blue-200 hover:text-white"
              }`}
            >
              Cleanest nearby
            </button>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer
          center={[12.9705, 79.1600]}
          zoom={16}
          className="w-full h-full"
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {routes.map((route) => (
            <Polyline key={route.id} positions={route.waypoints} pathOptions={{ color: "#2563EB", weight: 4, opacity: 0.7 }}>
              <Popup>{route.from} → {route.to} · {route.distanceMeters} m{route.estimatedMinutes ? ` · ${route.estimatedMinutes} min` : ""}</Popup>
            </Polyline>
          ))}

          {flyTarget && (
            <MapFlyTo lat={flyTarget.lat} lng={flyTarget.lng} zoom={flyTarget.zoom} />
          )}

          {/* Building markers */}
          {campusBuildings.map((b) => {
            const stats = buildingStats.get(b.id);
            const isActive = selectedBuilding?.id === b.id;
            return (
              <Marker
                key={b.id}
                position={[b.lat, b.lng]}
                icon={makeBuildingIcon(b.name, isActive)}
                eventHandlers={{
                  click: () => {
                    setSelectedBuilding(b);
                    setFloorFilter("all");
                    setSelectedToilet(null);
                    setFlyTarget({ lat: b.lat, lng: b.lng, zoom: 18 });
                  },
                }}
              >
                <Popup>
                  <div className="min-w-[200px] p-3">
                    <p className="font-bold text-slate-800 text-sm mb-1" style={{ fontFamily: "DM Sans, sans-serif" }}>
                      {b.name}
                    </p>
                    <p className="text-xs text-slate-500 mb-2">
                      {b.floors} floor • {stats?.totalToilets} API location
                    </p>
                    <div className="grid grid-cols-2 gap-1.5 text-xs mb-3">
                      <div className="bg-slate-50 rounded p-1.5">
                        <p className="text-slate-400">Avg THI</p>
                        <p className="font-mono font-bold" style={{ color: thiColor(stats?.avgThi ?? 0) }}>
                          {stats?.avgThi}
                        </p>
                      </div>
                      <div className="bg-slate-50 rounded p-1.5">
                        <p className="text-slate-400">Complaints</p>
                        <p className="font-mono font-bold text-slate-800">{stats?.openComplaints}</p>
                      </div>
                    </div>
                    {stats?.highestRisk && (
                      <p className="text-xs text-red-600 mb-2">
                        Highest risk: {stats.highestRisk.label} • THI {stats.highestRisk.thiScore}
                      </p>
                    )}
                    <button
                      onClick={() => {
                        setSelectedBuilding(b);
                        setFloorFilter("all");
                      }}
                      className="w-full py-1.5 bg-[#1E3A5F] text-white text-xs rounded font-medium"
                    >
                      View toilets
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Toilet markers for selected building / floor filter */}
          {buildingToilets.map((t) => (
            <Marker
              key={t.id}
              position={[t.lat, t.lng]}
              icon={makeCircleIcon(thiColor(t.thiScore), 12)}
              eventHandlers={{
                click: () => setSelectedToilet(t),
              }}
            />
          ))}

        </MapContainer>

        {/* Map legend */}
        <div className="absolute bottom-4 left-4 z-[1000] bg-[#1E3A5F] text-white rounded-lg px-3 py-2 space-y-1 shadow-lg">
          <p className="text-[10px] font-mono text-blue-200 uppercase tracking-widest mb-1">Legend</p>
          {[
            { color: "#16A34A", label: "Good (≥75)" },
            { color: "#CA8A04", label: "Needs attention (50–74)" },
            { color: "#DC2626", label: "Cleaning required (<50)" },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ background: color }}
              />
              <span className="text-xs text-blue-100">{label}</span>
            </div>
          ))}
        </div>

        {/* Cleanest panel */}
        {showCleanest && (
          <div className="absolute top-4 right-4 z-[1000] bg-white rounded-xl shadow-xl w-64 overflow-hidden">
            <div className="bg-green-700 text-white px-3 py-2">
              <p className="font-semibold text-sm" style={{ fontFamily: "DM Sans, sans-serif" }}>
                Best Available
              </p>
              <p className="text-green-200 text-xs">Sorted by health score</p>
            </div>
            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
              {cleanest.map((t, i) => (
                <button
                  key={t.id}
                  onClick={() => navigate(`/toilet/${t.id}`)}
                  className="w-full px-3 py-2.5 text-left hover:bg-slate-50 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      {i === 0 && (
                        <span className="text-[9px] font-mono text-green-700 uppercase tracking-widest">
                          Top pick
                        </span>
                      )}
                      <p className="font-medium text-slate-800 text-xs truncate">{t.buildingName}</p>
                      <p className="text-[11px] text-slate-500">{t.label}</p>
                      <p className="text-[10px] text-slate-400">
                        Cleaned {timeAgo(t.lastCleaned)}
                      </p>
                    </div>
                    <ThiBadge thi={t.thiScore} size="sm" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Toilet popup card */}
        {selectedToilet && (
          <div className="absolute bottom-16 left-4 right-4 z-[1000] bg-white rounded-xl shadow-xl overflow-hidden max-w-sm mx-auto">
            <div className="flex items-start justify-between px-4 pt-3 pb-2">
              <div>
                <p className="font-bold text-slate-800 text-sm" style={{ fontFamily: "DM Sans, sans-serif" }}>
                  {selectedToilet.buildingName}
                </p>
                <p className="text-xs text-slate-500">{selectedToilet.label}</p>
              </div>
              <button
                onClick={() => setSelectedToilet(null)}
                className="text-slate-400 hover:text-slate-600 ml-2 mt-0.5"
              >
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="px-4 pb-3">
              <div className="flex items-center gap-3 mb-3">
                <ThiBadge thi={selectedToilet.thiScore} />
                <span className="text-xs text-slate-400 font-mono">
                  Predicted 3h: {selectedToilet.predictedThi}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs text-center mb-3">
                <div className="bg-slate-50 rounded p-1.5">
                  <p className="text-slate-400">Complaints</p>
                  <p className="font-mono font-bold text-slate-800">{selectedToilet.complaints}</p>
                </div>
                <div className="bg-slate-50 rounded p-1.5">
                  <p className="text-slate-400">Footfall</p>
                  <p className="font-mono font-bold text-slate-800">{selectedToilet.footfall}</p>
                </div>
                <div className="bg-slate-50 rounded p-1.5">
                  <p className="text-slate-400">Cleaned</p>
                  <p className="font-mono font-bold text-slate-800">
                    {timeAgo(selectedToilet.lastCleaned)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate(`/toilet/${selectedToilet.id}`)}
                className="w-full py-2 bg-[#1E3A5F] text-white text-sm rounded-lg font-medium"
              >
                View toilet
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Building sidebar panel (slides up from bottom) */}
      {selectedBuilding && !selectedToilet && (
        <div className="bg-white border-t border-slate-200 flex-shrink-0 max-h-72 overflow-y-auto">
          <div className="px-4 py-3 border-b border-slate-100">
            <div className="flex items-start justify-between">
              <div>
                <h2
                  className="font-bold text-slate-800"
                  style={{ fontFamily: "DM Sans, sans-serif" }}
                >
                  {selectedBuilding.name}
                </h2>
                <p className="text-xs text-slate-500">
                  {selectedBuilding.floors} floor • {stats?.totalToilets} API location
                </p>
              </div>
              <button
                onClick={() => setSelectedBuilding(null)}
                className="text-slate-400 hover:text-slate-600 mt-0.5"
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Stats row */}
            <div className="flex gap-3 mt-2">
              <div className="text-xs">
                <p className="text-slate-400">Avg THI</p>
                <p
                  className="font-mono font-bold"
                  style={{ color: thiColor(stats?.avgThi ?? 0) }}
                >
                  {stats?.avgThi}
                </p>
              </div>
              <div className="text-xs">
                <p className="text-slate-400">Complaints</p>
                <p className="font-mono font-bold text-slate-800">{stats?.openComplaints}</p>
              </div>
              <div className="text-xs">
                <p className="text-slate-400">Worst THI</p>
                <p
                  className="font-mono font-bold"
                  style={{ color: thiColor(stats?.worstThi ?? 0) }}
                >
                  {stats?.worstThi}
                </p>
              </div>
            </div>

            {/* Floor filter */}
            <div className="flex gap-1.5 mt-2 flex-wrap">
              <button
                onClick={() => setFloorFilter("all")}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${
                  floorFilter === "all"
                    ? "bg-[#1E3A5F] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                All Floors
              </button>
              {buildingFloors.map((f) => (
                <button
                  key={f}
                  onClick={() => setFloorFilter(f)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${
                    floorFilter === f
                      ? "bg-[#1E3A5F] text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Floor {f}
                </button>
              ))}
            </div>
          </div>

          {/* Toilet list for selected building */}
          <div className="divide-y divide-slate-50">
            {buildingToilets.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedToilet(t)}
                className="w-full px-4 py-2.5 flex items-center gap-3 text-left hover:bg-slate-50 transition"
              >
                <span
                  className="w-2 h-8 rounded-full flex-shrink-0"
                  style={{ background: thiColor(t.thiScore) }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800">{t.label}</p>
                  <p className="text-xs text-slate-400 capitalize">{t.gender} • {t.priority}</p>
                </div>
                <ThiBadge thi={t.thiScore} size="sm" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
