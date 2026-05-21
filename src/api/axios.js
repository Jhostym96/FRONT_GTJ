import axios from "axios";
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from "./tokenStore";

let refreshPromise = null;
const apiBaseUrl = import.meta.env.VITE_API_URL;
const authRefreshExcludedPaths = [
  "/v2/login",
  "/v2/register",
  "/v2/verify",
  "/v2/refresh",
  "/v2/logout",
];

const isAuthRefreshExcluded = (url = "") =>
  authRefreshExcludedPaths.some((path) => url.includes(path));

if (!apiBaseUrl) {
  throw new Error("Falta configurar VITE_API_URL en el entorno del frontend");
}

// Instancia principal de Axios
const instance = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
});

// 🔹 Interceptor de request: agrega token
instance.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 🔹 Interceptor de respuesta: refresh automático
instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest || isAuthRefreshExcluded(originalRequest.url)) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        if (!refreshPromise) {
          refreshPromise = instance
            .get("/v2/refresh", { withCredentials: true })
            .finally(() => {
              refreshPromise = null;
            });
        }

        const res = await refreshPromise;
        const newAccessToken = res.data?.accessToken;

        if (!newAccessToken) {
          throw new Error("No se recibió access token al refrescar la sesión");
        }

        setAccessToken(newAccessToken);

        instance.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${newAccessToken}`;
        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;

        return instance(originalRequest);
      } catch (err) {
        clearAccessToken();
        delete instance.defaults.headers.common["Authorization"];
        window.dispatchEvent(new Event("sessionExpired"));
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default instance;
