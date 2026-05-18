import axios from "./axios";

// Crear unidad
export const crearUnidadRequest = (unidad) =>
  axios.post(`/unidades`, unidad);

// Obtener todas las unidades
export const obtenerUnidadesRequest = (params = {}) =>
  axios.get(`/unidades`, { params });

// Obtener unidad por ID
export const obtenerUnidadRequest = (id) =>
  axios.get(`/unidades/${id}`);

// Actualizar unidad por ID
export const actualizarUnidadRequest = (id, datos) =>
  axios.put(`/unidades/${id}`, datos);

export const cambiarEstadoUnidadRequest = (id, estado) =>
  axios.patch(`/unidades/${id}/estado`, { estado });

export const eliminarUnidadRequest = (id) =>
  axios.delete(`/unidades/${id}`);
