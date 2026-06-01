import { createContext, useCallback, useContext, useState } from "react";
import {
  crearGuiaTransportistaRequest,
  validarGuiaTransportistaRequest,
  obtenerGuiasTransportistaRequest,
  obtenerGuiaTransportistaRequest,
  obtenerHistorialGuiaTransportistaRequest,
  generarJsonGuiaTransportistaRequest,
  enviarGuiaTransportistaNubefactRequest,
  consultarGuiaTransportistaRequest,
  actualizarGuiaTransportistaRequest,
  anularGuiaTransportistaRequest,
  obtenerUrlTicketGuiaTransportistaRequest,
  obtenerPdfOficialGuiaTransportistaRequest,
} from "../api/guiaTransportista";
import {
  obtenerMensajeErrorApi,
  obtenerMensajesErrorApi,
} from "../utils/apiErrorMessages";
import {
  DEFAULT_PAGINATION,
  createPaginationParams,
  normalizeCollection,
  normalizePagination,
  normalizeResource,
  sameRecordId,
} from "../utils/apiData";

const GuiaTransportistaContext = createContext();

export const useGuiaTransportista = () => {
  const context = useContext(GuiaTransportistaContext);

  if (!context) {
    throw new Error(
      "useGuiaTransportista debe usarse dentro de un GuiaTransportistaProvider"
    );
  }

  return context;
};

