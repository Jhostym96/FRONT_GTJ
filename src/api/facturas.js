import axios from "./axios";

export const obtenerOrdenesFacturasRequest = (params = {}) =>
  axios.get("/facturas/ordenes", { params });

export const actualizarPrecioUnitarioFacturacionRequest = (id, data = {}) =>
  axios.patch(`/facturas/ordenes/${id}/precio-unitario`, data);

export const emitirFacturaNubefactRequest = (id, data = {}) =>
  axios.post(`/facturas/ordenes/${id}/emitir-nubefact`, data);

export const emitirFacturasSeleccionadasNubefactRequest = (data = {}) =>
  axios.post("/facturas/emitir-nubefact", data);
