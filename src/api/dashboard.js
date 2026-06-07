import axios from "./axios";

export const obtenerResumenDashboardRequest = () =>
  axios.get("/dashboard/resumen");
