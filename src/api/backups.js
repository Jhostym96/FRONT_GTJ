import axios from "./axios";

export const obtenerPanelBackupsRequest = () =>
  axios.get("/backups", { params: { _t: Date.now() } });

export const listarBackupsRequest = () =>
  axios.get("/backups/archivos", { params: { _t: Date.now() } });

export const generarBackupRequest = () => axios.post("/backups");

export const obtenerProgramacionBackupsRequest = () =>
  axios.get("/backups/programacion", { params: { _t: Date.now() } });

export const actualizarProgramacionBackupsRequest = (data) =>
  axios.put("/backups/programacion", data);

export const descargarBackupRequest = (filename) =>
  axios.get(`/backups/descargar/${encodeURIComponent(filename)}`, {
    responseType: "blob",
  });

export const restaurarBackupRequest = (filename) =>
  axios.post(`/backups/restaurar/${encodeURIComponent(filename)}`);

