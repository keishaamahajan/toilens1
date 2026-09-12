const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");

export interface ApiLocation {
  id: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  description: string;
}

export interface ApiRoute {
  id: string;
  from: string;
  to: string;
  distanceMeters: number;
  estimatedMinutes?: number;
  waypoints: [number, number][];
}

async function get<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`Could not load ${path} (${response.status}).`);
  return response.json() as Promise<T>;
}

export function loadCampusData(signal?: AbortSignal) {
  return Promise.all([get<ApiLocation[]>("/locations", signal), get<ApiRoute[]>("/routes", signal)]).then(
    ([locations, routes]) => ({ locations, routes }),
  );
}

export { API_URL };
