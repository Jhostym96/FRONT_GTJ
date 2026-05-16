// src/api/auth.js
import axios from "./axios";

export const registerRequest = (user) =>
  axios.post("/v2/register", user, { withCredentials: true });

export const loginRequest = (user) =>
  axios.post("/v2/login", user, { withCredentials: true });

// Verificar sesión con el access token (ya va en headers desde axios.defaults)
export const verifyTokenRequest = () =>
  axios.get("/v2/verify");

// Pedir un access token nuevo usando la cookie de refresh
export const refreshTokenRequest = () =>
  axios.get("/v2/refresh", { withCredentials: true });

export const logoutRequest = () =>
  axios.post("/v2/logout", {}, { withCredentials: true });
