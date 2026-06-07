import { useMemo, useState } from "react";
import { CalendarDays, Download, FileSpreadsheet, LoaderCircle } from "lucide-react";
import {
  obtenerReporteServicioDetalleRequest,
  obtenerReporteServiciosRequest,
} from "../api/reportes";
import { normalizeCollection, normalizeResource } from "../utils/apiData";
import { formatDateOnly } from "../utils/date";
import { notify } from "../utils/notify";

const REPORT_LIMIT = 1000;

const getDefaultDateRange = () => {
  const today = new Date();

  const toInputDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  return {
    fechaInicio: toInputDate(today),
    fechaFin: toInputDate(today),
  };
};

const getId = (item) => item?.id ?? item?._id ?? "";

const normalizeText = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  return String(value).trim() || "-";
};

const getPersonaNombre = (persona) =>
  normalizeText(
    persona?.razonSocial ||
      persona?.nombreComercial ||
      [persona?.nombres, persona?.apellidos].filter(Boolean).join(" ")
  );

const getPersonaDocumento = (persona) =>
  normalizeText(persona?.numeroDocumento || persona?.documento || persona?.ruc);

const getConductorNombre = (conductor) =>
  normalizeText([conductor?.nombres, conductor?.apellidos].filter(Boolean).join(" "));

const getPlacaUnidad = (unidad) =>
  normalizeText(unidad?.placa || unidad?.numeroPlaca || unidad?.codigo);

const getNumeroGuiaSistema = (servicio) => {
  const guias = Array.isArray(servicio?.guiasTransportista)
    ? servicio.guiasTransportista
    : [];
  const guia = guias.find((item) => !["ANULADA", "ERROR"].includes(item?.estado)) || guias[0];

  if (!guia) return "-";

  const serie = normalizeText(guia.serie);
  const numero = normalizeText(guia.numero);

  if (serie === "-" && numero === "-") return "-";
  if (serie === "-") return numero;
  if (numero === "-") return serie;

  return `${serie}-${numero}`;
};

const getFechaServicio = (servicio) =>
  servicio?.fechaInicioTraslado ||
  servicio?.fechaProgramada ||
  servicio?.ordenServicio?.fechaProgramada ||
  servicio?.orden?.fechaProgramada ||
  "";

