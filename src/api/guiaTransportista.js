// src/api/guiaTransportista.js

import axios from "./axios";

// Crear guía de transportista
export const crearGuiaTransportistaRequest = (guia) =>
  axios.post("/guia-transportista", guia);

// Validar guía antes de emitir
export const validarGuiaTransportistaRequest = (guia) =>
  axios.post("/guia-transportista/validar", guia);

// Obtener todas las guías de transportista
export const obtenerGuiasTransportistaRequest = () =>
  axios.get("/guia-transportista");

// Obtener guía de transportista por ID
export const obtenerGuiaTransportistaRequest = (id) =>
  axios.get(`/guia-transportista/${id}`);

// Obtener historial de auditoría e intentos Nubefact
export const obtenerHistorialGuiaTransportistaRequest = (id) =>
  axios.get(`/guia-transportista/${id}/historial`);

// Generar JSON de guía de transportista
export const generarJsonGuiaTransportistaRequest = (id) =>
  axios.post(`/guia-transportista/${id}/generar-json`);

// Consultar guía en Nubefact / SUNAT
export const consultarGuiaTransportistaRequest = (id) =>
  axios.post(`/guia-transportista/${id}/consultar`);

// Obtener URL del PDF oficial de Nubefact
export const obtenerUrlTicketGuiaTransportistaRequest = (id) =>
  axios.get(`/guia-transportista/${id}/ticket-url`);

// Obtener PDF oficial de Nubefact como archivo
export const obtenerPdfOficialGuiaTransportistaRequest = (id) =>
  axios.get(`/guia-transportista/${id}/pdf`, {
    responseType: "blob",
  });

// Actualizar guía de transportista por ID
export const actualizarGuiaTransportistaRequest = (id, datos) =>
  axios.put(`/guia-transportista/${id}`, datos);

// Anular guía de transportista
export const anularGuiaTransportistaRequest = (id, datos = {}) =>
  axios.patch(`/guia-transportista/${id}/anular`, datos);
