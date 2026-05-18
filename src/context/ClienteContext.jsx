import { createContext, useContext, useState } from "react";

import {
  getClientesRequest,
  getClienteRequest,
  createClienteRequest,
  updateClienteRequest,
  deleteClienteRequest,
  getRemitentesByClienteRequest,
  addRemitenteRequest,
  addDireccionRemitenteRequest,
  getDestinatariosByClienteRequest,
  addDestinatarioRequest,
  addDireccionDestinatarioRequest,
} from "../api/clientes";
import {
  DEFAULT_PAGINATION,
  createPaginationParams,
  normalizeCollection,
  normalizePagination,
} from "../utils/apiData";

const ClienteContext = createContext();

export const useClientes = () => {
  const context = useContext(ClienteContext);

  if (!context) {
    throw new Error("useClientes debe usarse dentro de un ClienteProvider");
  }

  return context;
};

export const ClienteProvider = ({ children }) => {
  const [clientes, setClientes] = useState([]);
  const [cliente, setCliente] = useState(null);

  const [remitentes, setRemitentes] = useState([]);
  const [destinatarios, setDestinatarios] = useState([]);

  const [errorsCliente, setErrorsCliente] = useState([]);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [paginationClientes, setPaginationClientes] =
    useState(DEFAULT_PAGINATION);

  // =========================
  // Manejo de errores
  // =========================
  const obtenerMensajeError = (error) => {
    console.error("Error completo:", error);

    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Respuesta backend:", error.response.data);
    }

    const data = error.response?.data;

    if (!data) {
      return "No se pudo conectar con el servidor";
    }

    if (typeof data === "string") {
      return data;
    }

    if (data.message) {
      return data.message;
    }

    if (data.error) {
      return data.error;
    }

    if (data.errors) {
      if (Array.isArray(data.errors)) {
        return data.errors.join(", ");
      }

      return data.errors;
    }

    return "Ocurrió un error inesperado";
  };

  const handleError = (error) => {
    const mensaje = obtenerMensajeError(error);
    setErrorsCliente([mensaje]);
    return mensaje;
  };

  const limpiarErroresCliente = () => {
    setErrorsCliente([]);
  };

  const obtenerClienteDesdeRespuesta = (data) => {
    return data?.cliente || data?.nuevoCliente || data?.clienteGuardado || data;
  };

  // =========================
  // CLIENTES
  // =========================
  const getClientes = async (params = {}) => {
    try {
      setLoadingClientes(true);
      limpiarErroresCliente();

      const requestParams = createPaginationParams({
        page: params.page ?? 1,
        limit: params.limit ?? 10,
        search: params.search,
      });
      const res = await getClientesRequest(requestParams);

      const data = normalizeCollection(res.data, ["clientes"]);

      setClientes(data);
      setPaginationClientes(
        normalizePagination(res.data, DEFAULT_PAGINATION)
      );

      return data;
    } catch (error) {
      const mensaje = handleError(error);

      return {
        ok: false,
        error: mensaje,
      };
    } finally {
      setLoadingClientes(false);
    }
  };

  const getCliente = async (id) => {
    try {
      setLoadingClientes(true);
      limpiarErroresCliente();

      const res = await getClienteRequest(id);

      const clienteEncontrado = obtenerClienteDesdeRespuesta(res.data);

      setCliente(clienteEncontrado);

      return clienteEncontrado;
    } catch (error) {
      const mensaje = handleError(error);

      return {
        ok: false,
        error: mensaje,
      };
    } finally {
      setLoadingClientes(false);
    }
  };

  const createCliente = async (clienteData) => {
    try {
      setLoadingClientes(true);
      limpiarErroresCliente();

      const res = await createClienteRequest(clienteData);

      const clienteCreado = obtenerClienteDesdeRespuesta(res.data);

      if (!clienteCreado) {
        throw new Error("El backend no devolvió el cliente creado");
      }

      setClientes((prev) => [...prev, clienteCreado]);

      return {
        ok: true,
        cliente: clienteCreado,
        message: res.data?.message || "Cliente creado correctamente",
      };
    } catch (error) {
      const mensaje = handleError(error);

      return {
        ok: false,
        error: mensaje,
      };
    } finally {
      setLoadingClientes(false);
    }
  };

  const updateCliente = async (id, clienteData) => {
    try {
      setLoadingClientes(true);
      limpiarErroresCliente();

      const res = await updateClienteRequest(id, clienteData);

      const clienteActualizado = obtenerClienteDesdeRespuesta(res.data);

      setClientes((prev) =>
        prev.map((item) =>
          item._id === id || item.id === id ? clienteActualizado : item
        )
      );

      if (cliente?._id === id || cliente?.id === id) {
        setCliente(clienteActualizado);
      }

      return {
        ok: true,
        cliente: clienteActualizado,
        message: res.data?.message || "Cliente actualizado correctamente",
      };
    } catch (error) {
      const mensaje = handleError(error);

      return {
        ok: false,
        error: mensaje,
      };
    } finally {
      setLoadingClientes(false);
    }
  };

  const deleteCliente = async (id) => {
    try {
      setLoadingClientes(true);
      limpiarErroresCliente();

      const res = await deleteClienteRequest(id);

      setClientes((prev) =>
        prev.filter((item) => item._id !== id && item.id !== id)
      );

      if (cliente?._id === id || cliente?.id === id) {
        setCliente(null);
      }

      return {
        ok: true,
        message: res.data?.message || "Cliente eliminado correctamente",
      };
    } catch (error) {
      const mensaje = handleError(error);

      return {
        ok: false,
        error: mensaje,
      };
    } finally {
      setLoadingClientes(false);
    }
  };

  // =========================
  // REMITENTES
  // =========================
  const getRemitentesByCliente = async (clienteId) => {
    try {
      setLoadingClientes(true);
      limpiarErroresCliente();

      const res = await getRemitentesByClienteRequest(clienteId);

      const data = Array.isArray(res.data)
        ? res.data
        : res.data?.remitentes || [];

      setRemitentes(data);

      return data;
    } catch (error) {
      const mensaje = handleError(error);
      setRemitentes([]);

      return {
        ok: false,
        error: mensaje,
      };
    } finally {
      setLoadingClientes(false);
    }
  };

  const addRemitente = async (clienteId, remitenteData) => {
    try {
      setLoadingClientes(true);
      limpiarErroresCliente();

      const res = await addRemitenteRequest(clienteId, remitenteData);

      const clienteActualizado = obtenerClienteDesdeRespuesta(res.data);

      setCliente(clienteActualizado);
      setRemitentes(clienteActualizado?.remitentes || []);

      setClientes((prev) =>
        prev.map((item) =>
          item._id === clienteId || item.id === clienteId
            ? clienteActualizado
            : item
        )
      );

      return {
        ok: true,
        cliente: clienteActualizado,
        message: res.data?.message || "Remitente agregado correctamente",
      };
    } catch (error) {
      const mensaje = handleError(error);

      return {
        ok: false,
        error: mensaje,
      };
    } finally {
      setLoadingClientes(false);
    }
  };

  const addDireccionRemitente = async (
    clienteId,
    remitenteId,
    direccionData
  ) => {
    try {
      setLoadingClientes(true);
      limpiarErroresCliente();

      const res = await addDireccionRemitenteRequest(
        clienteId,
        remitenteId,
        direccionData
      );

      const clienteActualizado = obtenerClienteDesdeRespuesta(res.data);

      setCliente(clienteActualizado);
      setRemitentes(clienteActualizado?.remitentes || []);

      setClientes((prev) =>
        prev.map((item) =>
          item._id === clienteId || item.id === clienteId
            ? clienteActualizado
            : item
        )
      );

      return {
        ok: true,
        cliente: clienteActualizado,
        message: res.data?.message || "Dirección agregada correctamente",
      };
    } catch (error) {
      const mensaje = handleError(error);

      return {
        ok: false,
        error: mensaje,
      };
    } finally {
      setLoadingClientes(false);
    }
  };

  // =========================
  // DESTINATARIOS
  // =========================
  const getDestinatariosByCliente = async (clienteId) => {
    try {
      setLoadingClientes(true);
      limpiarErroresCliente();

      const res = await getDestinatariosByClienteRequest(clienteId);

      const data = Array.isArray(res.data)
        ? res.data
        : res.data?.destinatarios || [];

      setDestinatarios(data);

      return data;
    } catch (error) {
      const mensaje = handleError(error);
      setDestinatarios([]);

      return {
        ok: false,
        error: mensaje,
      };
    } finally {
      setLoadingClientes(false);
    }
  };

  const addDestinatario = async (clienteId, destinatarioData) => {
    try {
      setLoadingClientes(true);
      limpiarErroresCliente();

      const res = await addDestinatarioRequest(clienteId, destinatarioData);

      const clienteActualizado = obtenerClienteDesdeRespuesta(res.data);

      setCliente(clienteActualizado);
      setDestinatarios(clienteActualizado?.destinatarios || []);

      setClientes((prev) =>
        prev.map((item) =>
          item._id === clienteId || item.id === clienteId
            ? clienteActualizado
            : item
        )
      );

      return {
        ok: true,
        cliente: clienteActualizado,
        message: res.data?.message || "Destinatario agregado correctamente",
      };
    } catch (error) {
      const mensaje = handleError(error);

      return {
        ok: false,
        error: mensaje,
      };
    } finally {
      setLoadingClientes(false);
    }
  };

  const addDireccionDestinatario = async (
    clienteId,
    destinatarioId,
    direccionData
  ) => {
    try {
      setLoadingClientes(true);
      limpiarErroresCliente();

      const res = await addDireccionDestinatarioRequest(
        clienteId,
        destinatarioId,
        direccionData
      );

      const clienteActualizado = obtenerClienteDesdeRespuesta(res.data);

      setCliente(clienteActualizado);
      setDestinatarios(clienteActualizado?.destinatarios || []);

      setClientes((prev) =>
        prev.map((item) =>
          item._id === clienteId || item.id === clienteId
            ? clienteActualizado
            : item
        )
      );

      return {
        ok: true,
        cliente: clienteActualizado,
        message: res.data?.message || "Dirección agregada correctamente",
      };
    } catch (error) {
      const mensaje = handleError(error);

      return {
        ok: false,
        error: mensaje,
      };
    } finally {
      setLoadingClientes(false);
    }
  };

  // =========================
  // Limpiar selects dependientes
  // =========================
  const limpiarDatosRelacionados = () => {
    setRemitentes([]);
    setDestinatarios([]);
  };

  return (
    <ClienteContext.Provider
      value={{
        clientes,
        cliente,
        remitentes,
        destinatarios,
        errorsCliente,
        loadingClientes,
        paginationClientes,

        getClientes,
        getCliente,
        createCliente,
        updateCliente,
        deleteCliente,

        getRemitentesByCliente,
        addRemitente,
        addDireccionRemitente,

        getDestinatariosByCliente,
        addDestinatario,
        addDireccionDestinatario,

        limpiarErroresCliente,
        limpiarDatosRelacionados,
      }}
    >
      {children}
    </ClienteContext.Provider>
  );
};
