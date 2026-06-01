import { createContext, useCallback, useContext, useState } from "react";
import {
  actualizarEmpresaConfigRequest,
  obtenerEmpresaConfigRequest,
} from "../api/empresaConfig";

const EmpresaConfigContext = createContext();

export const useEmpresaConfig = () => {
  const context = useContext(EmpresaConfigContext);

  if (!context) {
    throw new Error("useEmpresaConfig debe usarse dentro de EmpresaConfigProvider");
  }

  return context;
};

export function EmpresaConfigProvider({ children }) {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);

  const obtenerConfig = useCallback(async () => {
    try {
      setLoading(true);
      setErrors([]);
      const res = await obtenerEmpresaConfigRequest();
      const empresa = res.data?.config || res.data?.empresa || null;
      setConfig(empresa);
      return empresa;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "No se pudo obtener la configuración de empresa";
      setErrors([message]);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const actualizarConfig = useCallback(async (data) => {
    try {
      setErrors([]);
      const res = await actualizarEmpresaConfigRequest(data);
      const empresa = res.data?.config || res.data?.empresa || null;
      setConfig(empresa);
      return empresa;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "No se pudo actualizar la configuración de empresa";
      setErrors([message]);
      throw error;
    }
  }, []);

  return (
    <EmpresaConfigContext.Provider
      value={{
        config,
        loading,
        errors,
        obtenerConfig,
        actualizarConfig,
      }}
    >
      {children}
    </EmpresaConfigContext.Provider>
  );
}
