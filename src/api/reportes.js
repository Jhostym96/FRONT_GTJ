import axios from "./axios";

export const obtenerReporteServiciosRequest = (params = {}) =>
  axios.get("/programacion-viaje", { params });

export const obtenerReporteServicioDetalleRequest = (id) =>
  axios.get(`/programacion-viaje/${id}`);
