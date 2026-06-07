import axios from "./axios";

export const obtenerOrdenesFacturacionRequest = (params = {}) =>
  axios.get("/facturacion", { params });

export const registrarFacturacionOrdenRequest = (id, data) =>
  axios.patch(`/facturacion/ordenes/${id}`, data);

export const marcarPagoOrdenRequest = (id, data = {}) =>
  axios.patch(`/facturacion/ordenes/${id}/pago`, data);
