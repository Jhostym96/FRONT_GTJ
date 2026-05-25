import { createContext, useCallback, useContext, useState } from "react";
import {
  actualizarMantenimientoRequest,
  crearMantenimientoRequest,
  eliminarMantenimientoRequest,
  obtenerAlertasMantenimientoRequest,
  obtenerMantenimientoRequest,
  obtenerMantenimientosRequest,
} from "../api/mantenimientos";
import {
  DEFAULT_PAGINATION,
  createPaginationParams,
  normalizeCollection,
  normalizePagination,
  normalizeResource,
  sameRecordId,
} from "../utils/apiData";

const MantenimientoContext = createContext();

export const useMantenimientos = () => {
  const context = useContext(MantenimientoContext);

  if (!context) {
    throw new Error("useMantenimientos debe usarse dentro de MantenimientoProvider");
  }

  return context;
};

export function MantenimientoProvider({ children }) {
  const [mantenimientos, setMantenimientos] = useState([]);
  const [alertasMantenimiento, setAlertasMantenimiento] = useState([]);
  const [resumenAlertas, setResumenAlertas] = useState({
    total: 0,
    vencidos: 0,
    proximos: 0,
  });
  const [mantenimientoSeleccionado, setMantenimientoSeleccionado] = useState(null);
  const [errors, setErrors] = useState([]);
  const [paginationMantenimientos, setPaginationMantenimientos] =
    useState(DEFAULT_PAGINATION);

  const limpiarErrores = useCallback(() => setErrors([]), []);

  const obtenerMantenimientos = useCallback(async (params = {}) => {
    try {
      limpiarErrores();
      const requestParams = createPaginationParams({
        page: params.page ?? 1,
        limit: params.limit ?? 10,
        search: params.search,
      });
      if (params.estado) requestParams.estado = params.estado;
      if (params.tipoEquipo) requestParams.tipoEquipo = params.tipoEquipo;
      const res = await obtenerMantenimientosRequest(requestParams);
      const data = normalizeCollection(res.data, ["mantenimientos"]);
      setMantenimientos(data);
      setPaginationMantenimientos(
        normalizePagination(res.data, DEFAULT_PAGINATION)
      );
      return data;
    } catch (error) {
      setErrors([
        error.response?.data?.message || "Error al obtener mantenimientos",
      ]);
      return [];
    }
  }, [limpiarErrores]);

  const obtenerMantenimiento = useCallback(async (id) => {
    try {
      limpiarErrores();
      const res = await obtenerMantenimientoRequest(id);
      const mantenimiento = normalizeResource(res.data, ["mantenimiento"]);
      setMantenimientoSeleccionado(mantenimiento);
      return mantenimiento;
    } catch (error) {
      setErrors([
        error.response?.data?.message || "Error al obtener mantenimiento",
      ]);
      return null;
    }
  }, [limpiarErrores]);

  const obtenerAlertasMantenimiento = useCallback(async () => {
    try {
      limpiarErrores();
      const res = await obtenerAlertasMantenimientoRequest();
      setAlertasMantenimiento(res.data?.alertas || []);
      setResumenAlertas(
        res.data?.resumen || {
          total: 0,
          vencidos: 0,
          proximos: 0,
        }
      );
      return res.data?.alertas || [];
    } catch (error) {
      setErrors([
        error.response?.data?.message ||
          "Error al obtener alertas de mantenimiento",
      ]);
      return [];
    }
  }, [limpiarErrores]);

  const crearMantenimiento = useCallback(async (data) => {
    try {
      limpiarErrores();
      const res = await crearMantenimientoRequest(data);
      const mantenimiento = normalizeResource(res.data, ["mantenimiento"]);
      if (mantenimiento) setMantenimientos((prev) => [mantenimiento, ...prev]);
      return res.data;
    } catch (error) {
      setErrors([
        error.response?.data?.message || "Error al crear mantenimiento",
      ]);
      throw error;
    }
  }, [limpiarErrores]);

  const actualizarMantenimiento = useCallback(async (id, data) => {
    try {
      limpiarErrores();
      const res = await actualizarMantenimientoRequest(id, data);
      const mantenimiento = normalizeResource(res.data, ["mantenimiento"]);
      setMantenimientos((prev) =>
        prev.map((actual) =>
          sameRecordId(actual, id) ? mantenimiento || actual : actual
        )
      );
      return res.data;
    } catch (error) {
      setErrors([
        error.response?.data?.message || "Error al actualizar mantenimiento",
      ]);
      throw error;
    }
  }, [limpiarErrores]);

  const eliminarMantenimiento = useCallback(async (id) => {
    try {
      limpiarErrores();
      const res = await eliminarMantenimientoRequest(id);
      setMantenimientos((prev) =>
        prev.filter((actual) => !sameRecordId(actual, id))
      );
      return res.data;
    } catch (error) {
      setErrors([
        error.response?.data?.message || "Error al eliminar mantenimiento",
      ]);
      throw error;
    }
  }, [limpiarErrores]);

  return (
    <MantenimientoContext.Provider
      value={{
        mantenimientos,
        alertasMantenimiento,
        resumenAlertas,
        mantenimientoSeleccionado,
        errors,
        paginationMantenimientos,
        obtenerMantenimientos,
        obtenerAlertasMantenimiento,
        obtenerMantenimiento,
        crearMantenimiento,
        actualizarMantenimiento,
        eliminarMantenimiento,
      }}
    >
      {children}
    </MantenimientoContext.Provider>
  );
}
