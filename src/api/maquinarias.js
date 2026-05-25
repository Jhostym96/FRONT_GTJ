import axios from "./axios";

export const crearMaquinariaRequest = (maquinaria) =>
  axios.post("/maquinarias", maquinaria);

export const obtenerMaquinariasRequest = (params = {}) =>
  axios.get("/maquinarias", { params });

export const obtenerMaquinariaRequest = (id) =>
  axios.get(`/maquinarias/${id}`);

export const actualizarMaquinariaRequest = (id, datos) =>
  axios.put(`/maquinarias/${id}`, datos);

export const cambiarEstadoMaquinariaRequest = (id, estado) =>
  axios.patch(`/maquinarias/${id}/estado`, { estado });

export const eliminarMaquinariaRequest = (id) =>
  axios.delete(`/maquinarias/${id}`);
