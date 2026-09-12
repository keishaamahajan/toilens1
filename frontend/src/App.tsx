import { HashRouter, Routes, Route } from "react-router-dom";
import { AppProvider, useApp } from "./store/AppContext";
import BottomNav from "./components/BottomNav";
import CitizenHome from "./pages/CitizenHome";
import MapPage from "./pages/MapPage";
import ReportPage from "./pages/ReportPage";
import AuthorityDashboard from "./pages/AuthorityDashboard";
import ToiletProfile from "./pages/ToiletProfile";

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<WithNav><CitizenHome /></WithNav>} />
          <Route path="/map" element={<WithNav><MapPage /></WithNav>} />
          <Route path="/report" element={<WithNav><ReportPage /></WithNav>} />
          <Route path="/authority" element={<WithNav><AuthorityDashboard /></WithNav>} />
          <Route path="/toilet/:id" element={<WithNav><ToiletProfile /></WithNav>} />
        </Routes>
      </HashRouter>
    </AppProvider>
  );
}

function WithNav({ children }: { children: React.ReactNode }) {
  const { state, refresh } = useApp();
  return (
    <>
      {state.loading && <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/20 text-sm text-slate-700">Loading campus data…</div>}
      {state.error && <div className="fixed left-3 right-3 top-3 z-[101] flex items-center justify-between gap-3 rounded-lg bg-red-700 px-3 py-2 text-sm text-white"><span>{state.error}</span><button onClick={() => void refresh()} className="rounded bg-white/20 px-2 py-1">Retry</button></div>}
      {children}
      <BottomNav />
    </>
  );
}
