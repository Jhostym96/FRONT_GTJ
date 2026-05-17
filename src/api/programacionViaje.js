import axios from "./axios";

export const getProgramacionesViajeRequest = () =>
  axios.get("/programacion-viaje");

export const getProgramacionViajeRequest = (id) =>
  axios.get(`/programacion-viaje/${id}`);

export const createProgramacionViajeRequest = (programacion) =>
  axios.post("/programacion-viaje", programacion);

export const updateEstadoProgramacionViajeRequest = (id, data) =>
  axios.patch(
    `/programacion-viaje/${id}/estado`,
    typeof data === "string" ? { estado: data } : data
  );

export const getOrdenesDisponiblesParaViajeRequest = () =>
  axios.get("/programacion-viaje/ordenes-disponibles");

export const getProgramacionesDisponiblesParaGuiaRequest = () =>
  axios.get("/programacion-viaje/disponibles-para-guia");
