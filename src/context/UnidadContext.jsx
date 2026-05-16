import { createContext, useContext, useState } from "react";
import {
  crearUnidadRequest,
  obtenerUnidadesRequest,
  obtenerUnidadRequest,
  actualizarUnidadRequest,
} from "../api/unidades";

const UnidadContext = createContext();

export const useUnidades = () => {
  const context = useContext(UnidadContext);

  if (!context) {
    throw new Error("useUnidades debe usarse dentro de UnidadProvider");
  }

  return context;
};

// Alias opcional para evitar errores si algún componente usa useUnidad
export const useUnidad = useUnidades;

export function UnidadProvider({ children }) {
  const [unidades, setUnidades] = useState([]);
  const [unidadSeleccionada, setUnidadSeleccionada] = useState(null);
  const [errors, setErrors] = useState([]);

  const limpiarErrores = () => setErrors([]);

  const obtenerUnidades = async () => {
    try {
      limpiarErrores();
      const res = await obtenerUnidadesRequest();
      setUnidades(res.data);
      return res.data;
    } catch (error) {
      const message =
        error.response?.data?.message || "Error al obtener unidades";
      setErrors([message]);
      return [];
    }
  };

  const obtenerUnidad = async (id) => {
    try {
      limpiarErrores();
      const res = await obtenerUnidadRequest(id);
      setUnidadSeleccionada(res.data);
      return res.data;
    } catch (error) {
      const message =
        error.response?.data?.message || "Error al obtener la unidad";
      setErrors([message]);
      return null;
    }
  };

  const crearUnidad = async (unidad) => {
    try {
      limpiarErrores();
      const res = await crearUnidadRequest(unidad);

      setUnidades((prev) => [res.data.unidad, ...prev]);

      return res.data;
    } catch (error) {
      const message =
        error.response?.data?.message || "Error al crear unidad";
      setErrors([message]);
      throw error;
    }
  };

  const actualizarUnidad = async (id, datos) => {
    try {
      limpiarErrores();
      const res = await actualizarUnidadRequest(id, datos);

      setUnidades((prev) =>
        prev.map((unidad) =>
          unidad._id === id ? res.data.unidad : unidad
        )
      );

      return res.data;
    } catch (error) {
      const message =
        error.response?.data?.message || "Error al actualizar unidad";
      setErrors([message]);
      throw error;
    }
  };

  return (
    <UnidadContext.Provider
      value={{
        unidades,
        unidadSeleccionada,
        errors,
        setErrors,
        limpiarErrores,
        obtenerUnidades,
        obtenerUnidad,
        crearUnidad,
        actualizarUnidad,
      }}
    >
      {children}
    </UnidadContext.Provider>
  );
}

export default UnidadContext;