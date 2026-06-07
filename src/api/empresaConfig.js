import axios from "./axios";

export const obtenerEmpresaConfigRequest = () =>
  axios.get("/empresa-config", { params: { _t: Date.now() } });

export const actualizarEmpresaConfigRequest = (data) =>
  axios.put("/empresa-config", data);
