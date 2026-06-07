import axios from "./axios";

export const listarCorrelativosRequest = (params = {}) =>
  axios.get("/correlativos", { params });

export const actualizarCorrelativoRequest = (tipo, data) =>
  axios.put(`/correlativos/${tipo}`, data);

