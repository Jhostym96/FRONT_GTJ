import { useCallback, useEffect, useState, useContext, useMemo } from "react";
import { createContext } from "react";
import {
  loginRequest,
  registerRequest,
  refreshTokenRequest,
  verifyTokenRequest,
  logoutRequest,
} from "../api/auth";
import axios from "../api/axios";
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from "../api/tokenStore";
import { notify } from "../utils/notify";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🧹 Limpiar errores después de 2 seg
  useEffect(() => {
    if (errors.length > 0) {
      const timer = setTimeout(() => setErrors([]), 2000);
      return () => clearTimeout(timer);
    }
  }, [errors]);

  // 📌 Normalizador de errores
  const normalizeError = useCallback((error, fallback) => {
    const err = error.response?.data;
    return Array.isArray(err) ? err[0] : err?.message || fallback;
  }, []);

  // REGISTRO
  const signup = useCallback(async (formData) => {
    try {
      const res = await registerRequest(formData);
      const { accessToken, user: userData } = res.data;

      setUser(userData);
      setIsAuthenticated(true);

      if (accessToken) {
        setAccessToken(accessToken);
        axios.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
      }

      notify.success("Usuario registrado con éxito");
    } catch (error) {
      const msg = normalizeError(error, "Error al registrarse");
      setErrors([msg]);
      notify.error(msg);
    }
  }, [normalizeError]);

  // LOGIN
  const signin = useCallback(async (formData) => {
    try {
      const res = await loginRequest(formData);
      const { accessToken, user: userData } = res.data;

      setUser(userData);
      setIsAuthenticated(true);

      if (accessToken) {
        setAccessToken(accessToken);
        axios.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
      }

      notify.success("¡Bienvenido!");
    } catch (error) {
      const msg = normalizeError(error, "Error al iniciar sesión");
      setErrors([msg]);
      notify.error(msg);
    }
  }, [normalizeError]);

  // LOGOUT
  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    } finally {
      clearAccessToken();
      delete axios.defaults.headers.common["Authorization"];
      setUser(null);
      setIsAuthenticated(false);
      toast("Sesión cerrada", { icon: "👋" });
    }
  }, []);

  // 🔐 Verificar sesión al montar
  useEffect(() => {
    const checkLogin = async () => {
      let token = getAccessToken();

      if (!token) {
        try {
          const refreshRes = await refreshTokenRequest();
          token = refreshRes.data?.accessToken;

          if (token) {
            setAccessToken(token);
            axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
          }
        } catch {
          clearAccessToken();
          setUser(null);
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }
      }

      try {
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        const res = await verifyTokenRequest();
        setUser(res.data);
        setIsAuthenticated(true);
      } catch {
        clearAccessToken();
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    checkLogin();
  }, []);

  // 🔔 Escuchar expiración de sesión
  useEffect(() => {
    const handleSessionExpired = () => {
      setUser(null);
      setIsAuthenticated(false);
      clearAccessToken();
      delete axios.defaults.headers.common["Authorization"];
      notify.error("Tu sesión ha expirado. Vuelve a iniciar sesión.");
    };

    window.addEventListener("sessionExpired", handleSessionExpired);
    return () =>
      window.removeEventListener("sessionExpired", handleSessionExpired);
  }, []);

  const value = useMemo(
    () => ({
      user,
      signup,
      signin,
      logout,
      isAuthenticated,
      errors,
      loading,
    }),
    [user, signup, signin, logout, isAuthenticated, errors, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
