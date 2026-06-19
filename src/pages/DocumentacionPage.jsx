import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  CalendarClock,
  Download,
  FilePlus2,
  FileText,
  MessageCircle,
  Upload,
  Pencil,
  Power,
  PowerOff,
  Search,
  Settings2,
  ShieldAlert,
  Truck,
  Users,
} from "lucide-react";
import { useConfirm } from "../context/ConfirmContext";
import {
  archiveDocumentoOperativoRequest,
  cambiarEstadoTipoDocumentacionRequest,
  createTipoDocumentacionRequest,
  createDocumentoOperativoRequest,
  getDocumentosOperativosRequest,
  getResumenDocumentacionRequest,
  getTiposDocumentacionRequest,
  importDocumentosOperativosRequest,
  sendAlertaDocumentacionWhatsappRequest,
  updateTipoDocumentacionRequest,
  updateDocumentoOperativoRequest,
} from "../api/documentacion";
import { getConductoresRequest } from "../api/conductores";
import { obtenerUnidadesRequest } from "../api/unidades";
import TablePagination from "../components/TablePagination";
import {
  getRecordId,
  normalizeCollection,
  normalizePagination,
} from "../utils/apiData";
import { obtenerMensajeErrorApi } from "../utils/apiErrorMessages";
import { notify } from "../utils/notify";

const CATALOG_PAGE_LIMIT = 100;

const DEFAULT_PAGINATION = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPrevPage: false,
};

const DOCUMENTO_INICIAL = {
  tipoEntidad: "CONDUCTOR",
  conductorId: "",
  unidadId: "",
  tipoDocumentacionId: "",
  nombre: "",
  numeroDocumento: "",
  fechaEmision: "",
  fechaVencimiento: "",
  observaciones: "",
};

const TIPO_INICIAL = {
  codigo: "",
  nombre: "",
  descripcion: "",
  aplicaConductor: true,
  aplicaUnidad: false,
  requiereFechaEmision: false,
  requiereFechaVencimiento: true,
  diasAlerta: 30,
  activo: true,
};

const estados = [
  { value: "", label: "Todos" },
  { value: "VIGENTE", label: "Vigentes" },
  { value: "POR_VENCER", label: "Por vencer" },
  { value: "VENCIDO", label: "Vencidos" },
  { value: "ARCHIVADO", label: "Archivados" },
];

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("es-PE", {
    timeZone: "UTC",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

const toInputDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const getPersonaLabel = (conductor) =>
  [conductor?.nombres, conductor?.apellidos].filter(Boolean).join(" ") ||
  conductor?.numeroDocumento ||
  "-";

const getUnidadLabel = (unidad) =>
  [unidad?.placa, unidad?.tipoUnidad].filter(Boolean).join(" / ") || "-";

const getDocumentoEntidad = (documento) => {
  if (documento.tipoEntidad === "CONDUCTOR") {
    return getPersonaLabel(documento.conductor);
  }

  return getUnidadLabel(documento.unidad);
};

const normalizarTexto = (value) =>
  typeof value === "string" ? value.trim().toUpperCase() : value;

const parseExcelDate = (value) => {
  const text = String(value || "").trim();
  if (!text) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;

  const match = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (!match) return text;

  const [, day, month, year] = match;
  const fullYear = year.length === 2 ? `20${year}` : year;
  return `${fullYear}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
};

const TEMPLATE_HEADERS = [
  "entidad",
  "identificador",
  "tipoDocumento",
  "nombre",
  "numero",
  "fechaEmision",
  "fechaVencimiento",
  "observaciones",
];

const TEMPLATE_ROWS = [
  ["CONDUCTOR", "12345678", "DNI", "DNI", "", "01/01/2026", "01/01/2030", ""],
  ["UNIDAD", "ABC123", "SOAT", "SOAT 2026", "", "01/01/2026", "01/01/2027", ""],
];

const downloadTemplate = () => {
  const csv = [TEMPLATE_HEADERS, ...TEMPLATE_ROWS]
    .map((row) =>
      row
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(";")
    )
    .join("\n");
  const blob = new Blob([`\uFEFF${csv}`], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "plantilla_documentacion.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const splitRow = (row) => {
  const delimiter = row.includes("\t") ? "\t" : row.includes(";") ? ";" : ",";
  const values = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < row.length; index += 1) {
    const char = row[index];
    const next = row[index + 1];

    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      quoted = !quoted;
      continue;
    }

    if (char === delimiter && !quoted) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
};

const parseTablaPegada = (texto) => {
  const rows = String(texto || "")
    .split(/\r?\n/)
    .map((row) => row.trim())
    .filter(Boolean);

  const dataRows = rows[0]?.toLowerCase().includes("identificador")
    ? rows.slice(1)
    : rows;

  return dataRows
    .map(splitRow)
    .filter((cols) => cols.length >= 3)
    .map((cols) => ({
      tipoEntidad: cols[0] || "",
      identificador: cols[1] || "",
      tipoDocumento: cols[2] || "",
      nombre: cols[3] || "",
      numeroDocumento: cols[4] || "",
      fechaEmision: parseExcelDate(cols[5]),
      fechaVencimiento: parseExcelDate(cols[6]),
      observaciones: cols[7] || "",
    }));
};

const EstadoBadge = ({ estado }) => {
  const normalized = estado || "VIGENTE";
  const className = {
    VIGENTE: "border-green-500/30 bg-green-500/10 text-green-300",
    POR_VENCER: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    VENCIDO: "border-red-500/30 bg-red-500/10 text-red-300",
    ARCHIVADO: "border-slate-500/30 bg-slate-500/10 text-slate-300",
  }[normalized] || "border-slate-500/30 bg-slate-500/10 text-slate-300";

  return (
    <span className={`inline-flex items-center justify-center rounded-full border px-3 py-1 text-[11px] font-bold tracking-wide ${className}`}>
      {normalized.replace("_", " ")}
    </span>
  );
};

const TipoEntidadBadge = ({ tipo }) => {
  const isConductor = tipo === "CONDUCTOR";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-bold ${
        isConductor
          ? "border-blue-500/30 bg-blue-500/10 text-blue-300"
          : "border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
      }`}
    >
      {isConductor ? <Users className="h-3.5 w-3.5" /> : <Truck className="h-3.5 w-3.5" />}
      {tipo || "-"}
    </span>
  );
};

