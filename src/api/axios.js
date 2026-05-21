import axios from "axios";
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from "./tokenStore";

let refreshPromise = null;

// Instancia principal de Axios
const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
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

    const authEndpoints = [
      "/v2/login",
      "/v2/register",
      "/v2/verify",
      "/v2/refresh",
      "/v2/logout",
    ];
    const isAuthEndpoint = authEndpoints.some((endpoint) =>
      originalRequest?.url?.includes(endpoint)
    );

    if (!originalRequest || isAuthEndpoint) {
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
        const newAccessToken = res.data.accessToken;

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
