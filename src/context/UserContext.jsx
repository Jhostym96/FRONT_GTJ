import { createContext, useCallback, useContext, useState } from "react";
import { useAuth } from "./AuthContext";
import {
  crearUsuarioRequest,
  obtenerUsuariosRequest,
  actualizarUsuarioRequest,
  cambiarRolRequest,
  desactivarUsuarioRequest,
  activarUsuarioRequest,
  actualizarPerfilRequest, // 👈 nuevo import
} from "../api/usuarios";

const UserContext = createContext();

// Hook para acceder más fácilmente
export const useUsuarios = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);

  // Obtener todos los usuarios
  const cargarUsuarios = useCallback(async () => {
    if (authLoading || !isAuthenticated) {
      setUsuarios([]);
      return [];
    }

    try {
      setLoading(true);
      const res = await obtenerUsuariosRequest();
      setUsuarios(res.data);
      return res.data;
    } catch (error) {
      console.error("Error al obtener usuarios:", error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [authLoading, isAuthenticated]);

  // Crear nuevo usuario
  const crearUsuario = async (usuario) => {
    const res = await crearUsuarioRequest(usuario);
    await cargarUsuarios();
    return res;
  };

  // Editar usuario (admin)
  const editarUsuario = async (id, datos) => {
    const res = await actualizarUsuarioRequest(id, datos);
    await cargarUsuarios();
    return res;
  };

  // Cambiar rol
  const cambiarRol = async (id, nuevoRol) => {
    const res = await cambiarRolRequest(id, nuevoRol);
    await cargarUsuarios();
    return res;
  };

  // Activar usuario
  const activarUsuario = async (id) => {
    const res = await activarUsuarioRequest(id);
    await cargarUsuarios();
    return res;
  };

  // Desactivar usuario
  const desactivarUsuario = async (id) => {
    const res = await desactivarUsuarioRequest(id);
    await cargarUsuarios();
    return res;
  };

  // ✅ Actualizar perfil propio
  const actualizarPerfil = async (datos) => {
    const res = await actualizarPerfilRequest(datos);
    return res.data;
  };

  return (
    <UserContext.Provider
      value={{
        usuarios,
        loading,
        crearUsuario,
        editarUsuario,
        cambiarRol,
        activarUsuario,
        desactivarUsuario,
        cargarUsuarios,
        actualizarPerfil, // 👈 expuesto al contexto
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
