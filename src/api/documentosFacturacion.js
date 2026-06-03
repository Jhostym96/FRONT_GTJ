import axios from "./axios";

export const obtenerDocumentosFacturacionRequest = (params = {}) =>
  axios.get("/documentos-facturacion", { params });

export const entregarDocumentoFacturacionRequest = (guiaId, data = {}) =>
  axios.patch(`/documentos-facturacion/${guiaId}/entregar`, data);

export const recepcionarDocumentoFacturacionRequest = (guiaId, data = {}) =>
  axios.patch(`/documentos-facturacion/${guiaId}/recepcionar`, data);
