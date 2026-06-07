import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  CloudCog,
  Database,
  Download,
  HardDrive,
  RefreshCw,
  Server,
  ShieldAlert,
  Timer,
} from "lucide-react";
import { obtenerSaludSistemaRequest } from "../api/dashboard";
import { notify } from "../utils/notify";

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
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const formatDuration = (seconds) => {
  const total = Number(seconds || 0);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);

  if (days > 0) return `${days} d ${hours} h`;
  if (hours > 0) return `${hours} h ${minutes} min`;
  return `${minutes} min`;
};

const statusConfig = {
  OK: {
    label: "Operativo",
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    dot: "bg-emerald-400",
    Icon: CheckCircle2,
  },
  CONFIGURED: {
    label: "Configurado",
    className: "border-sky-500/30 bg-sky-500/10 text-sky-300",
    dot: "bg-sky-400",
    Icon: CheckCircle2,
  },
  DEGRADED: {
    label: "Atención",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    dot: "bg-amber-400",
    Icon: AlertTriangle,
  },
  DISABLED: {
    label: "Deshabilitado",
    className: "border-slate-500/30 bg-slate-500/10 text-slate-300",
    dot: "bg-slate-400",
    Icon: ShieldAlert,
  },
  UNKNOWN: {
    label: "Sin datos",
    className: "border-slate-500/30 bg-slate-500/10 text-slate-300",
    dot: "bg-slate-400",
    Icon: AlertTriangle,
  },
  DOWN: {
    label: "Caído",
    className: "border-red-500/30 bg-red-500/10 text-red-300",
    dot: "bg-red-400",
    Icon: AlertTriangle,
  },
};

const getStatus = (status) => statusConfig[status] || statusConfig.UNKNOWN;

function StatusBadge({ status }) {
  const config = getStatus(status);
  const Icon = config.Icon;

  return (
    <span
      className={`inline-flex min-h-8 items-center gap-2 rounded-md border px-3 py-1 text-xs font-extrabold uppercase ${config.className}`}
    >
      <Icon className="h-4 w-4" />
      {config.label}
    </span>
  );
}

