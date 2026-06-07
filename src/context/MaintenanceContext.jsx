import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  actualizarEmpresaConfigRequest,
  obtenerEmpresaConfigRequest,
} from "../api/empresaConfig";
import { useAuth } from "./AuthContext";

const MaintenanceContext = createContext();
const CHANNEL_NAME = "tj-maintenance-mode";

const envMaintenanceEnabled =
  String(import.meta.env.VITE_MAINTENANCE_MODE || "").toLowerCase() === "true";

export const useMaintenance = () => {
  const context = useContext(MaintenanceContext);
  if (!context) {
    throw new Error("useMaintenance must be used within a MaintenanceProvider");
  }
  return context;
};

export function MaintenanceProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [backendEnabled, setBackendEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  const enabled = envMaintenanceEnabled || backendEnabled;
  const forcedByEnv = envMaintenanceEnabled;

  const refresh = useCallback(async ({ silent = false } = {}) => {
    if (!isAuthenticated) {
      setBackendEnabled(false);
      setLoading(false);
      return;
    }

    try {
      if (!silent) setLoading(true);
      const res = await obtenerEmpresaConfigRequest();
      const config = res.data?.config || res.data?.empresa || {};
      setBackendEnabled(Boolean(config.modoMantenimiento));
    } catch (error) {
      console.error("No se pudo consultar el modo mantenimiento:", error);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [isAuthenticated]);

  const setEnabled = useCallback(async (nextEnabled) => {
    if (forcedByEnv) return;

    const value = Boolean(nextEnabled);
    const res = await actualizarEmpresaConfigRequest({ modoMantenimiento: value });
    const config = res.data?.config || res.data?.empresa || {};
    setBackendEnabled(Boolean(config.modoMantenimiento));

    if (typeof window === "undefined") return;
    if ("BroadcastChannel" in window) {
      const channel = new BroadcastChannel(CHANNEL_NAME);
      channel.postMessage({ enabled: value });
      channel.close();
    }
  }, [forcedByEnv]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!isAuthenticated || typeof window === "undefined") return undefined;

    const handleFocus = () => refresh({ silent: true });
    const interval = window.setInterval(() => refresh({ silent: true }), 15000);

    window.addEventListener("focus", handleFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [isAuthenticated, refresh]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    let channel;
    if ("BroadcastChannel" in window) {
      channel = new BroadcastChannel(CHANNEL_NAME);
      channel.onmessage = (event) => {
        setBackendEnabled(Boolean(event.data?.enabled));
      };
    }

    return () => {
      channel?.close();
    };
  }, []);

  const value = useMemo(
    () => ({
      enabled,
      forcedByEnv,
      loading,
      refresh,
      setEnabled,
    }),
    [enabled, forcedByEnv, loading, refresh, setEnabled]
  );

  return (
    <MaintenanceContext.Provider value={value}>
      {children}
    </MaintenanceContext.Provider>
  );
}
