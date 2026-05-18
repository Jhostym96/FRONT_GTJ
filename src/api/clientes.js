// src/api/clientes.js

import axios from "./axios";

// =========================
// CRUD CLIENTES
// =========================

export const getClientesRequest = (params = {}) =>
  axios.get("/clientes", { params });

export const getClienteRequest = (id) =>
  axios.get(`/clientes/${id}`);

export const createClienteRequest = (cliente) =>
  axios.post("/clientes", cliente);

export const updateClienteRequest = (id, cliente) =>
  axios.put(`/clientes/${id}`, cliente);

export const deleteClienteRequest = (id) =>
  axios.delete(`/clientes/${id}`);


// =========================
// REMITENTES
// =========================

export const getRemitentesByClienteRequest = (clienteId) =>
  axios.get(`/clientes/${clienteId}/remitentes`);

export const addRemitenteRequest = (clienteId, remitente) =>
  axios.post(`/clientes/${clienteId}/remitentes`, remitente);

export const addDireccionRemitenteRequest = (
  clienteId,
  remitenteId,
  direccion
) =>
  axios.post(
    `/clientes/${clienteId}/remitentes/${remitenteId}/direcciones`,
    direccion
  );


// =========================
// DESTINATARIOS
// =========================

export const getDestinatariosByClienteRequest = (clienteId) =>
  axios.get(`/clientes/${clienteId}/destinatarios`);

export const addDestinatarioRequest = (clienteId, destinatario) =>
  axios.post(`/clientes/${clienteId}/destinatarios`, destinatario);

export const addDireccionDestinatarioRequest = (
  clienteId,
  destinatarioId,
  direccion
) =>
  axios.post(
    `/clientes/${clienteId}/destinatarios/${destinatarioId}/direcciones`,
    direccion
  );
