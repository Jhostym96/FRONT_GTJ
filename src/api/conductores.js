import axios from "./axios";

export const getConductoresRequest = (params = {}) =>
  axios.get("/conductores", { params });

export const getConductorRequest = (id) => axios.get(`/conductores/${id}`);

export const createConductorRequest = (conductor) =>
  axios.post("/conductores", conductor);

export const updateConductorRequest = (id, conductor) =>
  axios.put(`/conductores/${id}`, conductor);

export const cambiarEstadoConductorRequest = (id, estado) =>
  axios.patch(`/conductores/${id}/estado`, { estado });

export const deleteConductorRequest = (id) =>
  axios.delete(`/conductores/${id}`);
