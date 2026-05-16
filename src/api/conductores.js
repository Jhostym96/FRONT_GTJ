import axios from "./axios";

export const getConductoresRequest = () => axios.get("/conductores");

export const getConductorRequest = (id) => axios.get(`/conductores/${id}`);

export const createConductorRequest = (conductor) =>
  axios.post("/conductores", conductor);

export const updateConductorRequest = (id, conductor) =>
  axios.put(`/conductores/${id}`, conductor);