// ProtectedRoute.jsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { canAccess } from "./utils/permissions";

function ProtectedRoute() {
  const { loading, isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        ⏳ Verificando sesión...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 👇 Siempre permitir "/" (pantalla de inicio general)
  if (location.pathname === "/") {
    return <Outlet />;
  }

  // 👇 Validar si el usuario puede acceder a esta ruta
  if (!canAccess(user, location.pathname)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
