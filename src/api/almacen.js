import axios from "./axios";

export const obtenerItemsAlmacenRequest = (params = {}) =>
  axios.get("/almacen", { params });

export const crearItemAlmacenRequest = (data) =>
  axios.post("/almacen", data);

export const actualizarItemAlmacenRequest = (id, data) =>
  axios.put(`/almacen/${id}`, data);

export const cambiarEstadoItemAlmacenRequest = (id, estado) =>
  axios.patch(`/almacen/${id}/estado`, { estado });

export const registrarMovimientoAlmacenRequest = (id, data) =>
  axios.post(`/almacen/${id}/movimientos`, data);

export const obtenerMovimientosAlmacenRequest = (id, params = {}) =>
  axios.get(`/almacen/${id}/movimientos`, { params });