export const GuiaTransportistaProvider = ({ children }) => {
  const [guiasTransportista, setGuiasTransportista] = useState([]);
  const [guiaSeleccionada, setGuiaSeleccionada] = useState(null);
  const [jsonGuia, setJsonGuia] = useState(null);
  const [loadingGuia, setLoadingGuia] = useState(false);
  const [errorsGuia, setErrorsGuia] = useState([]);
  const [paginationGuias, setPaginationGuias] = useState(DEFAULT_PAGINATION);

  const limpiarErroresGuia = useCallback(() => {
    setErrorsGuia([]);
  }, []);

  const obtenerMensajeError = async (error, mensajePorDefecto) => {
    const data = error.response?.data;

    if (data instanceof Blob) {
      try {
        const texto = await data.text();
        const json = JSON.parse(texto);
        return obtenerMensajeErrorApi(json, mensajePorDefecto);
      } catch {
        return mensajePorDefecto;
      }
    }

    return obtenerMensajeErrorApi(data, mensajePorDefecto);
  };

  const obtenerGuiasTransportista = useCallback(async (params = {}) => {
    try {
      setLoadingGuia(true);
      const requestParams = createPaginationParams({
        page: params.page ?? 1,
        limit: params.limit ?? 10,
        search: params.search,
      });
      const res = await obtenerGuiasTransportistaRequest(requestParams);
      const data = normalizeCollection(res.data, ["guias", "guiasTransportista"]);
      setGuiasTransportista(data);
      setPaginationGuias(
        normalizePagination(res.data, DEFAULT_PAGINATION)
      );
    } catch (error) {
      setErrorsGuia(
        obtenerMensajesErrorApi(
          error,
          "Error al obtener las guías de transportista"
        )
      );
    } finally {
      setLoadingGuia(false);
    }
  }, []);

  const obtenerGuiaTransportista = async (id) => {
    try {
      setLoadingGuia(true);
      const res = await obtenerGuiaTransportistaRequest(id);
      const guia = normalizeResource(res.data, ["guia"]);
      setGuiaSeleccionada(guia);
      return guia;
    } catch (error) {
      setErrorsGuia(
        obtenerMensajesErrorApi(
          error,
          "Error al obtener la guía de transportista"
        )
      );
      throw error;
    } finally {
      setLoadingGuia(false);
    }
  };

  const crearGuiaTransportista = async (guia) => {
    try {
      setLoadingGuia(true);
      limpiarErroresGuia();

      const res = await crearGuiaTransportistaRequest(guia);
      const guiaCreada = normalizeResource(res.data, ["guia"]);

      if (guiaCreada) {
        setGuiasTransportista((prev) => [guiaCreada, ...prev]);
      }
      setJsonGuia(res.data.json);

      return res.data;
    } catch (error) {
      setErrorsGuia(
        obtenerMensajesErrorApi(
          error,
          "Error al crear la guía de transportista"
        )
      );
      throw error;
    } finally {
      setLoadingGuia(false);
    }
  };

  const actualizarGuiaTransportista = async (id, datos) => {
    try {
      setLoadingGuia(true);
      limpiarErroresGuia();

      const res = await actualizarGuiaTransportistaRequest(id, datos);
      const guiaActualizada = normalizeResource(res.data, ["guia"]);

      setGuiasTransportista((prev) =>
        prev.map((guia) => (sameRecordId(guia, id) ? guiaActualizada || guia : guia))
      );

      setJsonGuia(res.data.json);

      if (guiaSeleccionada?._id === id) {
        setGuiaSeleccionada(guiaActualizada);
      }

      return res.data;
    } catch (error) {
      setErrorsGuia(
        obtenerMensajesErrorApi(
          error,
          "Error al actualizar la guía de transportista"
        )
      );
      throw error;
    } finally {
      setLoadingGuia(false);
    }
  };

  const generarJsonGuiaTransportista = async (id) => {
    try {
      setLoadingGuia(true);
      limpiarErroresGuia();

      const res = await generarJsonGuiaTransportistaRequest(id);

      setJsonGuia(res.data.json);

      return res.data.json;
    } catch (error) {
      setErrorsGuia(
        obtenerMensajesErrorApi(error, "Error al generar el JSON de la guía")
      );
      throw error;
    } finally {
      setLoadingGuia(false);
    }
  };

  const consultarGuiaTransportista = async (id) => {
    try {
      setLoadingGuia(true);
      limpiarErroresGuia();

      const res = await consultarGuiaTransportistaRequest(id);
      const guiaActualizada = normalizeResource(res.data, ["guia"]);

      setGuiasTransportista((prev) =>
        prev.map((guia) => (sameRecordId(guia, id) ? guiaActualizada || guia : guia))
      );

      if (sameRecordId(guiaSeleccionada, id)) {
        setGuiaSeleccionada(guiaActualizada);
      }

      return res.data;
    } catch (error) {
      setErrorsGuia(
        obtenerMensajesErrorApi(
          error,
          "Error al consultar la guía en Nubefact/SUNAT"
        )
      );
      throw error;
    } finally {
      setLoadingGuia(false);
    }
  };

  const enviarGuiaTransportistaNubefact = async (id) => {
    try {
      setLoadingGuia(true);
      limpiarErroresGuia();

      const res = await enviarGuiaTransportistaNubefactRequest(id);
      const guiaActualizada = normalizeResource(res.data, ["guia"]);

      setGuiasTransportista((prev) =>
        prev.map((guia) => (sameRecordId(guia, id) ? guiaActualizada || guia : guia))
      );

      if (sameRecordId(guiaSeleccionada, id)) {
        setGuiaSeleccionada(guiaActualizada);
      }

      setJsonGuia(res.data.json || null);

      return res.data;
    } catch (error) {
      setErrorsGuia(
        obtenerMensajesErrorApi(
          error,
          "Error al enviar la guía a Nubefact"
        )
      );
      throw error;
    } finally {
      setLoadingGuia(false);
    }
  };

  const anularGuiaTransportista = async (id, datos = {}) => {
    try {
      setLoadingGuia(true);
      limpiarErroresGuia();

      const res = await anularGuiaTransportistaRequest(id, datos);
      const guiaActualizada = normalizeResource(res.data, ["guia"]);

      setGuiasTransportista((prev) =>
        prev.map((guia) => (sameRecordId(guia, id) ? guiaActualizada || guia : guia))
      );

      if (sameRecordId(guiaSeleccionada, id)) {
        setGuiaSeleccionada(guiaActualizada);
      }

      return res.data;
    } catch (error) {
      setErrorsGuia(
        obtenerMensajesErrorApi(
          error,
          "Error al anular la guía de transportista"
        )
      );
      throw error;
    } finally {
      setLoadingGuia(false);
    }
  };

  const obtenerUrlTicketGuiaTransportista = async (id) => {
    try {
      setLoadingGuia(true);
      limpiarErroresGuia();

      const res = await obtenerUrlTicketGuiaTransportistaRequest(id);

      return res.data?.url || res.data?.enlace_pdf || "";
    } catch (error) {
      setErrorsGuia(
        obtenerMensajesErrorApi(
          error,
          "Error al obtener el PDF oficial de Nubefact"
        )
      );
      throw error;
    } finally {
      setLoadingGuia(false);
    }
  };

  const validarGuiaTransportista = async (guia) => {
    try {
      setLoadingGuia(true);
      limpiarErroresGuia();

      const res = await validarGuiaTransportistaRequest(guia);

      setJsonGuia(res.data.json || null);

      return res.data;
    } catch (error) {
      setErrorsGuia(
        obtenerMensajesErrorApi(
          error,
          "La guía tiene datos pendientes por corregir"
        )
      );
      throw error;
    } finally {
      setLoadingGuia(false);
    }
  };

  const obtenerHistorialGuiaTransportista = async (id) => {
    try {
      setLoadingGuia(true);
      limpiarErroresGuia();

      const res = await obtenerHistorialGuiaTransportistaRequest(id);

      return res.data;
    } catch (error) {
      setErrorsGuia(
        obtenerMensajesErrorApi(error, "Error al obtener el historial de la guía")
      );
      throw error;
    } finally {
      setLoadingGuia(false);
    }
  };

  const abrirPdfOficialGuiaTransportista = async (id) => {
    try {
      setLoadingGuia(true);
      limpiarErroresGuia();

      const res = await obtenerPdfOficialGuiaTransportistaRequest(id);

      const blob = new Blob([res.data], {
        type: "application/pdf",
      });

      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");

      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 30000);

      return true;
    } catch (error) {
      const mensaje = await obtenerMensajeError(
        error,
        "Error al abrir el PDF oficial de Nubefact"
      );

      setErrorsGuia([mensaje]);
      throw new Error(mensaje);
    } finally {
      setLoadingGuia(false);
    }
  };

  return (
    <GuiaTransportistaContext.Provider
      value={{
        guiasTransportista,
        guiaSeleccionada,
        jsonGuia,
        loadingGuia,
        errorsGuia,
        paginationGuias,
        obtenerGuiasTransportista,
        obtenerGuiaTransportista,
        validarGuiaTransportista,
        obtenerHistorialGuiaTransportista,
        crearGuiaTransportista,
        actualizarGuiaTransportista,
        generarJsonGuiaTransportista,
        enviarGuiaTransportistaNubefact,
        consultarGuiaTransportista,
        anularGuiaTransportista,
        obtenerUrlTicketGuiaTransportista,
        abrirPdfOficialGuiaTransportista,
        limpiarErroresGuia,
      }}
    >
      {children}
    </GuiaTransportistaContext.Provider>
  );
};
