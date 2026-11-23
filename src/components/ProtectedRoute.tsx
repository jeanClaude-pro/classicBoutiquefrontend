import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

// Unused legacy wrapper (routes use RequireAuth); kept server-driven.
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { signedIn: isAuthenticated } = useAuth();

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