function DocumentacionModal({
  open,
  mode,
  data,
  conductores,
  unidades,
  loadingCatalogos,
  tiposDocumentacion,
  onClose,
  onSubmit,
  saving,
}) {
  const [form, setForm] = useState(DOCUMENTO_INICIAL);

  useEffect(() => {
    if (!open) return;

    setForm({
      tipoEntidad: data?.tipoEntidad || "CONDUCTOR",
      conductorId: data?.conductorId || data?.conductor?.id || "",
      unidadId: data?.unidadId || data?.unidad?.id || "",
      tipoDocumentacionId:
        data?.tipoDocumentacionId || data?.tipoDocumentacion?.id || "",
      nombre: data?.nombre || "",
      numeroDocumento: data?.numeroDocumento || "",
      fechaEmision: toInputDate(data?.fechaEmision),
      fechaVencimiento: toInputDate(data?.fechaVencimiento),
      observaciones: data?.observaciones || "",
    });
  }, [data, open]);

  if (!open) return null;

  const documentoOptions = tiposDocumentacion.filter((tipo) =>
    form.tipoEntidad === "CONDUCTOR"
      ? tipo.aplicaConductor
      : tipo.aplicaUnidad
  );

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => {
      const next = {
        ...prev,
        [name]: value,
      };

      if (name === "tipoEntidad") {
        next.conductorId = "";
        next.unidadId = "";
        next.tipoDocumentacionId = "";
      }

      if (name === "tipoDocumentacionId") {
        const tipo = documentoOptions.find(
          (item) => String(getRecordId(item)) === String(value)
        );
        next.nombre = tipo?.nombre || "";
      }

      return next;
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const payload = {
      ...form,
      tipoDocumentacionId: Number(form.tipoDocumentacionId),
      nombre: normalizarTexto(form.nombre),
      numeroDocumento: normalizarTexto(form.numeroDocumento),
      observaciones: normalizarTexto(form.observaciones),
      conductorId:
        form.tipoEntidad === "CONDUCTOR" ? Number(form.conductorId) : undefined,
      unidadId: form.tipoEntidad === "UNIDAD" ? Number(form.unidadId) : undefined,
    };

    if (form.tipoEntidad === "CONDUCTOR") {
      delete payload.unidadId;
    } else {
      delete payload.conductorId;
    }

    onSubmit(payload);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-panel max-w-3xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">
              {mode === "create" ? "Nuevo documento" : "Editar documento"}
            </h2>
            <p className="text-muted text-sm">
              Registra vigencias y archivos de conductores o unidades.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted text-2xl hover:text-blue-500"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="grid gap-3 md:col-span-2 md:grid-cols-2">
            <label className="field-label">
              Entidad
              <select
                name="tipoEntidad"
                value={form.tipoEntidad}
                onChange={handleChange}
                className="field-input"
                required
              >
                <option value="CONDUCTOR">Conductor</option>
                <option value="UNIDAD">Unidad</option>
              </select>
            </label>

            {form.tipoEntidad === "CONDUCTOR" ? (
              <label className="field-label">
                Conductor
                <select
                  name="conductorId"
                  value={form.conductorId}
                  onChange={handleChange}
                  className="field-input"
                  required
                >
                  <option value="">Seleccionar conductor</option>
                  {loadingCatalogos && conductores.length === 0 && (
                    <option value="" disabled>
                      Cargando conductores...
                    </option>
                  )}
                  {conductores.map((conductor) => (
                    <option key={getRecordId(conductor)} value={getRecordId(conductor)}>
                      {getPersonaLabel(conductor)} - {conductor.numeroDocumento || "-"}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <label className="field-label">
                Unidad
                <select
                  name="unidadId"
                  value={form.unidadId}
                  onChange={handleChange}
                  className="field-input"
                  required
                >
                  <option value="">Seleccionar unidad</option>
                  {loadingCatalogos && unidades.length === 0 && (
                    <option value="" disabled>
                      Cargando unidades...
                    </option>
                  )}
                  {unidades.map((unidad) => (
                    <option key={getRecordId(unidad)} value={getRecordId(unidad)}>
                      {getUnidadLabel(unidad)}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="field-label">
              Tipo de documentación
              <select
                name="tipoDocumentacionId"
                value={form.tipoDocumentacionId}
                onChange={handleChange}
                className="field-input"
                required
              >
                <option value="">Seleccionar tipo</option>
                {documentoOptions.map((tipo) => (
                  <option key={getRecordId(tipo)} value={getRecordId(tipo)}>
                    {tipo.nombre}
                  </option>
                ))}
              </select>
            </label>

            <label className="field-label">
              Nombre
              <input
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                className="field-input"
                placeholder="SOAT 2026"
                required
              />
            </label>

            <label className="field-label">
              Número
              <input
                name="numeroDocumento"
                value={form.numeroDocumento}
                onChange={handleChange}
                className="field-input"
                placeholder="Número de póliza, licencia o constancia"
              />
            </label>

            <label className="field-label">
              Emisión
              <input
                type="date"
                name="fechaEmision"
                value={form.fechaEmision}
                onChange={handleChange}
                className="field-input"
              />
            </label>

            <label className="field-label">
              Vencimiento
              <input
                type="date"
                name="fechaVencimiento"
                value={form.fechaVencimiento}
                onChange={handleChange}
                className="field-input"
              />
            </label>
          </div>

          <label className="field-label md:col-span-2">
            Observaciones
            <textarea
              name="observaciones"
              value={form.observaciones}
              onChange={handleChange}
              className="field-input min-h-[96px]"
              placeholder="Detalle operativo"
            />
          </label>

          <div className="md:col-span-2 mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              className="btn-secondary px-3 py-2"
              onClick={onClose}
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary px-3 py-2"
              disabled={saving}
            >
              {saving ? "Guardando..." : "Guardar documento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ImportarDocumentacionModal({ open, onClose, onSubmit, saving }) {
  const [texto, setTexto] = useState("");
  const [fileName, setFileName] = useState("");
  const filas = useMemo(() => parseTablaPegada(texto), [texto]);

  useEffect(() => {
    if (!open) return;
    setTexto("");
    setFileName("");
  }, [open]);

  if (!open) return null;

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(filas);
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setTexto(String(reader.result || ""));
    };
    reader.onerror = () => {
      notify.error("No se pudo leer el archivo seleccionado");
    };
    reader.readAsText(file, "utf-8");
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-panel max-w-4xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Carga masiva</h2>
            <p className="text-muted text-sm">
              Descarga la plantilla, completa los datos en Excel y adjunta el archivo.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted text-2xl hover:text-blue-500"
          >
            ×
          </button>
        </div>

        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            className="btn-secondary px-3 py-2"
            onClick={downloadTemplate}
          >
            <Download className="h-4 w-4" />
            Descargar plantilla
          </button>
          <p className="text-muted text-sm">
            Formato permitido: CSV generado desde Excel.
          </p>
        </div>

        <div className="mb-4 grid gap-3 text-sm lg:grid-cols-2">
          <div className="info-tile">
            <p className="text-main font-bold">Columnas</p>
            <p className="text-muted mt-1">
              entidad, identificador, tipoDocumento, nombre, numero, fechaEmision,
              fechaVencimiento, observaciones
            </p>
          </div>
          <div className="info-tile">
            <p className="text-main font-bold">Identificador</p>
            <p className="text-muted mt-1">
              Para CONDUCTOR usa DNI. Para UNIDAD usa placa. El número del documento puede quedar vacío.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <label className="field-label">
            Archivo
            <input
              type="file"
              accept=".csv,.txt,.tsv"
              onChange={handleFileChange}
              className="field-input"
            />
          </label>

          {fileName && (
            <div className="info-tile mt-3">
              <p className="text-main font-semibold">{fileName}</p>
              <p className="text-muted text-sm">
                Filas listas para importar: {filas.length}
              </p>
            </div>
          )}

          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted text-sm">
              Filas detectadas: <span className="text-main font-bold">{filas.length}</span>
            </p>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <button
                type="button"
                className="btn-secondary px-3 py-2"
                onClick={onClose}
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary px-3 py-2"
                disabled={saving || filas.length === 0}
              >
                {saving ? "Importando..." : "Importar filas"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function TipoDocumentacionModal({
  open,
  mode,
  data,
  onClose,
  onSubmit,
  saving,
}) {
  const [form, setForm] = useState(TIPO_INICIAL);

  useEffect(() => {
    if (!open) return;

    setForm({
      codigo: data?.codigo || "",
      nombre: data?.nombre || "",
      descripcion: data?.descripcion || "",
      aplicaConductor: data?.aplicaConductor ?? true,
      aplicaUnidad: data?.aplicaUnidad ?? false,
      requiereFechaEmision: data?.requiereFechaEmision ?? false,
      requiereFechaVencimiento: data?.requiereFechaVencimiento ?? true,
      diasAlerta: data?.diasAlerta || 30,
      activo: data?.activo ?? true,
    });
  }, [data, open]);

  if (!open) return null;

  const handleChange = (event) => {
    const { name, type, checked, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      ...form,
      codigo: normalizarTexto(form.codigo),
      nombre: normalizarTexto(form.nombre),
      descripcion: normalizarTexto(form.descripcion),
      diasAlerta: Number(form.diasAlerta) || 30,
    });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-panel max-w-2xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">
              {mode === "create" ? "Nuevo tipo" : "Editar tipo"}
            </h2>
            <p className="text-muted text-sm">
              Define qué documentos se controlan y sus reglas.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted text-2xl hover:text-blue-500"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="grid gap-3 md:col-span-2 md:grid-cols-2">
            <label className="field-label">
              Código
              <input
                name="codigo"
                value={form.codigo}
                onChange={handleChange}
                className="field-input"
                placeholder="SOAT"
                required
              />
            </label>

            <label className="field-label">
              Nombre
              <input
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                className="field-input"
                placeholder="SOAT"
                required
              />
            </label>

            <label className="field-label">
              Días de alerta
              <input
                type="number"
                min="1"
                max="365"
                name="diasAlerta"
                value={form.diasAlerta}
                onChange={handleChange}
                className="field-input"
                required
              />
            </label>

            <label className="field-label">
              Estado
              <select
                name="activo"
                value={String(form.activo)}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    activo: event.target.value === "true",
                  }))
                }
                className="field-input"
              >
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </select>
            </label>
          </div>

          <label className="field-label md:col-span-2">
            Descripción
            <textarea
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              className="field-input min-h-[84px]"
              placeholder="Detalle del documento"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2 md:col-span-2">
            <label className="info-tile flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                name="aplicaConductor"
                checked={form.aplicaConductor}
                onChange={handleChange}
                className="h-4 w-4"
              />
              <span className="text-main font-semibold">Aplica a conductores</span>
            </label>
            <label className="info-tile flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                name="aplicaUnidad"
                checked={form.aplicaUnidad}
                onChange={handleChange}
                className="h-4 w-4"
              />
              <span className="text-main font-semibold">Aplica a unidades</span>
            </label>
            <label className="info-tile flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                name="requiereFechaEmision"
                checked={form.requiereFechaEmision}
                onChange={handleChange}
                className="h-4 w-4"
              />
              <span className="text-main font-semibold">Requiere emisión</span>
            </label>
            <label className="info-tile flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                name="requiereFechaVencimiento"
                checked={form.requiereFechaVencimiento}
                onChange={handleChange}
                className="h-4 w-4"
              />
              <span className="text-main font-semibold">Requiere vencimiento</span>
            </label>
          </div>

          <div className="md:col-span-2 mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              className="btn-secondary px-3 py-2"
              onClick={onClose}
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary px-3 py-2"
              disabled={saving}
            >
              {saving ? "Guardando..." : "Guardar tipo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DocumentacionPage() {
  const confirm = useConfirm();

  const [documentos, setDocumentos] = useState([]);
  const [tiposDocumentacion, setTiposDocumentacion] = useState([]);
  const [conductoresCatalogo, setConductoresCatalogo] = useState([]);
  const [unidadesCatalogo, setUnidadesCatalogo] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [paginationTipos, setPaginationTipos] = useState(DEFAULT_PAGINATION);
  const [activeTab, setActiveTab] = useState("documentos");
  const [filters, setFilters] = useState({
    search: "",
    tipoEntidad: "",
    estado: "",
    diasVencimiento: 30,
  });
  const [loadingDocumentos, setLoadingDocumentos] = useState(false);
  const [loadingTipos, setLoadingTipos] = useState(false);
  const [loadingCatalogos, setLoadingCatalogos] = useState(false);
  const [catalogosCargados, setCatalogosCargados] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState("create");
  const [selectedDocumento, setSelectedDocumento] = useState(null);
  const [tipoModalOpen, setTipoModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [tipoMode, setTipoMode] = useState("create");
  const [selectedTipo, setSelectedTipo] = useState(null);

  const queryParams = useMemo(
    () => ({
      page: pagination.page,
      limit: pagination.limit,
      ...(filters.search ? { search: filters.search } : {}),
      ...(filters.tipoEntidad ? { tipoEntidad: filters.tipoEntidad } : {}),
      ...(filters.estado ? { estado: filters.estado } : {}),
      diasVencimiento: filters.diasVencimiento,
    }),
    [filters, pagination.limit, pagination.page]
  );

  const cargarColeccionCompleta = async (
    request,
    collectionKeys,
    params = {}
  ) => {
    let page = 1;
    let hasNextPage = true;
    const items = [];

    while (hasNextPage) {
      const res = await request({
        ...params,
        page,
        limit: CATALOG_PAGE_LIMIT,
      });
      const paginationData = normalizePagination(res.data, DEFAULT_PAGINATION);

      items.push(...normalizeCollection(res.data, collectionKeys));
      hasNextPage = paginationData.hasNextPage;
      page += 1;
    }

    return items;
  };

  const cargarDocumentacion = async (page = 1) => {
    try {
      setLoadingDocumentos(true);
      const params = {
        ...queryParams,
        page,
      };
      const [documentosRes, resumenRes] = await Promise.all([
        getDocumentosOperativosRequest(params),
        getResumenDocumentacionRequest({
          diasVencimiento: filters.diasVencimiento,
        }),
      ]);

      setDocumentos(normalizeCollection(documentosRes.data, ["documentos"]));
      setPagination(normalizePagination(documentosRes.data, DEFAULT_PAGINATION));
      setResumen(resumenRes.data || null);
    } catch (error) {
      notify.error(
        obtenerMensajeErrorApi(error, "Error al cargar documentación")
      );
    } finally {
      setLoadingDocumentos(false);
    }
  };

  const cargarTiposDocumentacion = async (page = 1, options = {}) => {
    try {
      setLoadingTipos(true);

      if (options.soloActivos) {
        const data = await cargarColeccionCompleta(
          getTiposDocumentacionRequest,
          ["tipos"],
          { activo: "true" }
        );

        setTiposDocumentacion(data);
        setPaginationTipos({
          page: 1,
          limit: data.length || CATALOG_PAGE_LIMIT,
          total: data.length,
          totalPages: data.length ? 1 : 0,
          hasNextPage: false,
          hasPrevPage: false,
        });
        return;
      }

      const res = await getTiposDocumentacionRequest({
        page,
        limit: paginationTipos.limit,
      });
      setTiposDocumentacion(normalizeCollection(res.data, ["tipos"]));
      setPaginationTipos(normalizePagination(res.data, DEFAULT_PAGINATION));
    } catch (error) {
      notify.error(
        obtenerMensajeErrorApi(error, "Error al cargar tipos de documentación")
      );
    } finally {
      setLoadingTipos(false);
    }
  };

  const cargarCatalogosEntidades = async () => {
    if (catalogosCargados || loadingCatalogos) return;

    try {
      setLoadingCatalogos(true);
      const [conductoresData, unidadesData] = await Promise.all([
        cargarColeccionCompleta(getConductoresRequest, ["conductores"]),
        cargarColeccionCompleta(obtenerUnidadesRequest, ["unidades"]),
      ]);

      setConductoresCatalogo(conductoresData);
      setUnidadesCatalogo(unidadesData);
      setCatalogosCargados(true);
    } catch (error) {
      notify.error(
        obtenerMensajeErrorApi(error, "Error al cargar conductores y unidades")
      );
    } finally {
      setLoadingCatalogos(false);
    }
  };

  useEffect(() => {
    cargarTiposDocumentacion(1, { soloActivos: true });
    const timeout = window.setTimeout(() => {
      cargarCatalogosEntidades();
    }, 450);

    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    cargarDocumentacion(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.tipoEntidad, filters.estado, filters.diasVencimiento]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    cargarDocumentacion(1);
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({
      ...prev,
      [name]: name === "diasVencimiento" ? Number(value) || 30 : value,
    }));
  };

  const cambiarTab = (tab) => {
    setActiveTab(tab);

    if (tab === "tipos") {
      cargarTiposDocumentacion(1);
    }

    if (tab === "documentos") {
      cargarTiposDocumentacion(1, { soloActivos: true });
    }
  };

  const abrirCrear = () => {
    setMode("create");
    setSelectedDocumento(null);
    cargarCatalogosEntidades();
    setModalOpen(true);
  };

  const abrirImportar = () => {
    setImportModalOpen(true);
  };

  const cerrarImportar = () => {
    setImportModalOpen(false);
  };

  const abrirCrearTipo = () => {
    setTipoMode("create");
    setSelectedTipo(null);
    setTipoModalOpen(true);
  };

  const abrirEditarTipo = (tipo) => {
    setTipoMode("edit");
    setSelectedTipo(tipo);
    setTipoModalOpen(true);
  };

  const cerrarTipoModal = () => {
    setTipoModalOpen(false);
    setSelectedTipo(null);
  };

  const abrirEditar = (documento) => {
    setMode("edit");
    setSelectedDocumento(documento);
    cargarCatalogosEntidades();
    setModalOpen(true);
  };

  const cerrarModal = () => {
    setModalOpen(false);
    setSelectedDocumento(null);
  };

  const guardarDocumento = async (payload) => {
    try {
      setSaving(true);

      if (mode === "edit" && selectedDocumento) {
        await updateDocumentoOperativoRequest(getRecordId(selectedDocumento), payload);
        notify.success("Documento actualizado correctamente");
      } else {
        await createDocumentoOperativoRequest(payload);
        notify.success("Documento registrado correctamente");
      }

      cerrarModal();
      await cargarDocumentacion(pagination.page);
    } catch (error) {
      notify.error(obtenerMensajeErrorApi(error, "Error al guardar documento"));
    } finally {
      setSaving(false);
    }
  };

  const archivarDocumento = async (documento) => {
    const confirmed = await confirm({
      title: "Archivar documento",
      message: `¿Seguro que deseas archivar ${documento.nombre || "este documento"}?`,
      confirmText: "Archivar",
      variant: "danger",
    });

    if (!confirmed) return;

    try {
      await archiveDocumentoOperativoRequest(getRecordId(documento));
      notify.success("Documento archivado correctamente");
      await cargarDocumentacion(pagination.page);
    } catch (error) {
      notify.error(obtenerMensajeErrorApi(error, "Error al archivar documento"));
    }
  };

  const importarDocumentos = async (filas) => {
    try {
      setSaving(true);
      const res = await importDocumentosOperativosRequest(filas);
      const creados = Number(res.data?.creados || 0);
      const errores = Array.isArray(res.data?.errores) ? res.data.errores : [];

      if (errores.length > 0) {
        notify.error(
          `Importados ${creados}. ${errores.length} fila(s) con error.`
        );
        console.table?.(errores);
      } else {
        notify.success(`Se importaron ${creados} documento(s)`);
      }

      cerrarImportar();
      await cargarDocumentacion(1);
    } catch (error) {
      notify.error(obtenerMensajeErrorApi(error, "Error al importar documentos"));
    } finally {
      setSaving(false);
    }
  };

  const enviarAlertaWhatsapp = async () => {
    const confirmed = await confirm({
      title: "Enviar alerta WhatsApp",
      message:
        "Se enviará al grupo de operaciones el resumen consolidado de documentos por vencer. ¿Deseas continuar?",
      confirmText: "Enviar alerta",
      cancelText: "Cancelar",
      variant: "primary",
    });

    if (!confirmed) return;

    try {
      setSaving(true);
      const res = await sendAlertaDocumentacionWhatsappRequest();
      if (res.data?.enviado) {
        notify.success(
          `Alerta enviada: ${res.data.totalDocumentos || 0} documentos`
        );
      } else {
        notify.info(res.data?.message || "No hay documentos por alertar");
      }
    } catch (error) {
      notify.error(
        obtenerMensajeErrorApi(error, "Error al enviar alerta por WhatsApp")
      );
    } finally {
      setSaving(false);
    }
  };

  const guardarTipo = async (payload) => {
    try {
      setSaving(true);

      if (tipoMode === "edit" && selectedTipo) {
        await updateTipoDocumentacionRequest(getRecordId(selectedTipo), payload);
        notify.success("Tipo actualizado correctamente");
      } else {
        await createTipoDocumentacionRequest(payload);
        notify.success("Tipo creado correctamente");
      }

      cerrarTipoModal();
      await cargarTiposDocumentacion(paginationTipos.page);
    } catch (error) {
      notify.error(
        obtenerMensajeErrorApi(error, "Error al guardar tipo de documentación")
      );
    } finally {
      setSaving(false);
    }
  };

  const cambiarEstadoTipo = async (tipo) => {
    const activo = !tipo.activo;
    const confirmed = await confirm({
      title: activo ? "Activar tipo" : "Desactivar tipo",
      message: `¿Seguro que deseas ${activo ? "activar" : "desactivar"} ${tipo.nombre}?`,
      confirmText: activo ? "Activar" : "Desactivar",
      variant: activo ? "primary" : "danger",
    });

    if (!confirmed) return;

    try {
      await cambiarEstadoTipoDocumentacionRequest(getRecordId(tipo), activo);
      notify.success(
        activo
          ? "Tipo activado correctamente"
          : "Tipo desactivado correctamente"
      );
      await cargarTiposDocumentacion(paginationTipos.page);
    } catch (error) {
      notify.error(
        obtenerMensajeErrorApi(error, "Error al cambiar estado del tipo")
      );
    }
  };

  const summaryCards = [
    {
      label: "Activos",
      value: resumen?.totalActivos || 0,
      icon: FileText,
      tone: "text-blue-300",
    },
    {
      label: "Por vencer",
      value: resumen?.porVencer || 0,
      icon: CalendarClock,
      tone: "text-amber-300",
    },
    {
      label: "Vencidos",
      value: resumen?.vencidos || 0,
      icon: ShieldAlert,
      tone: "text-red-300",
    },
    {
      label: "Unidades",
      value: resumen?.porEntidad?.unidades || 0,
      icon: Truck,
      tone: "text-cyan-300",
    },
  ];

  const AccionesDocumento = ({ documento, mobile = false }) => (
    <div className={`flex gap-2 ${mobile ? "flex-wrap" : "justify-end"}`}>
      <button
        type="button"
        className="btn-primary btn-icon"
        onClick={() => abrirEditar(documento)}
        title="Editar documento"
        aria-label="Editar documento"
      >
        <Pencil />
      </button>
      <button
        type="button"
        className="btn-danger btn-icon"
        onClick={() => archivarDocumento(documento)}
        title="Archivar documento"
        aria-label="Archivar documento"
      >
        <Archive />
      </button>
    </div>
  );

  const AccionesTipo = ({ tipo, mobile = false }) => (
    <div className={`flex gap-2 ${mobile ? "flex-wrap" : "justify-end"}`}>
      <button
        type="button"
        className="btn-primary btn-icon"
        onClick={() => abrirEditarTipo(tipo)}
        title="Editar tipo"
        aria-label="Editar tipo"
      >
        <Pencil />
      </button>
      <button
        type="button"
        className={`${tipo.activo ? "btn-danger" : "btn-success"} btn-icon`}
        onClick={() => cambiarEstadoTipo(tipo)}
        title={tipo.activo ? "Desactivar tipo" : "Activar tipo"}
        aria-label={tipo.activo ? "Desactivar tipo" : "Activar tipo"}
      >
        {tipo.activo ? <PowerOff /> : <Power />}
      </button>
    </div>
  );

  return (
    <div className="page">
      <div className="page-wrap">
        <header className="page-hero">
          <div className="page-hero-content">
            <div>
              <div className="eyebrow">Gestión documental</div>
              <h1 className="page-title">Documentación</h1>
              <p className="page-description">
                Control de vencimientos y archivos operativos de conductores y unidades.
              </p>
            </div>
            <div className="page-actions">
              <button
                type="button"
                onClick={activeTab === "tipos" ? abrirCrearTipo : abrirCrear}
                className="btn-primary px-3 py-2"
              >
                {activeTab === "tipos" ? (
                  <Settings2 className="h-4 w-4" />
                ) : (
                  <FilePlus2 className="h-4 w-4" />
                )}
                {activeTab === "tipos" ? "Nuevo tipo" : "Nuevo documento"}
              </button>
              {activeTab === "documentos" && (
                <button
                  type="button"
                  onClick={abrirImportar}
                  className="btn-secondary px-3 py-2"
                >
                  <Upload className="h-4 w-4" />
                  Carga masiva
                </button>
              )}
              {activeTab === "documentos" && (
                <button
                  type="button"
                  onClick={enviarAlertaWhatsapp}
                  className="btn-secondary px-3 py-2"
                  disabled={saving}
                >
                  <MessageCircle className="h-4 w-4" />
                  Enviar alerta
                </button>
              )}
            </div>
          </div>
        </header>

        <div className="panel flex flex-col gap-2 p-2 sm:flex-row">
          <button
            type="button"
            onClick={() => cambiarTab("documentos")}
            className={`btn-secondary flex-1 px-3 py-2 ${
              activeTab === "documentos" ? "border-[var(--app-primary)]" : ""
            }`}
          >
            <FileText className="h-4 w-4" />
            Documentos
          </button>
          <button
            type="button"
            onClick={() => cambiarTab("tipos")}
            className={`btn-secondary flex-1 px-3 py-2 ${
              activeTab === "tipos" ? "border-[var(--app-primary)]" : ""
            }`}
          >
            <Settings2 className="h-4 w-4" />
            Tipos de documentación
          </button>
        </div>

        {activeTab === "documentos" && (
          <>
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map(({ label, value, icon: Icon, tone }) => (
            <article key={label} className="panel p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-faint text-xs font-bold uppercase">
                    {label}
                  </p>
                  <p className="text-main mt-1 text-2xl font-extrabold">
                    {loadingDocumentos ? "-" : value}
                  </p>
                </div>
                <Icon className={`h-6 w-6 ${tone}`} />
              </div>
            </article>
          ))}
        </section>

        <form onSubmit={handleSearchSubmit} className="filter-panel">
          <div className="grid gap-3 lg:grid-cols-[1.4fr_0.8fr_0.8fr_0.7fr_auto]">
            <label className="field-label">
              Buscar
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--app-muted)]" />
                <input
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                  className="field-input pl-9"
                  placeholder="Documento, placa, conductor"
                />
              </div>
            </label>

            <label className="field-label">
              Entidad
              <select
                name="tipoEntidad"
                value={filters.tipoEntidad}
                onChange={handleFilterChange}
                className="field-input"
              >
                <option value="">Todas</option>
                <option value="CONDUCTOR">Conductores</option>
                <option value="UNIDAD">Unidades</option>
              </select>
            </label>

            <label className="field-label">
              Estado
              <select
                name="estado"
                value={filters.estado}
                onChange={handleFilterChange}
                className="field-input"
              >
                {estados.map((estado) => (
                  <option key={estado.value} value={estado.value}>
                    {estado.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field-label">
              Días
              <input
                type="number"
                min="1"
                max="365"
                name="diasVencimiento"
                value={filters.diasVencimiento}
                onChange={handleFilterChange}
                className="field-input"
              />
            </label>

            <div className="flex items-end">
              <button type="submit" className="btn-secondary w-full px-3 py-2">
                Buscar
              </button>
            </div>
          </div>
        </form>

        {loadingDocumentos ? (
          <div className="loading-panel">
            <div className="loading-spinner" />
            <p className="text-muted text-sm">Cargando documentación...</p>
          </div>
        ) : documentos.length === 0 ? (
          <div className="empty-panel">
            <h2 className="text-main text-lg font-semibold">
              No hay documentación registrada
            </h2>
            <p className="text-muted mt-1 text-sm">
              Registra documentos para controlar vigencias de conductores y unidades.
            </p>
            <button
              type="button"
              onClick={abrirCrear}
              className="btn-primary mt-4 px-3 py-2"
            >
              Crear documento
            </button>
          </div>
        ) : (
          <>
            <div className="mobile-list">
              {documentos.map((documento) => (
                <article key={getRecordId(documento)} className="mobile-card">
                  <div className="mobile-card-header">
                    <div className="min-w-0">
                      <p className="text-faint text-xs font-medium">
                        {documento.tipoDocumento || "-"}
                      </p>
                      <h2 className="mobile-card-title">
                        {documento.nombre || "-"}
                      </h2>
                    </div>
                    <EstadoBadge estado={documento.estadoCalculado || documento.estado} />
                  </div>

                  <div className="mobile-detail-grid-2">
                    <div className="info-tile">
                      <p className="mobile-card-subtitle">Entidad</p>
                      <div className="mt-1">
                        <TipoEntidadBadge tipo={documento.tipoEntidad} />
                      </div>
                      <p className="text-main mt-2 font-semibold">
                        {getDocumentoEntidad(documento)}
                      </p>
                    </div>
                    <div className="info-tile">
                      <p className="mobile-card-subtitle">Vencimiento</p>
                      <p className="text-main font-semibold">
                        {formatDate(documento.fechaVencimiento)}
                      </p>
                      <p className="mobile-card-subtitle">
                        {documento.diasParaVencer === null
                          ? "Sin vencimiento"
                          : `${documento.diasParaVencer} días`}
                      </p>
                    </div>
                    <div className="info-tile">
                      <p className="mobile-card-subtitle">Número</p>
                      <p className="text-main font-semibold">
                        {documento.numeroDocumento || "-"}
                      </p>
                    </div>
                    <div className="info-tile">
                      <p className="mobile-card-subtitle">Emisión</p>
                      <p className="text-main font-semibold">
                        {formatDate(documento.fechaEmision)}
                      </p>
                    </div>
                  </div>

                  <div className="mobile-card-actions">
                    <AccionesDocumento documento={documento} mobile />
                  </div>
                </article>
              ))}
            </div>

            <div className="data-table-wrap">
              <div className="table-scroll">
                <table className="data-table dense-table w-full min-w-[1120px] text-sm">
                  <thead>
                    <tr>
                      <th className="px-4 py-4 text-left">Documento</th>
                      <th className="px-4 py-4 text-left">Entidad</th>
                      <th className="px-4 py-4 text-left">Número</th>
                      <th className="px-4 py-4 text-left">Emisión</th>
                      <th className="px-4 py-4 text-left">Vencimiento</th>
                      <th className="px-4 py-4 text-center">Estado</th>
                      <th className="px-4 py-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documentos.map((documento) => (
                      <tr key={getRecordId(documento)}>
                        <td className="min-w-[260px] px-4 py-4">
                          <p className="text-main max-w-[320px] truncate font-bold">
                            {documento.nombre || "-"}
                          </p>
                          <p className="text-muted text-xs">
                            {documento.tipoDocumento || "-"}
                          </p>
                        </td>
                        <td className="min-w-[240px] px-4 py-4">
                          <TipoEntidadBadge tipo={documento.tipoEntidad} />
                          <p className="text-muted mt-2 max-w-[280px] truncate">
                            {getDocumentoEntidad(documento)}
                          </p>
                        </td>
                        <td className="text-muted whitespace-nowrap px-4 py-4">
                          {documento.numeroDocumento || "-"}
                        </td>
                        <td className="text-muted whitespace-nowrap px-4 py-4">
                          {formatDate(documento.fechaEmision)}
                        </td>
                        <td className="text-muted whitespace-nowrap px-4 py-4">
                          <p className="font-semibold">
                            {formatDate(documento.fechaVencimiento)}
                          </p>
                          <p className="text-faint text-xs">
                            {documento.diasParaVencer === null
                              ? "Sin vencimiento"
                              : `${documento.diasParaVencer} días`}
                          </p>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-center">
                          <EstadoBadge estado={documento.estadoCalculado || documento.estado} />
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">
                          <AccionesDocumento documento={documento} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <TablePagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              limit={pagination.limit}
              onPageChange={cargarDocumentacion}
            />
          </>
        )}
          </>
        )}

        {activeTab === "tipos" && (
          <>
            {loadingTipos ? (
              <div className="loading-panel">
                <div className="loading-spinner" />
                <p className="text-muted text-sm">Cargando tipos...</p>
              </div>
            ) : tiposDocumentacion.length === 0 ? (
              <div className="empty-panel">
                <h2 className="text-main text-lg font-semibold">
                  No hay tipos de documentación
                </h2>
                <p className="text-muted mt-1 text-sm">
                  Crea los tipos que usarás para conductores y unidades.
                </p>
                <button
                  type="button"
                  onClick={abrirCrearTipo}
                  className="btn-primary mt-4 px-3 py-2"
                >
                  Crear tipo
                </button>
              </div>
            ) : (
              <>
                <div className="mobile-list">
                  {tiposDocumentacion.map((tipo) => (
                    <article key={getRecordId(tipo)} className="mobile-card">
                      <div className="mobile-card-header">
                        <div>
                          <p className="text-faint text-xs font-medium">
                            {tipo.codigo}
                          </p>
                          <h2 className="mobile-card-title">{tipo.nombre}</h2>
                        </div>
                        <EstadoBadge estado={tipo.activo ? "VIGENTE" : "ARCHIVADO"} />
                      </div>
                      <div className="mobile-detail-grid-2">
                        <div className="info-tile">
                          <p className="mobile-card-subtitle">Aplica a</p>
                          <p className="text-main font-semibold">
                            {[
                              tipo.aplicaConductor ? "Conductores" : null,
                              tipo.aplicaUnidad ? "Unidades" : null,
                            ]
                              .filter(Boolean)
                              .join(" / ")}
                          </p>
                        </div>
                        <div className="info-tile">
                          <p className="mobile-card-subtitle">Alerta</p>
                          <p className="text-main font-semibold">
                            {tipo.diasAlerta} días
                          </p>
                        </div>
                      </div>
                      <div className="mobile-card-actions">
                        <AccionesTipo tipo={tipo} mobile />
                      </div>
                    </article>
                  ))}
                </div>

                <div className="data-table-wrap">
                  <div className="table-scroll">
                    <table className="data-table dense-table w-full min-w-[980px] text-sm">
                      <thead>
                        <tr>
                          <th className="px-4 py-4 text-left">Tipo</th>
                          <th className="px-4 py-4 text-left">Aplica a</th>
                          <th className="px-4 py-4 text-left">Requisitos</th>
                          <th className="px-4 py-4 text-left">Alerta</th>
                          <th className="px-4 py-4 text-center">Estado</th>
                          <th className="px-4 py-4 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tiposDocumentacion.map((tipo) => (
                          <tr key={getRecordId(tipo)}>
                            <td className="min-w-[260px] px-4 py-4">
                              <p className="text-main font-bold">{tipo.nombre}</p>
                              <p className="text-muted text-xs">{tipo.codigo}</p>
                            </td>
                            <td className="text-muted whitespace-nowrap px-4 py-4">
                              {[
                                tipo.aplicaConductor ? "Conductores" : null,
                                tipo.aplicaUnidad ? "Unidades" : null,
                              ]
                                .filter(Boolean)
                                .join(" / ")}
                            </td>
                            <td className="text-muted whitespace-nowrap px-4 py-4">
                              {[
                                tipo.requiereFechaEmision ? "Emisión" : null,
                                tipo.requiereFechaVencimiento ? "Vencimiento" : null,
                              ]
                                .filter(Boolean)
                                .join(" / ") || "Sin fechas obligatorias"}
                            </td>
                            <td className="text-muted whitespace-nowrap px-4 py-4">
                              {tipo.diasAlerta} días
                            </td>
                            <td className="whitespace-nowrap px-4 py-4 text-center">
                              <EstadoBadge estado={tipo.activo ? "VIGENTE" : "ARCHIVADO"} />
                            </td>
                            <td className="whitespace-nowrap px-4 py-4">
                              <AccionesTipo tipo={tipo} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <TablePagination
                  page={paginationTipos.page}
                  totalPages={paginationTipos.totalPages}
                  total={paginationTipos.total}
                  limit={paginationTipos.limit}
                  onPageChange={cargarTiposDocumentacion}
                />
              </>
            )}
          </>
        )}

        <DocumentacionModal
          open={modalOpen}
          mode={mode}
          data={selectedDocumento}
          conductores={
            Array.isArray(conductoresCatalogo) ? conductoresCatalogo : []
          }
          unidades={Array.isArray(unidadesCatalogo) ? unidadesCatalogo : []}
          loadingCatalogos={loadingCatalogos}
          tiposDocumentacion={
            Array.isArray(tiposDocumentacion)
              ? tiposDocumentacion.filter((tipo) => tipo.activo)
              : []
          }
          onClose={cerrarModal}
          onSubmit={guardarDocumento}
          saving={saving}
        />
        <TipoDocumentacionModal
          open={tipoModalOpen}
          mode={tipoMode}
          data={selectedTipo}
          onClose={cerrarTipoModal}
          onSubmit={guardarTipo}
          saving={saving}
        />
        <ImportarDocumentacionModal
          open={importModalOpen}
          onClose={cerrarImportar}
          onSubmit={importarDocumentos}
          saving={saving}
        />
      </div>
    </div>
  );
}

export default DocumentacionPage;
