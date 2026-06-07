import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Calendar,
  Hash,
  RefreshCw,
  Save,
  ShieldAlert,
} from "lucide-react";
import {
  actualizarCorrelativoRequest,
  listarCorrelativosRequest,
} from "../api/correlativos";
import { useAuth } from "../context/AuthContext";
import { useConfirm } from "../context/ConfirmContext";
import { notify } from "../utils/notify";

const currentYear = new Date().getFullYear();

const formatDateTime = (value) => {
  if (!value) return "Sin cambios manuales";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin cambios manuales";

  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

function Metric({ label, value, danger = false }) {
  return (
    <div className="info-tile min-w-0">
      <p className="text-faint text-xs font-bold uppercase">{label}</p>
      <p
        className={`mt-1 break-words text-sm font-extrabold ${
          danger ? "text-amber-300" : "text-main"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function CorrelativoCard({
  item,
  value,
  onChange,
  onSave,
  saving,
  canEdit,
}) {
  return (
    <section className="panel p-5 sm:p-6">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] text-sky-300">
            <Hash className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-main text-base font-extrabold">{item.label}</h2>
            <p className="text-muted mt-1 text-sm">{item.description}</p>
            <p className="text-faint mt-2 break-all text-xs font-semibold">
              {item.nombre}
            </p>
          </div>
        </div>
        {item.desfasado && (
          <span className="inline-flex min-h-8 items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-extrabold uppercase text-amber-300">
            <AlertTriangle className="h-4 w-4" />
            Desfasado
          </span>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Último usado" value={item.valorActual} />
        <Metric label="Siguiente" value={item.siguienteValor} />
        <Metric label="Ejemplo" value={item.ejemploSiguiente} />
        <Metric label="Máximo registrado" value={item.maxRegistrado} />
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto]">
        <label className="space-y-1">
          <span className="text-muted text-xs font-semibold uppercase">
            Último número usado
          </span>
          <input
            type="number"
            min={item.maxRegistrado}
            value={value}
            disabled={!canEdit}
            onChange={(event) => onChange(item.tipo, event.target.value)}
            className="input"
          />
        </label>

        <button
          type="button"
          onClick={() => onSave(item)}
          disabled={!canEdit || saving === item.tipo}
          className="btn-primary self-end gap-2 px-4 py-2"
        >
          <Save className="h-4 w-4" />
          {saving === item.tipo ? "Guardando..." : "Guardar"}
        </button>
      </div>

      <p className="text-muted mt-3 text-xs">
        Actualizado: {formatDateTime(item.updatedAt)}
      </p>
    </section>
  );
}

function CorrelativosPage() {
  const { user } = useAuth();
  const confirm = useConfirm();
  const [year, setYear] = useState(currentYear);
  const [items, setItems] = useState([]);
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");

  const canEdit = user?.role === "Superadministrador";

  const cargarCorrelativos = async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      const res = await listarCorrelativosRequest({ year, _t: Date.now() });
      const data = Array.isArray(res.data) ? res.data : [];
      setItems(data);
      setValues(
        data.reduce((acc, item) => {
          acc[item.tipo] = item.valorActual;
          return acc;
        }, {})
      );
    } catch (error) {
      notify.error(
        error.response?.data?.message || "No se pudo cargar correlativos"
      );
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarCorrelativos();
  }, [year]);

  const handleValueChange = (tipo, value) => {
    setValues((prev) => ({
      ...prev,
      [tipo]: value,
    }));
  };

  const guardarCorrelativo = async (item) => {
    const valor = Number(values[item.tipo]);

    if (!Number.isInteger(valor) || valor < item.maxRegistrado) {
      notify.error(
        `El valor debe ser mayor o igual al máximo registrado (${item.maxRegistrado})`
      );
      return;
    }

    const ok = await confirm({
      title: "Actualizar correlativo",
      message:
        "Cambiar el último número usado afectará la siguiente numeración generada por el sistema.",
      confirmText: "Actualizar",
      cancelText: "Cancelar",
      variant: "info",
    });

    if (!ok) return;

    try {
      setSaving(item.tipo);
      await actualizarCorrelativoRequest(item.tipo, { year, valor });
      notify.success("Correlativo actualizado");
      await cargarCorrelativos({ silent: true });
    } catch (error) {
      notify.error(
        error.response?.data?.message || "No se pudo actualizar correlativo"
      );
    } finally {
      setSaving("");
    }
  };

  return (
    <div className="page">
      <div className="page-wrap">
        <header className="page-hero">
          <div className="page-hero-content">
            <div>
              <div className="eyebrow">Administración</div>
              <h1 className="page-title">Administración de correlativos</h1>
              <p className="page-description">
                Controla el último número usado y el siguiente correlativo para
                documentos operativos e internos.
              </p>
            </div>

            <div className="page-actions">
              <label className="relative">
                <Calendar className="text-faint pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                <input
                  type="number"
                  min="2020"
                  max={currentYear + 1}
                  value={year}
                  onChange={(event) => setYear(Number(event.target.value))}
                  className="input w-36 pl-9"
                />
              </label>
              <button
                type="button"
                onClick={() => cargarCorrelativos({ silent: true })}
                disabled={loading}
                className="btn-secondary gap-2 px-4 py-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Actualizar
              </button>
            </div>
          </div>
        </header>

        {!canEdit && (
          <section className="panel border-amber-500/30 p-4">
            <div className="flex gap-3">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
              <p className="text-muted text-sm">
                Puedes consultar correlativos, pero solo el rol Superadministrador
                puede modificarlos.
              </p>
            </div>
          </section>
        )}

        {loading ? (
          <section className="loading-panel">
            <div className="loading-spinner" />
            <p className="text-muted text-sm">Cargando correlativos...</p>
          </section>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {items.map((item) => (
              <CorrelativoCard
                key={item.tipo}
                item={item}
                value={values[item.tipo] ?? item.valorActual}
                onChange={handleValueChange}
                onSave={guardarCorrelativo}
                saving={saving}
                canEdit={canEdit}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CorrelativosPage;

