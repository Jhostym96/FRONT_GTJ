import { createContext, useContext, useState } from "react";

import {
  getConductoresRequest,
  getConductorRequest,
  createConductorRequest,
  updateConductorRequest,
} from "../api/conductores";
import { getListFromResponse } from "../utils/apiResponse";

const ConductorContext = createContext();

export const useConductores = () => {
  const context = useContext(ConductorContext);

  if (!context) {
    throw new Error("useConductores debe usarse dentro de ConductorProvider");
  }

  return context;
};

// Alias para que también funcione si usas useConductor
export const useConductor = useConductores;

export function ConductorProvider({ children }) {
  const [conductores, setConductores] = useState([]);
  const [errors, setErrors] = useState([]);

  const limpiarErrores = () => setErrors([]);

  const obtenerConductores = async () => {
    try {
      limpiarErrores();
      const res = await getConductoresRequest();
      const data = getListFromResponse(res.data, ["conductores"]);
      setConductores(data);
      return data;
    } catch (error) {
      setErrors([
        error.response?.data?.message || "Error al obtener conductores",
      ]);
      return [];
    }
  };

  const obtenerConductor = async (id) => {
    try {
      limpiarErrores();
      const res = await getConductorRequest(id);
      return res.data;
    } catch (error) {
      setErrors([
        error.response?.data?.message || "Error al obtener conductor",
      ]);
      return null;
    }
  };

  const crearConductor = async (conductor) => {
    try {
      limpiarErrores();
      const res = await createConductorRequest(conductor);

      setConductores((prev) => [res.data.conductor, ...prev]);

      return res.data;
    } catch (error) {
      setErrors([
        error.response?.data?.message || "Error al registrar conductor",
      ]);
      throw error;
    }
  };

  const actualizarConductor = async (id, conductor) => {
    try {
      limpiarErrores();
      const res = await updateConductorRequest(id, conductor);

      setConductores((prev) =>
        prev.map((item) =>
          item._id === id ? res.data.conductor : item
        )
      );

      return res.data;
    } catch (error) {
      setErrors([
        error.response?.data?.message || "Error al actualizar conductor",
      ]);
      throw error;
    }
  };

  return (
    <ConductorContext.Provider
      value={{
        conductores,
        errors,
        setErrors,
        limpiarErrores,

        obtenerConductores,
        obtenerConductor,
        crearConductor,
        actualizarConductor,

        getConductores: obtenerConductores,
        getConductor: obtenerConductor,
        createConductor: crearConductor,
        updateConductor: actualizarConductor,
      }}
    >
      {children}
    </ConductorContext.Provider>
  );
}
