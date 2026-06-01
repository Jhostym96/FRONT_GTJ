import axios from "./axios";

export const obtenerEmpresaConfigRequest = () =>
  axios.get("/empresa-config");

export const actualizarEmpresaConfigRequest = (data) =>
  axios.put("/empresa-config", data);
