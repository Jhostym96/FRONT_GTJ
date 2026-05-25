import { createContext, useCallback, useContext, useState } from "react";
import {
  actualizarMaquinariaRequest,
  cambiarEstadoMaquinariaRequest,
  crearMaquinariaRequest,
  eliminarMaquinariaRequest,
  obtenerMaquinariaRequest,
  obtenerMaquinariasRequest,
} from "../api/maquinarias";
import {
  DEFAULT_PAGINATION,
  createPaginationParams,
  getRecordId,
  normalizeCollection,
  normalizePagination,
  normalizeResource,
  sameRecordId,
} from "../utils/apiData";

const MaquinariaContext = createContext();

export const useMaquinarias = () => {
  const context = useContext(MaquinariaContext);

  if (!context) {
    throw new Error("useMaquinarias debe usarse dentro de MaquinariaProvider");
  }

  return context;
};

export function MaquinariaProvider({ children }) {
  const [maquinarias, setMaquinarias] = useState([]);
  const [maquinariaSeleccionada, setMaquinariaSeleccionada] = useState(null);
  const [errors, setErrors] = useState([]);
  const [paginationMaquinarias, setPaginationMaquinarias] =
    useState(DEFAULT_PAGINATION);

  const limpiarErrores = useCallback(() => setErrors([]), []);

  const obtenerMaquinarias = useCallback(async (params = {}) => {
    try {
      limpiarErrores();
      const requestParams = createPaginationParams({
        page: params.page ?? 1,
        limit: params.limit ?? 10,
        search: params.search,
      });
      const res = await obtenerMaquinariasRequest(requestParams);
      const data = normalizeCollection(res.data, ["maquinarias"]);
      setMaquinarias(data);
      setPaginationMaquinarias(
        normalizePagination(res.data, DEFAULT_PAGINATION)
      );
      return data;
    } catch (error) {
      setErrors([
        error.response?.data?.message || "Error al obtener maquinarias",
      ]);
      return [];
    }
  }, [limpiarErrores]);

  const obtenerMaquinaria = useCallback(async (id) => {
    try {
      limpiarErrores();
      const res = await obtenerMaquinariaRequest(id);
      const maquinaria = normalizeResource(res.data, ["maquinaria"]);
      setMaquinariaSeleccionada(maquinaria);
      return maquinaria;
    } catch (error) {
      setErrors([
        error.response?.data?.message || "Error al obtener maquinaria",
      ]);
      return null;
    }
  }, [limpiarErrores]);

  const crearMaquinaria = useCallback(async (data) => {
    try {
      limpiarErrores();
      const res = await crearMaquinariaRequest(data);
      const maquinaria = normalizeResource(res.data, ["maquinaria"]);
      if (maquinaria) setMaquinarias((prev) => [maquinaria, ...prev]);
      return res.data;
    } catch (error) {
      setErrors([
        error.response?.data?.message || "Error al crear maquinaria",
      ]);
      throw error;
    }
  }, [limpiarErrores]);

  const actualizarMaquinaria = useCallback(async (id, data) => {
    try {
      limpiarErrores();
      const res = await actualizarMaquinariaRequest(id, data);
      const maquinaria = normalizeResource(res.data, ["maquinaria"]);
      setMaquinarias((prev) =>
        prev.map((actual) =>
          sameRecordId(actual, id) ? maquinaria || actual : actual
        )
      );
      return res.data;
    } catch (error) {
      setErrors([
        error.response?.data?.message || "Error al actualizar maquinaria",
      ]);
      throw error;
    }
  }, [limpiarErrores]);

  const cambiarEstadoMaquinaria = useCallback(async (id, estado) => {
    try {
      limpiarErrores();
      const res = await cambiarEstadoMaquinariaRequest(id, estado);
      const maquinaria = normalizeResource(res.data, ["maquinaria"]);
      setMaquinarias((prev) =>
        prev.map((actual) =>
          sameRecordId(actual, id) ? maquinaria || actual : actual
        )
      );
      return res.data;
    } catch (error) {
      setErrors([
        error.response?.data?.message || "Error al cambiar estado de maquinaria",
      ]);
      throw error;
    }
  }, [limpiarErrores]);

  const eliminarMaquinaria = useCallback(async (id) => {
    try {
      limpiarErrores();
      const res = await eliminarMaquinariaRequest(id);
      setMaquinarias((prev) =>
        prev.filter((maquinaria) => !sameRecordId(maquinaria, id))
      );
      if (sameRecordId(maquinariaSeleccionada, id)) {
        setMaquinariaSeleccionada(null);
      }
      return res.data;
    } catch (error) {
      setErrors([
        error.response?.data?.message || "Error al eliminar maquinaria",
      ]);
      throw error;
    }
  }, [limpiarErrores, maquinariaSeleccionada]);

  return (
    <MaquinariaContext.Provider
      value={{
        maquinarias,
        maquinariaSeleccionada,
        errors,
        paginationMaquinarias,
        getRecordId,
        obtenerMaquinarias,
        obtenerMaquinaria,
        crearMaquinaria,
        actualizarMaquinaria,
        cambiarEstadoMaquinaria,
        eliminarMaquinaria,
        limpiarErrores,
      }}
    >
      {children}
    </MaquinariaContext.Provider>
  );
}
