import { useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  DatabaseBackup,
  Download,
  HardDriveDownload,
  RefreshCw,
  Save,
  ShieldAlert,
} from "lucide-react";
import {
  actualizarProgramacionBackupsRequest,
  descargarBackupRequest,
  generarBackupRequest,
  listarBackupsRequest,
  obtenerPanelBackupsRequest,
} from "../api/backups";
import { useAuth } from "../context/AuthContext";
import { notify } from "../utils/notify";

const initialSchedule = {
  enabled: false,
  frequency: "daily",
  time: "02:00",
  dayOfWeek: 0,
  retentionDays: 14,
};

const APP_TIME_ZONE = "America/Lima";

const dayOptions = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
];

const formatBytes = (bytes) => {
  const value = Number(bytes || 0);
  if (!value) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(
    Math.floor(Math.log(value) / Math.log(1024)),
    units.length - 1
  );

  return `${(value / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};

const formatDateTime = (value) => {
  if (!value) return "Sin registro";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin registro";

  return new Intl.DateTimeFormat("es-PE", {
    timeZone: APP_TIME_ZONE,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const downloadBlob = (response, fallbackFilename) => {
  const contentDisposition = response.headers?.["content-disposition"] || "";
  const match = contentDisposition.match(/filename="?([^"]+)"?/i);
  const filename = match?.[1] || fallbackFilename;
  const url = URL.createObjectURL(response.data);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

function Metric({ label, value }) {
  return (
    <div className="info-tile min-w-0">
      <p className="text-faint text-xs font-bold uppercase">{label}</p>
      <p className="text-main mt-1 break-words text-sm font-extrabold">{value}</p>
    </div>
  );
}

function BackupsPage() {
  const { user } = useAuth();
  const [panel, setPanel] = useState(null);
  const [backups, setBackups] = useState([]);
  const [schedule, setSchedule] = useState(initialSchedule);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [downloading, setDownloading] = useState("");

  const isSuperadmin = user?.role === "Superadministrador";

  const cargarBackups = async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      const [panelRes, archivosRes] = await Promise.all([
        obtenerPanelBackupsRequest(),
        listarBackupsRequest(),
      ]);

      setPanel(panelRes.data || null);
      setBackups(Array.isArray(archivosRes.data) ? archivosRes.data : []);
      setSchedule({
        ...initialSchedule,
        ...(panelRes.data?.schedule || {}),
      });
    } catch (error) {
      notify.error(
        error.response?.data?.message || "No se pudo cargar copias de seguridad"
      );
      setPanel(null);
      setBackups([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarBackups();
  }, []);

  const totalBackupBytes = useMemo(
    () => backups.reduce((sum, backup) => sum + Number(backup.sizeBytes || 0), 0),
    [backups]
  );

  const handleScheduleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setSchedule((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const generarBackup = async () => {
    try {
      setGenerating(true);
      const res = await generarBackupRequest();
      notify.success(res.data?.message || "Backup generado correctamente");
      await cargarBackups({ silent: true });
    } catch (error) {
      notify.error(error.response?.data?.message || "No se pudo generar backup");
    } finally {
      setGenerating(false);
    }
  };

  const guardarProgramacion = async (event) => {
    event.preventDefault();

    try {
      setSavingSchedule(true);
      const res = await actualizarProgramacionBackupsRequest({
        ...schedule,
        dayOfWeek: Number(schedule.dayOfWeek),
        retentionDays: Number(schedule.retentionDays),
      });
      setSchedule({
        ...initialSchedule,
        ...(res.data?.schedule || schedule),
      });
      notify.success("Programación guardada");
      await cargarBackups({ silent: true });
    } catch (error) {
      notify.error(
        error.response?.data?.message || "No se pudo guardar la programación"
      );
    } finally {
      setSavingSchedule(false);
    }
  };

  const descargarBackup = async (filename) => {
    try {
      setDownloading(filename);
      const res = await descargarBackupRequest(filename);
      downloadBlob(res, filename);
    } catch (error) {
      notify.error(error.response?.data?.message || "No se pudo descargar backup");
    } finally {
      setDownloading("");
    }
  };

  const lastBackup = panel?.lastBackup || backups[0] || null;
  const isBusy = panel?.backupInProgress || panel?.restoreInProgress;

  return (
    <div className="page">
      <div className="page-wrap">
        <header className="page-hero">
          <div className="page-hero-content">
            <div>
              <div className="eyebrow">Administración</div>
              <h1 className="page-title">Copias de seguridad</h1>
              <p className="page-description">
                Genera, descarga, programa y restaura respaldos de la base de datos.
              </p>
            </div>

            <div className="page-actions">
              <button
                type="button"
                onClick={() => cargarBackups({ silent: true })}
                disabled={loading}
                className="btn-secondary gap-2 px-4 py-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Actualizar
              </button>
              <button
                type="button"
                onClick={generarBackup}
                disabled={generating || isBusy}
                className="btn-primary gap-2 px-4 py-2"
              >
                <DatabaseBackup
                  className={`h-4 w-4 ${generating ? "animate-spin" : ""}`}
                />
                {generating ? "Generando..." : "Generar backup"}
              </button>
            </div>
          </div>
        </header>

        {loading ? (
          <section className="loading-panel">
            <div className="loading-spinner" />
            <p className="text-muted text-sm">Cargando copias de seguridad...</p>
          </section>
        ) : (
          <div className="space-y-4">
            <section className="grid gap-4 lg:grid-cols-4">
              <Metric
                label="Último backup"
                value={formatDateTime(lastBackup?.modifiedAt)}
              />
              <Metric label="Total backups" value={panel?.totalBackups || backups.length} />
              <Metric label="Espacio usado" value={formatBytes(totalBackupBytes)} />
              <Metric
                label="Estado"
                value={
                  panel?.restoreInProgress
                    ? "Restaurando"
                    : panel?.backupInProgress
                      ? "Generando"
                      : "Disponible"
                }
              />
            </section>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
              <section className="panel p-5 sm:p-6">
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-main text-base font-extrabold">
                      Backups generados
                    </h2>
                    <p className="text-muted mt-1 text-sm">
                      Descarga respaldos o restaura uno anterior con rol superadmin.
                    </p>
                  </div>
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] text-sky-300">
                    <HardDriveDownload className="h-5 w-5" />
                  </div>
                </div>

                {backups.length === 0 ? (
                  <div className="empty-panel">
                    <h3 className="text-main text-base font-semibold">
                      Aún no hay backups
                    </h3>
                    <p className="text-muted mt-1 text-sm">
                      Genera una copia manual para iniciar el historial.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-lg border border-[var(--app-border)]">
                    <div className="table-scroll">
                      <table className="min-w-full text-left text-sm">
                        <thead className="bg-[var(--app-surface)] text-xs uppercase text-[var(--app-muted)]">
                          <tr>
                            <th className="px-4 py-3">Archivo</th>
                            <th className="px-4 py-3">Fecha</th>
                            <th className="px-4 py-3">Tamaño</th>
                            <th className="px-4 py-3 text-right">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--app-border)]">
                          {backups.map((backup) => (
                            <tr key={backup.filename}>
                              <td className="px-4 py-3">
                                <p className="text-main break-all font-semibold">
                                  {backup.filename}
                                </p>
                              </td>
                              <td className="px-4 py-3 text-[var(--app-muted)]">
                                {formatDateTime(backup.modifiedAt)}
                              </td>
                              <td className="px-4 py-3 text-[var(--app-muted)]">
                                {formatBytes(backup.sizeBytes)}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => descargarBackup(backup.filename)}
                                    disabled={downloading === backup.filename}
                                    className="btn-secondary btn-icon h-9 w-9 min-w-9"
                                    title="Descargar backup"
                                    aria-label="Descargar backup"
                                  >
                                    <Download className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </section>

              <aside className="space-y-4">
                <form onSubmit={guardarProgramacion} className="panel p-5 sm:p-6">
                  <div className="mb-5 flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-main text-base font-extrabold">
                        Programación automática
                      </h2>
                      <p className="text-muted mt-1 text-sm">
                        Define cuándo se generarán respaldos sin intervención manual.
                      </p>
                    </div>
                    <CalendarClock className="h-5 w-5 text-sky-300" />
                  </div>

                  <div className="space-y-4">
                    <label className="flex items-center justify-between gap-3 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3">
                      <span>
                        <span className="text-main block text-sm font-bold">
                          Backups automáticos
                        </span>
                        <span className="text-muted text-xs">
                          Ejecutar según esta programación
                        </span>
                      </span>
                      <input
                        type="checkbox"
                        name="enabled"
                        checked={schedule.enabled}
                        onChange={handleScheduleChange}
                        className="h-5 w-5"
                      />
                    </label>

                    <label className="space-y-1">
                      <span className="text-muted text-xs font-semibold uppercase">
                        Frecuencia
                      </span>
                      <select
                        name="frequency"
                        value={schedule.frequency}
                        onChange={handleScheduleChange}
                        className="input"
                      >
                        <option value="daily">Diario</option>
                        <option value="weekly">Semanal</option>
                      </select>
                    </label>

                    {schedule.frequency === "weekly" && (
                      <label className="space-y-1">
                        <span className="text-muted text-xs font-semibold uppercase">
                          Día de ejecución
                        </span>
                        <select
                          name="dayOfWeek"
                          value={schedule.dayOfWeek}
                          onChange={handleScheduleChange}
                          className="input"
                        >
                          {dayOptions.map((day) => (
                            <option key={day.value} value={day.value}>
                              {day.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}

                    <label className="space-y-1">
                      <span className="text-muted text-xs font-semibold uppercase">
                        Hora Perú/Lima
                      </span>
                      <input
                        type="time"
                        name="time"
                        value={schedule.time}
                        onChange={handleScheduleChange}
                        className="input"
                      />
                    </label>

                    <label className="space-y-1">
                      <span className="text-muted text-xs font-semibold uppercase">
                        Retención en días
                      </span>
                      <input
                        type="number"
                        name="retentionDays"
                        min="1"
                        max="365"
                        value={schedule.retentionDays}
                        onChange={handleScheduleChange}
                        className="input"
                      />
                    </label>

                    <button
                      type="submit"
                      disabled={savingSchedule}
                      className="btn-primary w-full gap-2 px-4 py-2"
                    >
                      <Save className="h-4 w-4" />
                      {savingSchedule ? "Guardando..." : "Guardar programación"}
                    </button>
                  </div>
                </form>

                {!isSuperadmin && (
                  <section className="panel border-amber-500/30 p-5">
                    <div className="flex gap-3">
                      <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
                      <div>
                        <h2 className="text-main text-sm font-extrabold">
                          Restauración restringida
                        </h2>
                        <p className="text-muted mt-1 text-sm">
                          Solo el rol Superadministrador puede restaurar backups.
                        </p>
                      </div>
                    </div>
                  </section>
                )}

                {isSuperadmin && (
                  <section className="panel border-amber-500/30 p-5">
                    <div className="flex gap-3">
                      <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
                      <div>
                        <h2 className="text-main text-sm font-extrabold">
                          Restauración asistida
                        </h2>
                        <p className="text-muted mt-1 text-sm">
                          Por seguridad, la restauración no se ejecuta desde el panel.
                          Primero descarga el backup y solicita una restauración
                          controlada en servidor.
                        </p>
                      </div>
                    </div>
                  </section>
                )}
              </aside>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default BackupsPage;
