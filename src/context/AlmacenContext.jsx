import { createContext, useCallback, useContext, useState } from "react";
import {
  actualizarItemAlmacenRequest,
  cambiarEstadoItemAlmacenRequest,
  crearItemAlmacenRequest,
  obtenerItemsAlmacenRequest,
  obtenerMovimientosAlmacenRequest,
  registrarMovimientoAlmacenRequest,
} from "../api/almacen";
import {
  DEFAULT_PAGINATION,
  createPaginationParams,
  normalizeCollection,
  normalizePagination,
  normalizeResource,
  sameRecordId,
} from "../utils/apiData";

const AlmacenContext = createContext();

export const useAlmacen = () => {
  const context = useContext(AlmacenContext);

  if (!context) {
    throw new Error("useAlmacen debe usarse dentro de AlmacenProvider");
  }

  return context;
};

export function AlmacenProvider({ children }) {
  const [items, setItems] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [resumen, setResumen] = useState({ totalItems: 0, bajoStock: 0 });
  const [errors, setErrors] = useState([]);
  const [paginationItems, setPaginationItems] = useState(DEFAULT_PAGINATION);
  const [paginationMovimientos, setPaginationMovimientos] =
    useState(DEFAULT_PAGINATION);

  const limpiarErrores = useCallback(() => setErrors([]), []);

  const obtenerItems = useCallback(async (params = {}) => {
    try {
      limpiarErrores();
      const requestParams = createPaginationParams({
        page: params.page ?? 1,
        limit: params.limit ?? 10,
        search: params.search,
      });
      if (params.tipo) requestParams.tipo = params.tipo;
      if (params.estado) requestParams.estado = params.estado;
      if (params.bajoStock) requestParams.bajoStock = params.bajoStock;
      const res = await obtenerItemsAlmacenRequest(requestParams);
      const data = normalizeCollection(res.data, ["items"]);
      setItems(data);
      setResumen(res.data?.resumen || { totalItems: 0, bajoStock: 0 });
      setPaginationItems(normalizePagination(res.data, DEFAULT_PAGINATION));
      return data;
    } catch (error) {
      setErrors([error.response?.data?.message || "Error al obtener almacén"]);
      return [];
    }
  }, [limpiarErrores]);

  const crearItem = useCallback(async (data) => {
    try {
      limpiarErrores();
      const res = await crearItemAlmacenRequest(data);
      const item = normalizeResource(res.data, ["item"]);
      if (item) setItems((prev) => [item, ...prev]);
      return res.data;
    } catch (error) {
      setErrors([error.response?.data?.message || "Error al crear artículo"]);
      throw error;
    }
  }, [limpiarErrores]);

  const actualizarItem = useCallback(async (id, data) => {
    try {
      limpiarErrores();
      const res = await actualizarItemAlmacenRequest(id, data);
      const item = normalizeResource(res.data, ["item"]);
      setItems((prev) =>
        prev.map((actual) => (sameRecordId(actual, id) ? item || actual : actual))
      );
      return res.data;
    } catch (error) {
      setErrors([error.response?.data?.message || "Error al actualizar artículo"]);
      throw error;
    }
  }, [limpiarErrores]);

  const cambiarEstadoItem = useCallback(async (id, estado) => {
    try {
      limpiarErrores();
      const res = await cambiarEstadoItemAlmacenRequest(id, estado);
      const item = normalizeResource(res.data, ["item"]);
      setItems((prev) =>
        prev.map((actual) => (sameRecordId(actual, id) ? item || actual : actual))
      );
      return res.data;
    } catch (error) {
      setErrors([error.response?.data?.message || "Error al cambiar estado"]);
      throw error;
    }
  }, [limpiarErrores]);

  const registrarMovimiento = useCallback(async (id, data) => {
    try {
      limpiarErrores();
      const res = await registrarMovimientoAlmacenRequest(id, data);
      const item = normalizeResource(res.data, ["item"]);
      const movimiento = normalizeResource(res.data, ["movimiento"]);
      if (item) {
        setItems((prev) =>
          prev.map((actual) => (sameRecordId(actual, id) ? item : actual))
        );
      }
      if (movimiento) setMovimientos((prev) => [movimiento, ...prev]);
      return res.data;
    } catch (error) {
      setErrors([error.response?.data?.message || "Error al registrar movimiento"]);
      throw error;
    }
  }, [limpiarErrores]);

  const obtenerMovimientos = useCallback(async (id, params = {}) => {
    try {
      limpiarErrores();
      const requestParams = createPaginationParams({
        page: params.page ?? 1,
        limit: params.limit ?? 10,
      });
      const res = await obtenerMovimientosAlmacenRequest(id, requestParams);
      const data = normalizeCollection(res.data, ["movimientos"]);
      setMovimientos(data);
      setPaginationMovimientos(normalizePagination(res.data, DEFAULT_PAGINATION));
      return data;
    } catch (error) {
      setErrors([error.response?.data?.message || "Error al obtener movimientos"]);
      return [];
    }
  }, [limpiarErrores]);

  return (
    <AlmacenContext.Provider
      value={{
        items,
        movimientos,
        resumen,
        errors,
        paginationItems,
        paginationMovimientos,
        obtenerItems,
        crearItem,
        actualizarItem,
        cambiarEstadoItem,
        registrarMovimiento,
        obtenerMovimientos,
      }}
    >
      {children}
    </AlmacenContext.Provider>
  );
}
