import axios from "./axios";

// Crear usuario
export const crearUsuarioRequest = (usuario) =>
  axios.post(`/usuarios`, usuario);

// Obtener todos los usuarios
export const obtenerUsuariosRequest = () =>
  axios.get(`/usuarios`);

// Actualizar usuario por ID (solo admins)
export const actualizarUsuarioRequest = (id, datos) =>
  axios.put(`/usuarios/${id}`, datos);

// Cambiar rol
export const cambiarRolRequest = (id, nuevoRol) =>
  axios.patch(`/usuarios/${id}/rol`, { nuevoRol });

// Desactivar usuario
export const desactivarUsuarioRequest = (id) =>
  axios.patch(`/usuarios/${id}/desactivar`);

// Activar usuario
export const activarUsuarioRequest = (id) =>
  axios.patch(`/usuarios/${id}/activar`);

// ✅ Nuevo: actualizar perfil propio (correo y/o contraseña)
export const actualizarPerfilRequest = (datos) =>
  axios.put(`/usuarios/perfil`, datos);