function HealthCard({ icon: Icon, title, status, message, children }) {
  const config = getStatus(status);

  return (
    <section className="panel p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] text-sky-300">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${config.dot}`} />
              <h2 className="text-main text-base font-extrabold">{title}</h2>
            </div>
            <p className="text-muted mt-1 text-sm">{message || "Sin detalle"}</p>
          </div>
        </div>
        <StatusBadge status={status} />
      </div>
      {children && <div className="mt-5 grid gap-3 sm:grid-cols-2">{children}</div>}
    </section>
  );
}

function Metric({ label, value }) {
  return (
    <div className="info-tile min-w-0">
      <p className="text-faint text-xs font-bold uppercase">{label}</p>
      <p className="text-main mt-1 break-words text-sm font-extrabold">{value}</p>
    </div>
  );
}

function StorageBar({ percent = 0 }) {
  const value = Math.max(0, Math.min(Number(percent || 0), 100));
  const barClass =
    value >= 95 ? "bg-red-400" : value >= 85 ? "bg-amber-400" : "bg-emerald-400";

  return (
    <div className="sm:col-span-2">
      <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase text-[var(--app-muted)]">
        <span>Uso de almacenamiento</span>
        <span>{value}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full border border-[var(--app-border)] bg-[var(--app-surface)]">
        <div className={`h-full rounded-full ${barClass}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function SistemaSaludPage() {
  const [salud, setSalud] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const cargarSalud = async ({ silent = false } = {}) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const res = await obtenerSaludSistemaRequest();
      setSalud(res.data || null);
    } catch (error) {
      notify.error(
        error.response?.data?.message || "No se pudo cargar la salud del sistema"
      );
      setSalud(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    cargarSalud();
  }, []);

  const checks = salud?.checks || {};
  const api = checks.api || {};
  const database = checks.database || {};
  const backup = checks.backup || {};
  const storage = checks.storage || {};
  const nubefact = checks.externalServices?.nubefact || {};
  const whatsapp = checks.externalServices?.whatsapp || {};

  const summary = useMemo(
    () => [
      { label: "API", status: api.status },
      { label: "Base de datos", status: database.status },
      { label: "Backup", status: backup.status },
      { label: "Almacenamiento", status: storage.status },
      { label: "WhatsApp", status: whatsapp.status },
    ],
    [api.status, database.status, backup.status, storage.status, whatsapp.status]
  );

  const externalStatus =
    whatsapp.status === "DOWN" || nubefact.status === "DOWN"
      ? "DOWN"
      : whatsapp.status === "DISABLED" || nubefact.status === "DISABLED"
        ? "DEGRADED"
        : "OK";

  return (
    <div className="page">
      <div className="page-wrap">
        <header className="page-hero">
          <div className="page-hero-content">
            <div>
              <div className="eyebrow">Administración</div>
              <h1 className="page-title">Salud del sistema</h1>
              <p className="page-description">
                Monitoreo técnico de API, base de datos, servicios externos,
                backups y almacenamiento.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <StatusBadge status={salud?.status || "UNKNOWN"} />
              <button
                type="button"
                onClick={() => cargarSalud({ silent: true })}
                disabled={loading || refreshing}
                className="btn-secondary gap-2 px-4 py-2"
              >
                <RefreshCw
                  className={`h-4 w-4 ${refreshing || loading ? "animate-spin" : ""}`}
                />
                Actualizar
              </button>
            </div>
          </div>
        </header>

        {loading ? (
          <section className="loading-panel">
            <div className="loading-spinner" />
            <p className="text-muted text-sm">Cargando salud del sistema...</p>
          </section>
        ) : (
          <div className="space-y-4">
            <section className="panel p-5 sm:p-6">
              <div className="page-hero-content">
                <div>
                  <h2 className="text-main text-base font-extrabold">
                    Estado general
                  </h2>
                  <p className="text-muted mt-1 text-sm">
                    Última revisión: {formatDateTime(salud?.checkedAt)}
                  </p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                  {summary.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-md border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2"
                    >
                      <p className="text-faint text-[11px] font-bold uppercase">
                        {item.label}
                      </p>
                      <p className="text-main mt-1 text-xs font-extrabold">
                        {getStatus(item.status).label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <div className="grid gap-4 xl:grid-cols-2">
              <HealthCard
                icon={Server}
                title="API"
                status={api.status}
                message="Servidor backend respondiendo"
              >
                <Metric label="Entorno" value={api.environment || "-"} />
                <Metric label="Uptime" value={formatDuration(api.uptimeSeconds)} />
                <Metric label="Chequeado" value={formatDateTime(api.checkedAt)} />
                <Metric label="Timestamp" value={api.timestamp || "-"} />
              </HealthCard>

              <HealthCard
                icon={Database}
                title="Base de datos"
                status={database.status}
                message={database.message}
              >
                <Metric
                  label="Conexión"
                  value={database.connected ? "Conectada" : "Sin conexión"}
                />
                <Metric
                  label="Respuesta"
                  value={
                    database.responseTimeMs !== undefined
                      ? `${database.responseTimeMs} ms`
                      : "-"
                  }
                />
              </HealthCard>

              <HealthCard
                icon={CloudCog}
                title="Servicios externos"
                status={externalStatus}
                message="Integraciones configuradas para operación externa"
              >
                <Metric
                  label="Nubefact"
                  value={`${getStatus(nubefact.status).label} - ${nubefact.message || "-"}`}
                />
                <Metric
                  label="WhatsApp"
                  value={`${getStatus(whatsapp.status).label} - ${whatsapp.message || "-"}`}
                />
                <Metric label="WhatsApp URL" value={whatsapp.baseUrl || "-"} />
                <Metric
                  label="Respuesta WhatsApp"
                  value={
                    whatsapp.responseTimeMs !== undefined
                      ? `${whatsapp.responseTimeMs} ms`
                      : "No aplica"
                  }
                />
              </HealthCard>

              <HealthCard
                icon={Download}
                title="Último backup"
                status={backup.status}
                message={backup.message}
              >
                <Metric
                  label="Archivo"
                  value={backup.lastBackup?.filename || "Sin backup"}
                />
                <Metric
                  label="Fecha"
                  value={formatDateTime(backup.lastBackup?.modifiedAt)}
                />
                <Metric
                  label="Tamaño"
                  value={formatBytes(backup.lastBackup?.sizeBytes)}
                />
                <Metric
                  label="Programación"
                  value={
                    backup.schedule?.enabled
                      ? `${backup.schedule.frequency} ${backup.schedule.time}`
                      : "Desactivada"
                  }
                />
              </HealthCard>

              <HealthCard
                icon={HardDrive}
                title="Almacenamiento"
                status={storage.status}
                message={storage.message}
              >
                <Metric label="Total" value={formatBytes(storage.totalBytes)} />
                <Metric label="Usado" value={formatBytes(storage.usedBytes)} />
                <Metric label="Disponible" value={formatBytes(storage.availableBytes)} />
                <Metric label="Montaje" value={storage.mount || "-"} />
                <StorageBar percent={storage.usedPercent} />
              </HealthCard>

              <HealthCard
                icon={Activity}
                title="Operación de backups"
                status={backup.restoreInProgress ? "DEGRADED" : backup.status}
                message="Estado de tareas administrativas de respaldo"
              >
                <Metric label="Total backups" value={backup.totalBackups || 0} />
                <Metric
                  label="Espacio backups"
                  value={formatBytes(backup.totalBackupBytes)}
                />
                <Metric
                  label="Backup en curso"
                  value={backup.backupInProgress ? "Sí" : "No"}
                />
                <Metric
                  label="Restauración en curso"
                  value={backup.restoreInProgress ? "Sí" : "No"}
                />
              </HealthCard>
            </div>

            <section className="panel p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <Timer className="h-5 w-5 text-sky-300" />
                <div>
                  <h2 className="text-main text-base font-extrabold">
                    Revisión en tiempo real
                  </h2>
                  <p className="text-muted mt-1 text-sm">
                    Usa el botón actualizar para consultar datos sin cache del navegador.
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

export default SistemaSaludPage;