const toDateOnly = (value) => {
  if (!value) return "";
  const text = String(value);
  const match = text.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const isBetweenDates = (value, start, end) => {
  const date = toDateOnly(value);
  if (!date) return false;
  if (start && date < start) return false;
  if (end && date > end) return false;
  return true;
};

const getOrden = (servicio) =>
  servicio?.ordenServicio || servicio?.orden || servicio?.orden_servicio || {};

const getCliente = (servicio, orden) =>
  orden?.clienteSolicitante ||
  orden?.cliente ||
  servicio?.clienteSolicitante ||
  servicio?.cliente ||
  {
    razonSocial:
      orden?.clienteSolicitanteRazonSocial || servicio?.clienteSolicitanteRazonSocial,
    numeroDocumento:
      orden?.clienteSolicitanteNumeroDocumento ||
      servicio?.clienteSolicitanteNumeroDocumento,
  };

const getPersonaFromFlatFields = (source, prefix, fallback = {}) =>
  fallback?.razonSocial || fallback?.numeroDocumento || fallback?.direccion
    ? fallback
    : {
        tipoDocumento: source?.[`${prefix}TipoDocumento`],
        numeroDocumento: source?.[`${prefix}NumeroDocumento`],
        razonSocial: source?.[`${prefix}RazonSocial`],
        direccion: source?.[`${prefix}Direccion`],
      };

const getPuntoFromFlatFields = (source, prefix, fallback = {}) =>
  fallback?.direccion || fallback?.ubigeo
    ? fallback
    : {
        ubigeo: source?.[`${prefix}Ubigeo`],
        direccion: source?.[`${prefix}Direccion`],
        referencia: source?.[`${prefix}Referencia`],
      };

const getServicioDetalle = (servicio) => {
  const orden = getOrden(servicio);
  const cliente = getCliente(servicio, orden);
  const remitente = getPersonaFromFlatFields(
    orden,
    "remitente",
    orden?.remitente || servicio?.remitente || {}
  );
  const destinatario = getPersonaFromFlatFields(
    orden,
    "destinatario",
    orden?.destinatario || servicio?.destinatario || {}
  );
  const partida = getPuntoFromFlatFields(
    orden,
    "partida",
    orden?.partida || servicio?.partida || {}
  );
  const llegada = getPuntoFromFlatFields(
    orden,
    "llegada",
    orden?.llegada || servicio?.llegada || {}
  );
  const conductor = servicio?.conductor || orden?.conductor || {};
  const unidad = servicio?.vehiculoPrincipal || servicio?.unidad || servicio?.vehiculo || {};
  const carreta = servicio?.vehiculoSecundario || servicio?.carreta || {};
  const devolucion = servicio?.devolucionContenedor || orden?.devolucionContenedor || {};

  return {
    fecha: getFechaServicio(servicio),
    numeroProgramacion:
      servicio?.numeroProgramacion ||
      (getId(servicio) ? `PV-${String(getId(servicio)).padStart(6, "0")}` : "-"),
    numeroOrden: normalizeText(orden?.numeroOrden || servicio?.numeroOrden),
    cliente,
    remitente,
    destinatario,
    partida,
    llegada,
    conductor,
    unidad,
    carreta,
    tipoCarga: normalizeText(orden?.tipoCarga || servicio?.tipoCarga),
    clasificacionCarga: normalizeText(
      orden?.clasificacionCarga || servicio?.clasificacionCarga || "GENERAL"
    ),
    numeroContenedor: normalizeText(
      servicio?.numeroContenedor || orden?.numeroContenedor
    ),
    dimensionCarga: normalizeText(orden?.dimensionCarga || servicio?.dimensionCarga),
    estadoServicio: normalizeText(servicio?.estado),
    estadoOrden: normalizeText(orden?.estado),
    guiaSistemaNumero: getNumeroGuiaSistema(servicio),
    guiaSunatNumero: normalizeText(servicio?.guiaSunatNumero),
    fechaVencimientoDevolucion:
      devolucion?.fechaVencimientoDevolucion || orden?.fechaVencimientoDevolucion,
    estadoDevolucion: normalizeText(
      devolucion?.estadoDevolucion || servicio?.estadoDevolucion || orden?.estadoDevolucion
    ),
    almacenDevolucion: normalizeText(
      devolucion?.almacenDevolucion || servicio?.almacenDevolucion || orden?.almacenDevolucion
    ),
    fechaDevolucion:
      devolucion?.fechaDevolucion || servicio?.fechaDevolucion || orden?.fechaDevolucion,
    placaDevolucion: normalizeText(
      devolucion?.tractoDevolucion?.placa ||
        devolucion?.placaDevolucion ||
        servicio?.placaDevolucion ||
        orden?.placaDevolucion
    ),
    observaciones: normalizeText(servicio?.observaciones || orden?.observaciones),
  };
};

const necesitaDetalle = (servicio) => {
  const orden = getOrden(servicio);
  return !(
    orden?.remitente?.razonSocial ||
    orden?.remitenteRazonSocial ||
    orden?.destinatario?.razonSocial ||
    orden?.destinatarioRazonSocial ||
    orden?.partida?.direccion ||
    orden?.partidaDireccion ||
    orden?.llegada?.direccion ||
    orden?.llegadaDireccion
  );
};

const enriquecerServicio = async (servicio) => {
  const id = getId(servicio);

  if (!id || !necesitaDetalle(servicio)) return servicio;

  try {
    const res = await obtenerReporteServicioDetalleRequest(id);
    return normalizeResource(res.data, ["programacion"]) || servicio;
  } catch (error) {
    console.warn("No se pudo obtener detalle de programación", id, error);
    return servicio;
  }
};

const excelEscape = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const buildExcelHtml = (rows, filters) => {
  const headers = [
    "Fecha servicio",
    "Programación",
    "Orden servicio",
    "Cliente",
    "RUC/DNI cliente",
    "Remitente",
    "Documento remitente",
    "Destinatario",
    "Documento destinatario",
    "Punto partida",
    "Ubigeo partida",
    "Punto llegada",
    "Ubigeo llegada",
    "Conductor",
    "Documento conductor",
    "Tracto",
    "Carreta",
    "Tipo carga",
    "Clasificación",
    "Contenedor",
    "Dimensión",
    "Guía sistema",
    "Guía SUNAT",
    "Estado servicio",
    "Estado orden",
    "Estado devolución",
    "Vencimiento devolución",
    "Almacén devolución",
    "Fecha devolución",
    "Placa devolución",
    "Observaciones",
  ];

  const bodyRows = rows.map((item) => [
    formatDateOnly(item.fecha),
    item.numeroProgramacion,
    item.numeroOrden,
    getPersonaNombre(item.cliente),
    getPersonaDocumento(item.cliente),
    getPersonaNombre(item.remitente),
    getPersonaDocumento(item.remitente),
    getPersonaNombre(item.destinatario),
    getPersonaDocumento(item.destinatario),
    item.partida?.direccion || "-",
    item.partida?.ubigeo || "-",
    item.llegada?.direccion || "-",
    item.llegada?.ubigeo || "-",
    getConductorNombre(item.conductor),
    getPersonaDocumento(item.conductor),
    getPlacaUnidad(item.unidad),
    getPlacaUnidad(item.carreta),
    item.tipoCarga,
    item.clasificacionCarga,
    item.numeroContenedor,
    item.dimensionCarga !== "-" ? `${item.dimensionCarga} pies` : "-",
    item.guiaSistemaNumero,
    item.guiaSunatNumero,
    item.estadoServicio,
    item.estadoOrden,
    item.estadoDevolucion,
    formatDateOnly(item.fechaVencimientoDevolucion),
    item.almacenDevolucion,
    formatDateOnly(item.fechaDevolucion),
    item.placaDevolucion,
    item.observaciones,
  ]);

  return `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <style>
      table { border-collapse: collapse; font-family: Arial, sans-serif; font-size: 12px; }
      th { background: #1f4e78; color: #ffffff; font-weight: bold; }
      th, td { border: 1px solid #b7b7b7; padding: 6px; mso-number-format: "\\@"; }
      .title { font-size: 18px; font-weight: bold; background: #d9eaf7; }
      .range { font-weight: bold; background: #edf4fb; }
    </style>
  </head>
  <body>
    <table>
      <tr><td class="title" colspan="${headers.length}">Reporte detalle de servicios</td></tr>
      <tr><td class="range" colspan="${headers.length}">Rango: ${excelEscape(formatDateOnly(filters.fechaInicio))} al ${excelEscape(formatDateOnly(filters.fechaFin))}</td></tr>
      <tr>${headers.map((header) => `<th>${excelEscape(header)}</th>`).join("")}</tr>
      ${bodyRows
        .map(
          (row) =>
            `<tr>${row.map((cell) => `<td>${excelEscape(cell)}</td>`).join("")}</tr>`
        )
        .join("")}
    </table>
  </body>
</html>`;
};

const downloadExcel = (html, filters) => {
  const blob = new Blob([html], {
    type: "application/vnd.ms-excel;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `reporte-servicios-${filters.fechaInicio}-${filters.fechaFin}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const ReportesPage = () => {
  const defaultRange = useMemo(() => getDefaultDateRange(), []);
  const [filters, setFilters] = useState(defaultRange);
  const [loading, setLoading] = useState(false);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const descargarReporte = async (event) => {
    event.preventDefault();

    if (!filters.fechaInicio || !filters.fechaFin) {
      notify.error("Selecciona el rango de fechas");
      return;
    }

    if (filters.fechaInicio > filters.fechaFin) {
      notify.error("La fecha inicial no puede ser mayor que la fecha final");
      return;
    }

    try {
      setLoading(true);
      const res = await obtenerReporteServiciosRequest({
        page: 1,
        limit: REPORT_LIMIT,
        fechaInicio: filters.fechaInicio,
        fechaFin: filters.fechaFin,
      });

      const servicios = normalizeCollection(res.data, ["programaciones", "servicios"]);
      const serviciosFiltrados = servicios.filter((servicio) =>
        isBetweenDates(getFechaServicio(servicio), filters.fechaInicio, filters.fechaFin)
      );
      const serviciosConDetalle = await Promise.all(
        serviciosFiltrados.map(enriquecerServicio)
      );
      const detalles = serviciosConDetalle
        .filter((servicio) =>
          isBetweenDates(getFechaServicio(servicio), filters.fechaInicio, filters.fechaFin)
        )
        .map(getServicioDetalle);

      if (detalles.length === 0) {
        notify.info("No hay servicios en el rango seleccionado");
        return;
      }

      downloadExcel(buildExcelHtml(detalles, filters), filters);
      notify.success("Reporte Excel descargado");
    } catch (error) {
      console.error("Error al descargar reporte de servicios:", error);
      notify.error(
        error.response?.data?.message || "No se pudo descargar el reporte de servicios"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full py-4">
      <div className="page-wrap">
        <header className="page-hero">
          <div className="flex flex-col gap-5 p-5 sm:p-6">
            <div>
              <div className="eyebrow">Análisis operativo</div>
              <h1 className="page-title">Reportes</h1>
              <p className="page-description">
                Descarga el detalle completo de servicios en formato Excel.
              </p>
            </div>
          </div>
        </header>

        <form onSubmit={descargarReporte} className="panel p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-300">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-main text-base font-semibold">
                Detalle de servicios
              </h2>
              <p className="text-muted text-sm">
                Selecciona el rango de fechas y descarga el archivo.
              </p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
            <label className="block">
              <span className="text-faint mb-2 flex items-center gap-2 text-xs font-semibold uppercase">
                <CalendarDays className="h-4 w-4" />
                Fecha desde
              </span>
              <input
                type="date"
                name="fechaInicio"
                value={filters.fechaInicio}
                onChange={handleFilterChange}
                className="input"
              />
            </label>

            <label className="block">
              <span className="text-faint mb-2 flex items-center gap-2 text-xs font-semibold uppercase">
                <CalendarDays className="h-4 w-4" />
                Fecha hasta
              </span>
              <input
                type="date"
                name="fechaFin"
                value={filters.fechaFin}
                onChange={handleFilterChange}
                className="input"
              />
            </label>

            <button
              type="submit"
              className="btn-primary px-4 py-2"
              disabled={loading}
            >
              {loading ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Descargar Excel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportesPage;
