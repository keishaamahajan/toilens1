import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from "react";
import { loadCampusData, type ApiRoute } from "../api/client";
import { locationsToBuildings, locationsToToilets, type CampusBuilding, type ToiletRecord } from "../data/campusData";

export interface AppState { toilets: ToiletRecord[]; routes: ApiRoute[]; loading: boolean; error: string | null; }
type Action =
  | { type: "LOAD_SUCCESS"; toilets: ToiletRecord[]; routes: ApiRoute[] }
  | { type: "LOAD_ERROR"; error: string }
  | { type: "SUBMIT_COMPLAINT"; toiletId: string }
  | { type: "MARK_CLEANED"; toiletId: string }
  | { type: "UPDATE_THI"; toiletId: string; thi: number };

const initialState: AppState = { toilets: [], routes: [], loading: true, error: null };
function thiToPriority(thi: number): ToiletRecord["priority"] { return thi >= 75 ? "OK" : thi >= 50 ? "Monitor" : "Urgent"; }
function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "LOAD_SUCCESS": return { toilets: action.toilets, routes: action.routes, loading: false, error: null };
    case "LOAD_ERROR": return { ...state, loading: false, error: action.error };
    case "SUBMIT_COMPLAINT": return { ...state, toilets: state.toilets.map((t) => t.id === action.toiletId ? { ...t, complaints: t.complaints + 1, thiScore: Math.max(20, t.thiScore - 5), predictedThi: Math.max(15, t.predictedThi - 8), priority: thiToPriority(Math.max(20, t.thiScore - 5)) } : t) };
    case "MARK_CLEANED": return { ...state, toilets: state.toilets.map((t) => t.id === action.toiletId ? { ...t, lastCleaned: new Date().toISOString(), complaints: 0, thiScore: Math.min(95, t.thiScore + 20), predictedThi: Math.min(90, t.predictedThi + 20), priority: thiToPriority(Math.min(95, t.thiScore + 20)) } : t) };
    case "UPDATE_THI": return { ...state, toilets: state.toilets.map((t) => t.id === action.toiletId ? { ...t, thiScore: action.thi, priority: thiToPriority(action.thi) } : t) };
  }
}

interface AppContextValue {
  state: AppState; dispatch: React.Dispatch<Action>; campusBuildings: CampusBuilding[]; refresh: () => Promise<void>;
  getToiletById: (id: string) => ToiletRecord | undefined; getToiletsForBuilding: (buildingId: string) => ToiletRecord[];
  getBuildingStats: (buildingId: string) => { totalToilets: number; avgThi: number; worstThi: number; openComplaints: number; highestRisk: ToiletRecord | undefined; floors: number };
}
const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [campusBuildings, setCampusBuildings] = React.useState<CampusBuilding[]>([]);
  const refresh = useCallback(async () => {
    try {
      const { locations, routes } = await loadCampusData();
      setCampusBuildings(locationsToBuildings(locations));
      dispatch({ type: "LOAD_SUCCESS", toilets: locationsToToilets(locations), routes });
    } catch (error) { dispatch({ type: "LOAD_ERROR", error: error instanceof Error ? error.message : "Unable to reach the ToiLens API." }); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  const value = useMemo<AppContextValue>(() => {
    const getToiletsForBuilding = (buildingId: string) => state.toilets.filter((t) => t.buildingId === buildingId);
    return { state, dispatch, campusBuildings, refresh, getToiletById: (id) => state.toilets.find((t) => t.id === id), getToiletsForBuilding,
      getBuildingStats: (buildingId) => { const toilets = getToiletsForBuilding(buildingId); const building = campusBuildings.find((b) => b.id === buildingId); return { totalToilets: toilets.length, avgThi: toilets.length ? Math.round(toilets.reduce((sum, t) => sum + t.thiScore, 0) / toilets.length) : 0, worstThi: toilets.length ? Math.min(...toilets.map((t) => t.thiScore)) : 0, openComplaints: toilets.reduce((sum, t) => sum + t.complaints, 0), highestRisk: toilets.slice().sort((a, b) => a.thiScore - b.thiScore)[0], floors: building?.floors ?? 1 }; },
    };
  }, [state, campusBuildings, refresh]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
export function useApp() { const context = useContext(AppContext); if (!context) throw new Error("useApp must be used within AppProvider"); return context; }
