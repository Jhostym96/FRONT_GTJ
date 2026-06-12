import axios from "./axios";

export const obtenerDocumentosFacturacionRequest = (params = {}) =>
  axios.get("/documentos-facturacion", { params });

export const entregarDocumentoFacturacionRequest = (guiaId, data = {}) =>
  axios.patch(`/documentos-facturacion/${guiaId}/entregar`, data);

export const recepcionarDocumentoFacturacionRequest = (guiaId, data = {}) =>
  axios.patch(`/documentos-facturacion/${guiaId}/recepcionar`, data);

export const entregarDocumentoFacturacionSunatRequest = (
  programacionId,
  data = {}
) => axios.patch(`/documentos-facturacion/sunat/${programacionId}/entregar`, data);

export const recepcionarDocumentoFacturacionSunatRequest = (
  programacionId,
  data = {}
) =>
  axios.patch(
    `/documentos-facturacion/sunat/${programacionId}/recepcionar`,
    data
  );
