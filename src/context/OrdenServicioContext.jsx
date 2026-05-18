import { createContext, useCallback, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

import {
  crearOrdenServicioRequest,
  obtenerOrdenesServicioRequest,
  obtenerOrdenServicioRequest,
  actualizarOrdenServicioRequest,
  anularOrdenServicioRequest,
  obtenerDevolucionesPendientesRequest,
  actualizarEstadoDevolucionRequest,
} from "../api/ordenServicio";
import {
  DEFAULT_PAGINATION,
  createPaginationParams,
  normalizeCollection,
  normalizePagination,
} from "../utils/apiData";

const OrdenServicioContext = createContext();

export const useOrdenesServicio = () => {
  const context = useContext(OrdenServicioContext);

  if (!context) {
    throw new Error(
      "useOrdenesServicio debe usarse dentro de OrdenServicioProvider"
    );
  }

  return context;
};

// Alias para que también funcione useOrdenServicio
export const useOrdenServicio = useOrdenesServicio;

export const OrdenServicioProvider = ({ children }) => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [ordenes, setOrdenes] = useState([]);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);
  const [devolucionesPendientes, setDevolucionesPendientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [paginationOrdenes, setPaginationOrdenes] =
    useState(DEFAULT_PAGINATION);
  const [paginationDevoluciones, setPaginationDevoluciones] =
    useState(DEFAULT_PAGINATION);

  const limpiarErrores = useCallback(() => setErrors([]), []);

  const cargarOrdenesServicio = useCallback(async (params = {}) => {
    try {
      limpiarErrores();
      setLoading(true);

      const requestParams = createPaginationParams({
        page: params.page ?? 1,
        limit: params.limit ?? 10,
        search: params.search,
      });
      const res = await obtenerOrdenesServicioRequest(requestParams);
      const data = normalizeCollection(res.data, ["ordenes"]);
      setOrdenes(data);
      setPaginationOrdenes(
        normalizePagination(res.data, DEFAULT_PAGINATION)
      );

      return data;
    } catch (error) {
      setErrors([
        error.response?.data?.message || "Error al obtener órdenes de servicio",
      ]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [limpiarErrores]);

  const cargarOrdenServicio = useCallback(async (id) => {
    try {
      limpiarErrores();
      setLoading(true);

      const res = await obtenerOrdenServicioRequest(id);
      setOrdenSeleccionada(res.data);

      return res.data;
    } catch (error) {
      setErrors([
        error.response?.data?.message || "Error al obtener la orden de servicio",
      ]);
      return null;
    } finally {
      setLoading(false);
    }
  }, [limpiarErrores]);

  const crearOrdenServicio = useCallback(async (orden) => {
    try {
      limpiarErrores();

      const res = await crearOrdenServicioRequest(orden);
      await cargarOrdenesServicio();

      return res.data;
    } catch (error) {
      setErrors([
        error.response?.data?.message || "Error al crear orden de servicio",
      ]);
      throw error;
    }
  }, [cargarOrdenesServicio, limpiarErrores]);

  const editarOrdenServicio = useCallback(async (id, datos) => {
    try {
      limpiarErrores();

      const res = await actualizarOrdenServicioRequest(id, datos);
      await cargarOrdenesServicio();

      return res.data;
    } catch (error) {
      setErrors([
        error.response?.data?.message || "Error al actualizar orden de servicio",
      ]);
      throw error;
    }
  }, [cargarOrdenesServicio, limpiarErrores]);

  const anularOrdenServicio = useCallback(async (id) => {
    try {
      limpiarErrores();

      const res = await anularOrdenServicioRequest(id);
      await cargarOrdenesServicio();

      return res.data;
    } catch (error) {
      setErrors([
        error.response?.data?.message || "Error al anular orden de servicio",
      ]);
      throw error;
    }
  }, [cargarOrdenesServicio, limpiarErrores]);

  const cargarDevolucionesPendientes = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      const requestParams = createPaginationParams({
        page: params.page ?? 1,
        limit: params.limit ?? 10,
        search: params.search,
      });
      const res = await obtenerDevolucionesPendientesRequest(requestParams);
      const data = normalizeCollection(res.data, ["ordenes"]);
      setDevolucionesPendientes(data);
      setPaginationDevoluciones(
        normalizePagination(res.data, DEFAULT_PAGINATION)
      );
      return data;
    } catch (error) {
      setErrors([
        error.response?.data?.message || "Error al obtener devoluciones",
      ]);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const actualizarEstadoDevolucion = useCallback(async (id, data) => {
    try {
      const res = await actualizarEstadoDevolucionRequest(id, data);
      await cargarOrdenesServicio();
      await cargarDevolucionesPendientes();
      return res.data;
    } catch (error) {
      setErrors([
        error.response?.data?.message ||
          "Error al actualizar el estado de devolución",
      ]);
      throw error;
    }
  }, [cargarDevolucionesPendientes, cargarOrdenesServicio]);

  const limpiarOrdenSeleccionada = useCallback(() => {
    setOrdenSeleccionada(null);
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (isAuthenticated) {
      cargarOrdenesServicio();
      return;
    }

    setOrdenes([]);
    setOrdenSeleccionada(null);
    setDevolucionesPendientes([]);
    limpiarErrores();
  }, [authLoading, cargarOrdenesServicio, isAuthenticated, limpiarErrores]);

  return (
    <OrdenServicioContext.Provider
      value={{
        ordenes,
        ordenesServicio: ordenes,

        ordenSeleccionada,
        devolucionesPendientes,
        loading,
        errors,
        paginationOrdenes,
        paginationDevoluciones,
        setErrors,
        limpiarErrores,

        cargarOrdenesServicio,
        obtenerOrdenesServicio: cargarOrdenesServicio,

        cargarOrdenServicio,
        obtenerOrdenServicio: cargarOrdenServicio,

        crearOrdenServicio,

        editarOrdenServicio,
        actualizarOrdenServicio: editarOrdenServicio,

        anularOrdenServicio,
        cargarDevolucionesPendientes,
        obtenerDevolucionesPendientes: cargarDevolucionesPendientes,
        actualizarEstadoDevolucion,

        limpiarOrdenSeleccionada,
      }}
    >
      {children}
    </OrdenServicioContext.Provider>
  );
};
