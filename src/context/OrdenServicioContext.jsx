import { createContext, useContext, useState, useEffect } from "react";

import {
  crearOrdenServicioRequest,
  obtenerOrdenesServicioRequest,
  obtenerOrdenServicioRequest,
  actualizarOrdenServicioRequest,
  anularOrdenServicioRequest,
  obtenerDevolucionesPendientesRequest,
  actualizarEstadoDevolucionRequest,
} from "../api/ordenServicio";

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
  const [ordenes, setOrdenes] = useState([]);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);
  const [devolucionesPendientes, setDevolucionesPendientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);

  const limpiarErrores = () => setErrors([]);

  const cargarOrdenesServicio = async () => {
    try {
      limpiarErrores();
      setLoading(true);

      const res = await obtenerOrdenesServicioRequest();
      setOrdenes(res.data);

      return res.data;
    } catch (error) {
      setErrors([
        error.response?.data?.message || "Error al obtener órdenes de servicio",
      ]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const cargarOrdenServicio = async (id) => {
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
  };

  const crearOrdenServicio = async (orden) => {
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
  };

  const editarOrdenServicio = async (id, datos) => {
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
  };

  const anularOrdenServicio = async (id) => {
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
  };

  const cargarDevolucionesPendientes = async () => {
    try {
      setLoading(true);
      const res = await obtenerDevolucionesPendientesRequest();
      setDevolucionesPendientes(res.data);
      return res.data;
    } catch (error) {
      setErrors([
        error.response?.data?.message || "Error al obtener devoluciones",
      ]);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const actualizarEstadoDevolucion = async (id, data) => {
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
  };

  const limpiarOrdenSeleccionada = () => {
    setOrdenSeleccionada(null);
  };

  useEffect(() => {
    cargarOrdenesServicio();
  }, []);

  return (
    <OrdenServicioContext.Provider
      value={{
        ordenes,
        ordenesServicio: ordenes,

        ordenSeleccionada,
        devolucionesPendientes,
        loading,
        errors,
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
