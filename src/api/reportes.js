import axios from "./axios";

export const obtenerReporteServiciosRequest = (params = {}) =>
  axios.get("/reportes/servicios/excel", {
    params,
    responseType: "blob",
  });

export const obtenerReporteServicioDetalleRequest = (id) =>
  axios.get(`/programacion-viaje/${id}`);
