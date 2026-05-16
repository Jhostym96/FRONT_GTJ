import axios from "./axios";

// Crear unidad
export const crearUnidadRequest = (unidad) =>
  axios.post(`/unidades`, unidad);

// Obtener todas las unidades
export const obtenerUnidadesRequest = () =>
  axios.get(`/unidades`);

// Obtener unidad por ID
export const obtenerUnidadRequest = (id) =>
  axios.get(`/unidades/${id}`);

// Actualizar unidad por ID
export const actualizarUnidadRequest = (id, datos) =>
  axios.put(`/unidades/${id}`, datos);