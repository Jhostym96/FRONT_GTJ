import axios from "./axios";

export const obtenerWhatsappStatusRequest = () =>
  axios.get("/whatsapp/status", { params: { _t: Date.now() } });

export const listarWhatsappGruposRequest = () =>
  axios.get("/whatsapp/groups", { params: { _t: Date.now() } });

export const enviarWhatsappPruebaRequest = (data) =>
  axios.post("/whatsapp/test-text", data);

export const enviarAlertaDocumentacionWhatsappRequest = () =>
  axios.post("/whatsapp/alertas/documentacion");

export const enviarAlertaContenedoresWhatsappRequest = () =>
  axios.post("/whatsapp/alertas/contenedores");
