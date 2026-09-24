"use client";

import { lazy, Suspense } from "react";

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Sidebar from "./components/Sidebar";
import LoginPage from "./pages/login/page";
import MobileNavigation from "./components/MobileNavigation";
import NetworkStatus from "./components/NetworkStatus";
import { RequireAuth } from "./components/RequireAuth";
import { AuthProvider } from "./context/AuthProvider";
import { RequireRole } from "./components/RequireRole";
import { useAuth } from "./hooks/useAuth";
import { AppErrorBoundary } from "./components/AppErrorBoundary";

const Products = lazy(() => import("./pages/products/products"));
const SalesHistory = lazy(() => import("./pages/history/SalesHistory"));
const Analytics = lazy(() => import("./pages/analytics/Analytics"));
const Customers = lazy(() => import("./pages/customers/Customers"));
const NewSale = lazy(() => import("./pages/NewSale"));
const Reservation = lazy(() => import("./pages/Reservation"));
const ReservationHistory = lazy(() => import("./pages/ReservationHistory"));
const Sortie = lazy(() => import("./pages/Sortie"));
const SortieHistory = lazy(() => import("./pages/SortieHistory"));
const Rate = lazy(() => import("./pages/Rate"));
const Entry = lazy(() => import("./pages/Entry"));
const EntryHistory = lazy(() => import("./pages/EntryHistory"));
const AdminPanel = lazy(() => import("./pages/admin/AdminPanel"));
const Remboursements = lazy(() => import("./pages/Remboursements"));

function RouteLoading() {
  return <div className="route-loading" role="status" aria-live="polite"><span className="route-loading-spinner" /><span>Chargement…</span></div>;
}

function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isLogin = location.pathname === "/login";

  return (
    <div className="app-shell overflow-hidden flex bg-background text-slate-900">
      {!isLogin && <Sidebar />}
      <main className="app-main flex-1 min-w-0 overflow-y-auto overflow-x-hidden">
        {!isLogin && <NetworkStatus />}
        <div className="app-content min-h-full min-w-0">
          {/* A page that fails to render (or whose chunk is outdated) shows a
              fallback here while the navigation stays usable. */}
          <AppErrorBoundary scope="page" resetKey={location.pathname}>{children}</AppErrorBoundary>
        </div>
      </main>
      {!isLogin && <MobileNavigation />}
    </div>
  );
}

function LoginRoute() {
  const { token, user, loading } = useAuth();
  if (loading) return <RouteLoading />;
  if (!token) return <LoginPage />;
  const destination = user?.role === "admin"
    ? (user.permissions?.find((path) => ["/sales", "/reports", "/products"].includes(path)) || "/sales")
    : "/";
  return <Navigate to={destination} replace />;
}

export default function App() {
  return (
    <AppErrorBoundary scope="app">
    <AuthProvider>
      <ToastContainer position="top-right" autoClose={3000} newestOnTop />

      <Router>
        <AppLayout>
          <Suspense fallback={<RouteLoading />}><Routes>
                <Route
                  path="/products"
                  element={
                    <RequireAuth>
                      <Products />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/new-sale"
                  element={
                    <RequireAuth>
                      <NewSale />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/entry"
                  element={
                    <RequireAuth>
                      <Entry />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/entryhistory"
                  element={
                    <RequireAuth>
                      <EntryHistory />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/rate"
                  element={
                    <RequireAuth>
                      <Rate />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/sortie"
                  element={
                    <RequireAuth>
                      <Sortie />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/reservation"
                  element={
                    <RequireAuth>
                      <Reservation />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/reservationhistory"
                  element={
                    <RequireAuth>
                      <ReservationHistory />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/sortiehistory"
                  element={
                    <RequireAuth>
                      <SortieHistory />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/"
                  element={
                    <RequireAuth>
                      <NewSale />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/sales"
                  element={
                    <RequireAuth>
                      <SalesHistory />
                    </RequireAuth>
                  }
                />
                
                <Route
                  path="/reports"
                  element={
                    <RequireAuth>
                      <Analytics />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/customers"
                  element={
                    <RequireAuth>
                      <Customers />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/remboursements"
                  element={<RequireAuth><RequireRole roles={["superadmin"]}><Remboursements /></RequireRole></RequireAuth>}
                />
                <Route
                  path="/admin"
                  element={
                    <RequireAuth>
                      <RequireRole roles={["superadmin"]}><AdminPanel /></RequireRole>
                    </RequireAuth>
                  }
                />
                <Route path="/login" element={<LoginRoute />} />
              </Routes></Suspense>
        </AppLayout>
      </Router>
    </AuthProvider>
    </AppErrorBoundary>
  );
}
