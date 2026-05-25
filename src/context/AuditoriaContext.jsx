import { createContext, useCallback, useContext, useState } from "react";
import { obtenerAuditoriaRequest } from "../api/auditoria";
import {
  DEFAULT_PAGINATION,
  createPaginationParams,
  normalizeCollection,
  normalizePagination,
} from "../utils/apiData";

const AuditoriaContext = createContext();

export const useAuditoria = () => {
  const context = useContext(AuditoriaContext);

  if (!context) {
    throw new Error("useAuditoria debe usarse dentro de AuditoriaProvider");
  }

  return context;
};

export const AuditoriaProvider = ({ children }) => {
  const [auditoria, setAuditoria] = useState([]);
  const [paginationAuditoria, setPaginationAuditoria] =
    useState(DEFAULT_PAGINATION);
  const [loadingAuditoria, setLoadingAuditoria] = useState(false);
  const [errorsAuditoria, setErrorsAuditoria] = useState([]);

  const obtenerAuditoria = useCallback(async (params = {}) => {
    try {
      setLoadingAuditoria(true);
      setErrorsAuditoria([]);

      const requestParams = {
        ...createPaginationParams({
          page: params.page ?? 1,
          limit: params.limit ?? 10,
          search: params.search,
        }),
        ...(params.entidad ? { entidad: params.entidad } : {}),
        ...(params.accion ? { accion: params.accion } : {}),
      };

      const res = await obtenerAuditoriaRequest(requestParams);
      const data = normalizeCollection(res.data, ["auditoria"]);

      setAuditoria(data);
      setPaginationAuditoria(
        normalizePagination(res.data, DEFAULT_PAGINATION)
      );

      return data;
    } catch (error) {
      const message =
        error.response?.data?.message || "Error al obtener auditoría";
      setErrorsAuditoria([message]);
      return [];
    } finally {
      setLoadingAuditoria(false);
    }
  }, []);

  return (
    <AuditoriaContext.Provider
      value={{
        auditoria,
        paginationAuditoria,
        loadingAuditoria,
        errorsAuditoria,
        obtenerAuditoria,
      }}
    >
      {children}
    </AuditoriaContext.Provider>
  );
};
