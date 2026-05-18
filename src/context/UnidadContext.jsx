import { createContext, useCallback, useContext, useState } from "react";
import {
  crearUnidadRequest,
  obtenerUnidadesRequest,
  obtenerUnidadRequest,
  actualizarUnidadRequest,
  cambiarEstadoUnidadRequest,
  eliminarUnidadRequest,
} from "../api/unidades";
import {
  DEFAULT_PAGINATION,
  createPaginationParams,
  getRecordId,
  normalizeCollection,
  normalizePagination,
  normalizeResource,
  sameRecordId,
} from "../utils/apiData";

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
  const [paginationUnidades, setPaginationUnidades] =
    useState(DEFAULT_PAGINATION);

  const limpiarErrores = useCallback(() => setErrors([]), []);

  const obtenerUnidades = useCallback(async (params = {}) => {
    try {
      limpiarErrores();
      const requestParams = createPaginationParams({
        page: params.page ?? 1,
        limit: params.limit ?? 10,
        search: params.search,
      });
      const res = await obtenerUnidadesRequest(requestParams);
      const data = normalizeCollection(res.data, ["unidades"]);
      setUnidades(data);
      setPaginationUnidades(
        normalizePagination(res.data, DEFAULT_PAGINATION)
      );
      return data;
    } catch (error) {
      const message =
        error.response?.data?.message || "Error al obtener unidades";
      setErrors([message]);
      return [];
    }
  }, [limpiarErrores]);

  const obtenerUnidad = useCallback(async (id) => {
    try {
      limpiarErrores();
      const res = await obtenerUnidadRequest(id);
      const unidad = normalizeResource(res.data, ["unidad"]);
      setUnidadSeleccionada(unidad);
      return unidad;
    } catch (error) {
      const message =
        error.response?.data?.message || "Error al obtener la unidad";
      setErrors([message]);
      return null;
    }
  }, [limpiarErrores]);

  const crearUnidad = useCallback(async (unidad) => {
    try {
      limpiarErrores();
      const res = await crearUnidadRequest(unidad);
      const unidadCreada = normalizeResource(res.data, ["unidad"]);

      if (unidadCreada) {
        setUnidades((prev) => [unidadCreada, ...prev]);
      }

      return res.data;
    } catch (error) {
      const message =
        error.response?.data?.message || "Error al crear unidad";
      setErrors([message]);
      throw error;
    }
  }, [limpiarErrores]);

  const actualizarUnidad = useCallback(async (id, datos) => {
    try {
      limpiarErrores();
      const res = await actualizarUnidadRequest(id, datos);
      const unidadActualizada = normalizeResource(res.data, ["unidad"]);

      setUnidades((prev) =>
        prev.map((unidad) =>
          sameRecordId(unidad, id) ? unidadActualizada || unidad : unidad
        )
      );

      return res.data;
    } catch (error) {
      const message =
        error.response?.data?.message || "Error al actualizar unidad";
      setErrors([message]);
      throw error;
    }
  }, [limpiarErrores]);

  const eliminarUnidad = useCallback(async (id) => {
    try {
      limpiarErrores();
      const res = await eliminarUnidadRequest(id);

      setUnidades((prev) => prev.filter((unidad) => !sameRecordId(unidad, id)));

      if (sameRecordId(unidadSeleccionada, id)) {
        setUnidadSeleccionada(null);
      }

      return res.data;
    } catch (error) {
      const message =
        error.response?.data?.message || "Error al eliminar unidad";
      setErrors([message]);
      throw error;
    }
  }, [limpiarErrores, unidadSeleccionada]);

  const cambiarEstadoUnidad = useCallback(async (id, estado) => {
    try {
      limpiarErrores();
      const res = await cambiarEstadoUnidadRequest(id, estado);
      const unidadActualizada = normalizeResource(res.data, ["unidad"]);

      setUnidades((prev) =>
        prev.map((unidad) =>
          sameRecordId(unidad, id) ? unidadActualizada || unidad : unidad
        )
      );

      return res.data;
    } catch (error) {
      const message =
        error.response?.data?.message || "Error al cambiar estado de unidad";
      setErrors([message]);
      throw error;
    }
  }, [limpiarErrores]);

  return (
    <UnidadContext.Provider
      value={{
        unidades,
        unidadSeleccionada,
        errors,
        paginationUnidades,
        setErrors,
        limpiarErrores,
        getRecordId,
        obtenerUnidades,
        obtenerUnidad,
        crearUnidad,
        actualizarUnidad,
        eliminarUnidad,
        cambiarEstadoUnidad,
      }}
    >
      {children}
    </UnidadContext.Provider>
  );
}

export default UnidadContext;
