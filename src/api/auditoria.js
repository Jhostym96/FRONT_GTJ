import axios from "./axios";

export const obtenerAuditoriaRequest = (params = {}) =>
  axios.get("/auditoria", { params });
