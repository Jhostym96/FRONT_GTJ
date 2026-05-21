import { createContext, useContext, useState } from "react";

import {
  getProgramacionesViajeRequest,
  getProgramacionViajeRequest,
  createProgramacionViajeRequest,
  updateEstadoProgramacionViajeRequest,
  getOrdenesDisponiblesParaViajeRequest,
  getProgramacionesDisponiblesParaGuiaRequest,
} from "../api/programacionViaje";
import { getListFromResponse } from "../utils/apiResponse";

const ProgramacionViajeContext = createContext();

export const useProgramacionViaje = () => {
  const context = useContext(ProgramacionViajeContext);

  if (!context) {
    throw new Error("useProgramacionViaje debe usarse dentro de su Provider");
  }

  return context;
};

export function ProgramacionViajeProvider({ children }) {
  const [programaciones, setProgramaciones] = useState([]);
  const [ordenesDisponibles, setOrdenesDisponibles] = useState([]);
  const [errors, setErrors] = useState([]);

  const getProgramacionesViaje = async () => {
    try {
      const res = await getProgramacionesViajeRequest();
      const data = getListFromResponse(res.data, ["programaciones"]);
      setProgramaciones(data);
      return data;
    } catch (error) {
      setErrors([error.response?.data?.message || "Error al obtener programaciones"]);
      return [];
    }
  };

  const getProgramacionesDisponiblesParaGuia = async () => {
    try {
      const res = await getProgramacionesDisponiblesParaGuiaRequest();
      const data = getListFromResponse(res.data, ["programaciones"]);
      setProgramaciones(data);
      return data;
    } catch (error) {
      setErrors([
        error.response?.data?.message ||
          "Error al obtener programaciones disponibles para guía",
      ]);
      return [];
    }
  };

  const getProgramacionViaje = async (id) => {
    try {
      const res = await getProgramacionViajeRequest(id);
      return res.data;
    } catch (error) {
      setErrors([error.response?.data?.message || "Error al obtener programación"]);
      throw error;
    }
  };

  const createProgramacionViaje = async (data) => {
    try {
      setErrors([]);

      const res = await createProgramacionViajeRequest(data);

      if (res.data?.programacion) {
        setProgramaciones((prev) => [res.data.programacion, ...prev]);
      }

      return res.data;
    } catch (error) {
      const mensaje =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Error al crear programación";

      setErrors([mensaje]);

      throw error;
    }
  };

  const cambiarEstadoProgramacion = async (id, estado) => {
    try {
      const res = await updateEstadoProgramacionViajeRequest(id, estado);

      setProgramaciones((prev) =>
        prev.map((item) =>
          item._id === id
            ? { ...item, estado: res.data.programacion.estado }
            : item
        )
      );

      return res.data;
    } catch (error) {
      setErrors([error.response?.data?.message || "Error al cambiar estado"]);
      throw error;
    }
  };

  const getOrdenesDisponibles = async () => {
    try {
      const res = await getOrdenesDisponiblesParaViajeRequest();
      const data = getListFromResponse(res.data, ["ordenes"]);
      setOrdenesDisponibles(data);
      return data;
    } catch (error) {
      setErrors([
        error.response?.data?.message ||
          "Error al obtener órdenes disponibles",
      ]);
      return [];
    }
  };

  return (
    <ProgramacionViajeContext.Provider
      value={{
        programaciones,
        ordenesDisponibles,
        errors,

        getProgramacionesViaje,
        getProgramacionesDisponiblesParaGuia,
        getProgramacionViaje,
        createProgramacionViaje,
        cambiarEstadoProgramacion,
        getOrdenesDisponibles,
      }}
    >
      {children}
    </ProgramacionViajeContext.Provider>
  );
}
