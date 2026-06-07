// ProtectedRoute.jsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { useMaintenance } from "./context/MaintenanceContext";
import MaintenancePage from "./pages/MaintenancePage";
import { canAccess, isAdminUser } from "./utils/permissions";

function ProtectedRoute() {
  const { loading, isAuthenticated, user } = useAuth();
  const { enabled: maintenanceEnabled, loading: maintenanceLoading } = useMaintenance();
  const location = useLocation();

  if (loading || (isAuthenticated && maintenanceLoading)) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        ⏳ Verificando sesión...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (maintenanceEnabled && !isAdminUser(user)) {
    return <MaintenancePage />;
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
