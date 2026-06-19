import axios from "./axios";

// Crear orden de servicio
export const crearOrdenServicioRequest = (orden) =>
  axios.post(`/ordenes-servicio`, orden);

// Obtener todas las órdenes de servicio
export const obtenerOrdenesServicioRequest = (params = {}) =>
  axios.get(`/ordenes-servicio`, { params });

// Obtener orden de servicio por ID
export const obtenerOrdenServicioRequest = (id) =>
  axios.get(`/ordenes-servicio/${id}`);

// Actualizar orden de servicio por ID
export const actualizarOrdenServicioRequest = (id, datos) =>
  axios.put(`/ordenes-servicio/${id}`, datos);

// Anular orden de servicio
export const anularOrdenServicioRequest = (id) =>
  axios.patch(`/ordenes-servicio/${id}/anular`);

export const obtenerDevolucionesPendientesRequest = (params = {}) =>
  axios.get(`/ordenes-servicio/devoluciones/pendientes`, { params });

export const obtenerProgramacionDevolucionesRequest = (params = {}) =>
  axios.get(`/ordenes-servicio/devoluciones/programacion`, { params });

export const actualizarEstadoDevolucionRequest = (id, data) =>
  axios.patch(`/ordenes-servicio/devoluciones/${id}`, data);
