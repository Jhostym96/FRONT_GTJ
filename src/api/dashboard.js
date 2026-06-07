import axios from "./axios";

export const obtenerResumenDashboardRequest = () =>
  axios.get("/dashboard/resumen");

export const obtenerSaludSistemaRequest = () =>
  axios.get("/dashboard/salud", { params: { _t: Date.now() } });
