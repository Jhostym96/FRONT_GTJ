import { createContext, useCallback, useContext, useState } from "react";

import {
  getConductoresRequest,
  getConductorRequest,
  createConductorRequest,
  updateConductorRequest,
  cambiarEstadoConductorRequest,
  deleteConductorRequest,
} from "../api/conductores";
import {
  DEFAULT_PAGINATION,
  createPaginationParams,
  normalizeCollection,
  normalizePagination,
  normalizeResource,
  sameRecordId,
} from "../utils/apiData";

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
  const [paginationConductores, setPaginationConductores] =
    useState(DEFAULT_PAGINATION);

  const limpiarErrores = useCallback(() => setErrors([]), []);

  const obtenerConductores = useCallback(async (params = {}) => {
    try {
      limpiarErrores();
      const requestParams = createPaginationParams({
        page: params.page ?? 1,
        limit: params.limit ?? 10,
        search: params.search,
      });
      const res = await getConductoresRequest(requestParams);
      const data = normalizeCollection(res.data, ["conductores"]);
      setConductores(data);
      setPaginationConductores(
        normalizePagination(res.data, DEFAULT_PAGINATION)
      );
      return data;
    } catch (error) {
      setErrors([
        error.response?.data?.message || "Error al obtener conductores",
      ]);
      return [];
    }
  }, [limpiarErrores]);

  const obtenerConductor = useCallback(async (id) => {
    try {
      limpiarErrores();
      const res = await getConductorRequest(id);
      return normalizeResource(res.data, ["conductor"]);
    } catch (error) {
      setErrors([
        error.response?.data?.message || "Error al obtener conductor",
      ]);
      return null;
    }
  }, [limpiarErrores]);

  const crearConductor = useCallback(async (conductor) => {
    try {
      limpiarErrores();
      const res = await createConductorRequest(conductor);
      const conductorCreado = normalizeResource(res.data, ["conductor"]);

      if (conductorCreado) {
        setConductores((prev) => [conductorCreado, ...prev]);
      }

      return res.data;
    } catch (error) {
      setErrors([
        error.response?.data?.message || "Error al registrar conductor",
      ]);
      throw error;
    }
  }, [limpiarErrores]);

  const actualizarConductor = useCallback(async (id, conductor) => {
    try {
      limpiarErrores();
      const res = await updateConductorRequest(id, conductor);
      const conductorActualizado = normalizeResource(res.data, ["conductor"]);

      setConductores((prev) =>
        prev.map((item) =>
          sameRecordId(item, id) ? conductorActualizado || item : item
        )
      );

      return res.data;
    } catch (error) {
      setErrors([
        error.response?.data?.message || "Error al actualizar conductor",
      ]);
      throw error;
    }
  }, [limpiarErrores]);

  const eliminarConductor = useCallback(async (id) => {
    try {
      limpiarErrores();
      const res = await deleteConductorRequest(id);

      setConductores((prev) =>
        prev.filter((conductor) => !sameRecordId(conductor, id))
      );

      return res.data;
    } catch (error) {
      setErrors([
        error.response?.data?.message || "Error al eliminar conductor",
      ]);
      throw error;
    }
  }, [limpiarErrores]);

  const cambiarEstadoConductor = useCallback(async (id, estado) => {
    try {
      limpiarErrores();
      const res = await cambiarEstadoConductorRequest(id, estado);
      const conductorActualizado = normalizeResource(res.data, ["conductor"]);

      setConductores((prev) =>
        prev.map((conductor) =>
          sameRecordId(conductor, id)
            ? conductorActualizado || conductor
            : conductor
        )
      );

      return res.data;
    } catch (error) {
      setErrors([
        error.response?.data?.message ||
          "Error al cambiar estado de conductor",
      ]);
      throw error;
    }
  }, [limpiarErrores]);

  return (
    <ConductorContext.Provider
      value={{
        conductores,
        errors,
        paginationConductores,
        setErrors,
        limpiarErrores,

        obtenerConductores,
        obtenerConductor,
        crearConductor,
        actualizarConductor,
        eliminarConductor,
        cambiarEstadoConductor,

        getConductores: obtenerConductores,
        getConductor: obtenerConductor,
        createConductor: crearConductor,
        updateConductor: actualizarConductor,
        deleteConductor: eliminarConductor,
        updateEstadoConductor: cambiarEstadoConductor,
      }}
    >
      {children}
    </ConductorContext.Provider>
  );
}
