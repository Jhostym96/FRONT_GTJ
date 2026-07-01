import axios from "./axios";

export const getDocumentosOperativosRequest = (params = {}) =>
  axios.get("/documentacion", { params });

export const getResumenDocumentacionRequest = (params = {}) =>
  axios.get("/documentacion/resumen", { params });

export const getTiposDocumentacionRequest = (params = {}) =>
  axios.get("/documentacion/tipos", { params });

export const getDocumentoOperativoRequest = (id) =>
  axios.get(`/documentacion/${id}`);

export const createDocumentoOperativoRequest = (data) =>
  axios.post("/documentacion", data);

export const importDocumentosOperativosRequest = (documentos) =>
  axios.post("/documentacion/importar", { documentos });

export const updateDocumentoOperativoRequest = (id, data) =>
  axios.put(`/documentacion/${id}`, data);

export const archiveDocumentoOperativoRequest = (id) =>
  axios.delete(`/documentacion/${id}`);

export const createTipoDocumentacionRequest = (data) =>
  axios.post("/documentacion/tipos", data);

export const updateTipoDocumentacionRequest = (id, data) =>
  axios.put(`/documentacion/tipos/${id}`, data);

export const cambiarEstadoTipoDocumentacionRequest = (id, activo) =>
  axios.patch(`/documentacion/tipos/${id}/estado`, { activo });
