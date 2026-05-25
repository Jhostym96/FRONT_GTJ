import axios from "./axios";

export const crearMantenimientoRequest = (data) =>
  axios.post("/mantenimientos", data);

export const obtenerMantenimientosRequest = (params = {}) =>
  axios.get("/mantenimientos", { params });

export const obtenerAlertasMantenimientoRequest = () =>
  axios.get("/mantenimientos/alertas");

export const obtenerMantenimientoRequest = (id) =>
  axios.get(`/mantenimientos/${id}`);

export const actualizarMantenimientoRequest = (id, data) =>
  axios.put(`/mantenimientos/${id}`, data);

export const eliminarMantenimientoRequest = (id) =>
  axios.delete(`/mantenimientos/${id}`);
