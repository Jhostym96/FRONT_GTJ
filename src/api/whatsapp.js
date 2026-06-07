import axios from "./axios";

export const obtenerWhatsappStatusRequest = () =>
  axios.get("/whatsapp/status", { params: { _t: Date.now() } });

export const listarWhatsappGruposRequest = () =>
  axios.get("/whatsapp/groups", { params: { _t: Date.now() } });

export const enviarWhatsappPruebaRequest = (data) =>
  axios.post("/whatsapp/test-text", data);
