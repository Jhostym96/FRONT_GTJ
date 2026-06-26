import { createContext, useCallback, useContext, useState } from "react";

import {
  getProgramacionesViajeRequest,
  getProgramacionViajeRequest,
  createProgramacionViajeRequest,
  updateProgramacionViajeRequest,
  updateEstadoProgramacionViajeRequest,
  registrarGuiaSunatProgramacionRequest,
  getOrdenesDisponiblesParaViajeRequest,
  getProgramacionesDisponiblesParaGuiaRequest,
} from "../api/programacionViaje";
import {
  DEFAULT_PAGINATION,
  createPaginationParams,
  normalizeCollection,
  normalizePagination,
  normalizeResource,
  sameRecordId,
} from "../utils/apiData";

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
  const [paginationProgramaciones, setPaginationProgramaciones] =
    useState(DEFAULT_PAGINATION);

  const getProgramacionesViaje = useCallback(async (params = {}) => {
    try {
      const requestParams = createPaginationParams({
        page: params.page ?? 1,
        limit: params.limit ?? 10,
        search: params.search,
        estado: params.estado,
      });
      const res = await getProgramacionesViajeRequest(requestParams);
      const data = normalizeCollection(res.data, ["programaciones"]);
      setProgramaciones(data);
      setPaginationProgramaciones(
        normalizePagination(res.data, DEFAULT_PAGINATION)
      );
    } catch (error) {
      setErrors([error.response?.data?.message || "Error al obtener programaciones"]);
      return [];
    }
  }, []);

  const getProgramacionesDisponiblesParaGuia = useCallback(async () => {
    try {
      const res = await getProgramacionesDisponiblesParaGuiaRequest();
      setProgramaciones(normalizeCollection(res.data, ["programaciones"]));
    } catch (error) {
      setErrors([
        error.response?.data?.message ||
          "Error al obtener programaciones disponibles para guía",
      ]);
      return [];
    }
  }, []);

  const getProgramacionViaje = useCallback(async (id) => {
    try {
      const res = await getProgramacionViajeRequest(id);
      return normalizeResource(res.data, ["programacion"]);
    } catch (error) {
      setErrors([error.response?.data?.message || "Error al obtener programación"]);
      throw error;
    }
  }, []);

  const createProgramacionViaje = useCallback(async (data) => {
    try {
      setErrors([]);

      const res = await createProgramacionViajeRequest(data);

      const programacionCreada = normalizeResource(res.data, ["programacion"]);

      if (programacionCreada) {
        setProgramaciones((prev) => [programacionCreada, ...prev]);
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
  }, []);

  const actualizarProgramacionViaje = useCallback(async (id, data) => {
    try {
      setErrors([]);

      const res = await updateProgramacionViajeRequest(id, data);
      const programacionActualizada = normalizeResource(res.data, ["programacion"]);

      if (programacionActualizada) {
        setProgramaciones((prev) =>
          prev.map((item) =>
            sameRecordId(item, id) ? programacionActualizada : item
          )
        );
      }

      return res.data;
    } catch (error) {
      const mensaje =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Error al actualizar programación";

      setErrors([mensaje]);

      throw error;
    }
  }, []);

  const cambiarEstadoProgramacion = useCallback(async (id, data) => {
    try {
      const res = await updateEstadoProgramacionViajeRequest(id, data);

      setProgramaciones((prev) =>
        prev.map((item) =>
          sameRecordId(item, id)
            ? { ...item, ...res.data.programacion }
            : item
        )
      );

      return res.data;
    } catch (error) {
      setErrors([error.response?.data?.message || "Error al cambiar estado"]);
      throw error;
    }
  }, []);

  const registrarGuiaSunatProgramacion = useCallback(async (id, data) => {
    try {
      const res = await registrarGuiaSunatProgramacionRequest(id, data);
      const programacionActualizada = normalizeResource(res.data, ["programacion"]);

      if (programacionActualizada) {
        setProgramaciones((prev) =>
          prev.map((item) =>
            sameRecordId(item, id) ? programacionActualizada : item
          )
        );
      }

      return res.data;
    } catch (error) {
      setErrors([
        error.response?.data?.message || "Error al registrar la guía SUNAT",
      ]);
      throw error;
    }
  }, []);

  const getOrdenesDisponibles = useCallback(async () => {
    try {
      const res = await getOrdenesDisponiblesParaViajeRequest();
      setOrdenesDisponibles(normalizeCollection(res.data, ["ordenes"]));
    } catch (error) {
      setErrors([
        error.response?.data?.message ||
          "Error al obtener órdenes disponibles",
      ]);
      return [];
    }
  }, []);

  return (
    <ProgramacionViajeContext.Provider
      value={{
        programaciones,
        ordenesDisponibles,
        errors,
        paginationProgramaciones,

        getProgramacionesViaje,
        getProgramacionesDisponiblesParaGuia,
        getProgramacionViaje,
        createProgramacionViaje,
        actualizarProgramacionViaje,
        cambiarEstadoProgramacion,
        registrarGuiaSunatProgramacion,
        getOrdenesDisponibles,
      }}
    >
      {children}
    </ProgramacionViajeContext.Provider>
  );
}
