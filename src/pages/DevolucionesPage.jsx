import { useEffect, useRef, useState } from "react";
import { notify } from "../utils/notify";
import {
  ArrowUpDown,
  CalendarClock,
  CheckCircle2,
  Eye,
  LoaderCircle,
  Pencil,
  Search,
  X,
} from "lucide-react";
import { useOrdenesServicio } from "../context/OrdenServicioContext";
import { useConductores } from "../context/ConductorContext";
import { useUnidades } from "../context/UnidadContext";
import { obtenerProgramacionDevolucionesRequest } from "../api/ordenServicio";
import TablePagination from "../components/TablePagination";
import { getTodayInputDate } from "../utils/date";

const getItemId = (item) =>
  item?.devolucionContenedorId ?? item?.id ?? item?._id;

const LIMITE_DEVOLUCIONES = 100;

const getOrdenServicio = (item) =>
  item?.ordenServicio ||
  item?.orden ||
  item?.programacionViaje?.ordenServicio ||
  item ||
  {};

const getProgramacionViaje = (item) =>
  item?.programacionViaje || item?.programacion || item?.viaje || {};

const getValue = (item, field, fallback = "") => {
  const programacion = getProgramacionViaje(item);

  if (field === "numeroContenedor") {
    return programacion?.numeroContenedor || item?.[field] || fallback;
  }

  const orden = getOrdenServicio(item);
  return item?.[field] ?? orden?.[field] ?? fallback;
};

const getClienteSolicitante = (item) => {
  const orden = getOrdenServicio(item);
  return (
    item?.clienteSolicitante ||
    item?.cliente ||
    orden?.clienteSolicitante ||
    orden?.cliente ||
    null
  );
};

const getFechaProgramada = (item) => {
  const programacion = getProgramacionViaje(item);
  return (
    getValue(item, "fechaProgramada", null) ||
    programacion?.fechaInicioTraslado ||
    programacion?.fechaProgramada ||
    null
  );
};

const getOrdenViaje = (item) => {
  const programacion = getProgramacionViaje(item);
  const id = item?.programacionViajeId ?? programacion?.id ?? programacion?._id;

  if (programacion?.numeroProgramacion) return programacion.numeroProgramacion;
  if (!id) return "-";

  return `PV-${String(id).padStart(6, "0")}`;
};

const getNumeroOrdenServicio = (item) =>
  getOrdenServicio(item)?.numeroOrden || "-";

const getAccionPayload = (item) => ({
  devolucionContenedorId: item?.devolucionContenedorId ?? item?.id,
  programacionViajeId:
    item?.programacionViajeId ?? getProgramacionViaje(item)?.id ?? undefined,
});

const normalizar = (value) =>
  String(value || "")
    .trim()
    .toUpperCase();

const getPlacaUnidad = (unidad) =>
  unidad?.placa || unidad?.numeroPlaca || unidad?.placaUnidad || "";

const getNombreConductor = (conductor) =>
  conductor
    ? `${conductor.nombres || ""} ${conductor.apellidos || ""}`.trim() || "-"
    : "-";

const estaProgramada = (orden) =>
  normalizar(getValue(orden, "estadoDevolucion", "")) === "PROGRAMADA";

function DevolucionesPage() {
  const {
    devolucionesPendientes = [],
    loading,
    paginationDevoluciones,
    cargarDevolucionesPendientes,
    actualizarEstadoDevolucion,
  } = useOrdenesServicio();
  const {
    conductores = [],
    obtenerTodosConductores,
    obtenerConductores,
    getConductores,
  } = useConductores();
  const { unidades = [], obtenerUnidades, obtenerTodasUnidades } = useUnidades();
  const primeraBusquedaRef = useRef(true);

  const [actualizando, setActualizando] = useState({});
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);
  const [detalleDevolucion, setDetalleDevolucion] = useState(null);
  const [programacionModalOpen, setProgramacionModalOpen] = useState(false);
  const [fechaProgramacionConsulta, setFechaProgramacionConsulta] =
    useState(getTodayInputDate());
  const [programacionDevoluciones, setProgramacionDevoluciones] = useState([]);
  const [loadingProgramacion, setLoadingProgramacion] = useState(false);
  const [modalMode, setModalMode] = useState("edit");
  const [filtroCliente, setFiltroCliente] = useState("");
  const [ordenTabla, setOrdenTabla] = useState("cliente");
  const [direccionTabla, setDireccionTabla] = useState("asc");
  const [formDevolucion, setFormDevolucion] = useState({
    numeroContenedor: "",
    fechaVencimientoDevolucion: "",
    almacenDevolucion: "",
    fechaProgramadaDevolucion: "",
    horaProgramadaDevolucion: "",
    fechaDevolucion: getTodayInputDate(),
    horaDevolucion: "",
    conductorDevolucionId: "",
    tractoDevolucionId: "",
    observacionDevolucion: "",
  });

  useEffect(() => {
    cargarDevolucionesPendientes({
      page: 1,
      limit: LIMITE_DEVOLUCIONES,
      sortBy: ordenTabla,
      sortDirection: direccionTabla,
    });
    if (obtenerTodosConductores) {
      obtenerTodosConductores();
    } else if (obtenerConductores) {
      obtenerConductores();
    } else {
      getConductores?.();
    }
    if (obtenerTodasUnidades) {
      obtenerTodasUnidades({
        page: 1,
        limit: 100,
        tipoUnidad: "TRACTO",
        estado: "ACTIVO",
      });
    } else {
      obtenerUnidades?.({
        page: 1,
        limit: 100,
        tipoUnidad: "TRACTO",
        estado: "ACTIVO",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recargarDevoluciones = (page = paginationDevoluciones.page) =>
    cargarDevolucionesPendientes({
      page,
      limit: LIMITE_DEVOLUCIONES,
      search: filtroCliente.trim(),
      sortBy: ordenTabla,
      sortDirection: direccionTabla,
    });

  useEffect(() => {
    if (primeraBusquedaRef.current) {
      primeraBusquedaRef.current = false;
      return;
    }

    const timeoutId = window.setTimeout(() => {
      recargarDevoluciones(1);
    }, 300);

    return () => window.clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroCliente, ordenTabla, direccionTabla]);

  const formatearFecha = (fecha) => {
    if (!fecha) return "-";

    const date = new Date(fecha);
    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const calcularDiasLibres = (fechaVencimiento) => {
    if (!fechaVencimiento) return null;

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const vencimiento = new Date(fechaVencimiento);
    vencimiento.setHours(0, 0, 0, 0);

    if (Number.isNaN(vencimiento.getTime())) return null;

    return Math.ceil((vencimiento.getTime() - hoy.getTime()) / 86400000);
  };

  const EstadoDevolucionBadge = ({ estado }) => {
    const estadoNormalizado = normalizar(estado || "PENDIENTE");
    const isProgramada = estadoNormalizado === "PROGRAMADA";

    return (
      <span
        className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-bold tracking-wide ${
          isProgramada
            ? "border-blue-500/30 bg-blue-500/10 text-blue-400"
            : "border-amber-500/30 bg-amber-500/10 text-amber-400"
        }`}
      >
        {isProgramada ? "PROGRAMADA" : "PENDIENTE"}
      </span>
    );
  };

  const abrirModalDevolucion = (orden, mode = "edit") => {
    const fechaProgramadaDevolucion = getValue(
      orden,
      "fechaProgramadaDevolucion",
      ""
    )
      ? getValue(orden, "fechaProgramadaDevolucion", "").slice(0, 10)
      : "";
    const fechaDevolucionGuardada = getValue(orden, "fechaDevolucion", "")
      ? getValue(orden, "fechaDevolucion", "").slice(0, 10)
      : "";

    setOrdenSeleccionada(orden);
    setModalMode(mode);
    setFormDevolucion({
      numeroContenedor: getValue(orden, "numeroContenedor", ""),
      fechaVencimientoDevolucion: getValue(
        orden,
        "fechaVencimientoDevolucion",
        ""
      )
        ? getValue(orden, "fechaVencimientoDevolucion", "").slice(0, 10)
        : "",
      almacenDevolucion: getValue(orden, "almacenDevolucion", ""),
      fechaProgramadaDevolucion,
      horaProgramadaDevolucion: getValue(orden, "horaProgramadaDevolucion", ""),
      fechaDevolucion:
        fechaDevolucionGuardada ||
        (mode === "return" ? fechaProgramadaDevolucion : getTodayInputDate()),
      horaDevolucion: getValue(orden, "horaDevolucion", ""),
      conductorDevolucionId: getValue(orden, "conductorDevolucionId", "") || "",
      tractoDevolucionId: getValue(orden, "tractoDevolucionId", "") || "",
      observacionDevolucion: getValue(orden, "observacionDevolucion", ""),
    });
  };

  const cerrarModalDevolucion = () => {
    setOrdenSeleccionada(null);
    setModalMode("edit");
    setFormDevolucion({
      numeroContenedor: "",
      fechaVencimientoDevolucion: "",
      almacenDevolucion: "",
      fechaProgramadaDevolucion: "",
      horaProgramadaDevolucion: "",
      fechaDevolucion: getTodayInputDate(),
      horaDevolucion: "",
      conductorDevolucionId: "",
      tractoDevolucionId: "",
      observacionDevolucion: "",
    });
  };

  const abrirDetalleDevolucion = (orden) => {
    setDetalleDevolucion(orden);
  };

  const cerrarDetalleDevolucion = () => {
    setDetalleDevolucion(null);
  };

  const cargarProgramacionDevoluciones = async (
    fecha = fechaProgramacionConsulta
  ) => {
    if (!fecha) {
      notify.error("Selecciona una fecha");
      return;
    }

    try {
      setLoadingProgramacion(true);
      const res = await obtenerProgramacionDevolucionesRequest({ fecha });
      setProgramacionDevoluciones(
        Array.isArray(res.data?.devoluciones) ? res.data.devoluciones : []
      );
    } catch (error) {
      notify.error(
        error.response?.data?.message ||
          "No se pudo cargar la programación de devoluciones"
      );
    } finally {
      setLoadingProgramacion(false);
    }
  };

  const abrirProgramacionDevoluciones = () => {
    setProgramacionModalOpen(true);
    cargarProgramacionDevoluciones(fechaProgramacionConsulta);
  };

  const cerrarProgramacionDevoluciones = () => {
    setProgramacionModalOpen(false);
  };

  const tieneDatosDevolucion = (orden) => {
    return Boolean(
      getValue(orden, "numeroContenedor", "") &&
        getValue(orden, "fechaVencimientoDevolucion", "") &&
        getValue(orden, "almacenDevolucion", "")
    );
  };

  const abrirMarcarDevuelto = (orden) => {
    if (!tieneDatosDevolucion(orden)) {
      notify.error("Primero completa los datos de devolución");
      abrirModalDevolucion(orden, "edit");
      return;
    }

    if (getValue(orden, "estadoDevolucion", "") !== "PROGRAMADA") {
      notify.error("Primero programa la devolución");
      abrirModalDevolucion(orden, "schedule");
      return;
    }

    abrirModalDevolucion(orden, "return");
  };

  const validarNumeroContenedor = () => {
    if (!formDevolucion.numeroContenedor.trim()) {
      notify.error("Ingresa el número de contenedor");
      return false;
    }

    return true;
  };

  const validarDatosContenedor = () => {
    if (!validarNumeroContenedor()) return false;

    if (!formDevolucion.fechaVencimientoDevolucion) {
      notify.error("Selecciona la fecha de vencimiento");
      return false;
    }

    if (!formDevolucion.almacenDevolucion.trim()) {
      notify.error("Ingresa el almacén de devolución");
      return false;
    }

    return true;
  };

  const validarProgramacionDevolucion = () => {
    if (!validarDatosContenedor()) return false;

    if (!formDevolucion.fechaProgramadaDevolucion) {
      notify.error("Selecciona la fecha programada de devolución");
      return false;
    }

    if (!formDevolucion.horaProgramadaDevolucion) {
      notify.error("Selecciona la hora programada de devolución");
      return false;
    }

    if (!formDevolucion.conductorDevolucionId) {
      notify.error("Selecciona el conductor asignado");
      return false;
    }

    if (!formDevolucion.tractoDevolucionId) {
      notify.error("Selecciona la unidad asignada");
      return false;
    }

    return true;
  };

  const guardarDatosDevolucion = async () => {
    const orden = ordenSeleccionada;
    const id = getItemId(orden);
    if (!id) return;

    try {
      setActualizando((prev) => ({ ...prev, [id]: true }));
      await actualizarEstadoDevolucion(
        id,
        {
          ...getAccionPayload(orden),
          estadoDevolucion: "PENDIENTE",
          numeroContenedor: formDevolucion.numeroContenedor,
          fechaVencimientoDevolucion: formDevolucion.fechaVencimientoDevolucion,
          almacenDevolucion: formDevolucion.almacenDevolucion,
          observacionDevolucion: formDevolucion.observacionDevolucion,
        },
        { skipRefresh: true }
      );
      notify.success("Datos de devolución guardados");
      cerrarModalDevolucion();
      await recargarDevoluciones();
    } catch (error) {
      notify.error(
        error.response?.data?.message ||
          "No se pudieron guardar los datos de devolución"
      );
    } finally {
      setActualizando((prev) => ({ ...prev, [id]: false }));
    }
  };

  const programarDevolucion = async () => {
    const orden = ordenSeleccionada;
    const id = getItemId(orden);
    if (!id) return;

    if (!validarProgramacionDevolucion()) return;

    try {
      setActualizando((prev) => ({ ...prev, [id]: true }));
      await actualizarEstadoDevolucion(
        id,
        {
          ...getAccionPayload(orden),
          estadoDevolucion: "PROGRAMADA",
          numeroContenedor: formDevolucion.numeroContenedor,
          fechaVencimientoDevolucion: formDevolucion.fechaVencimientoDevolucion,
          almacenDevolucion: formDevolucion.almacenDevolucion,
          fechaProgramadaDevolucion: formDevolucion.fechaProgramadaDevolucion,
          horaProgramadaDevolucion: formDevolucion.horaProgramadaDevolucion,
          conductorDevolucionId: Number(formDevolucion.conductorDevolucionId),
          tractoDevolucionId: Number(formDevolucion.tractoDevolucionId),
          observacionDevolucion: formDevolucion.observacionDevolucion,
        },
        { skipRefresh: true }
      );
      notify.success("Devolución programada correctamente");
      cerrarModalDevolucion();
      await recargarDevoluciones();
    } catch (error) {
      notify.error(
        error.response?.data?.message || "No se pudo programar la devolución"
      );
    } finally {
      setActualizando((prev) => ({ ...prev, [id]: false }));
    }
  };

  const marcarDevuelto = async () => {
    const orden = ordenSeleccionada;
    const id = getItemId(orden);
    if (!id) return;

    if (!validarProgramacionDevolucion()) return;

    if (!formDevolucion.fechaDevolucion) {
      notify.error("Selecciona la fecha de devolución");
      return;
    }

    try {
      setActualizando((prev) => ({ ...prev, [id]: true }));
      await actualizarEstadoDevolucion(
        id,
        {
          ...getAccionPayload(orden),
          estadoDevolucion: "DEVUELTO",
          numeroContenedor: formDevolucion.numeroContenedor,
          fechaVencimientoDevolucion: formDevolucion.fechaVencimientoDevolucion,
          almacenDevolucion: formDevolucion.almacenDevolucion,
          fechaProgramadaDevolucion: formDevolucion.fechaProgramadaDevolucion,
          horaProgramadaDevolucion: formDevolucion.horaProgramadaDevolucion,
          fechaDevolucion: formDevolucion.fechaDevolucion,
          conductorDevolucionId: Number(formDevolucion.conductorDevolucionId),
          tractoDevolucionId: Number(formDevolucion.tractoDevolucionId),
          observacionDevolucion: formDevolucion.observacionDevolucion,
        },
        { skipRefresh: true }
      );
      notify.success("Devolución marcada como devuelta");
      cerrarModalDevolucion();
      const nextPage =
        devolucionesPendientes.length === 1 && paginationDevoluciones.page > 1
          ? paginationDevoluciones.page - 1
          : paginationDevoluciones.page;
      await recargarDevoluciones(nextPage);
    } catch (error) {
      notify.error(
        error.response?.data?.message ||
          "No se pudo actualizar la devolución"
      );
    } finally {
      setActualizando((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handlePageChange = (page) => {
    recargarDevoluciones(page);
  };

  const tractos = Array.isArray(unidades)
    ? unidades.filter(
        (unidad) =>
          normalizar(unidad.tipoUnidad) === "TRACTO" &&
          normalizar(unidad.estado) === "ACTIVO"
      )
    : [];

  const ConductoresSelect = () => (
    <select
      name="conductorDevolucionId"
      value={formDevolucion.conductorDevolucionId}
      onChange={(event) =>
        setFormDevolucion((prev) => ({
          ...prev,
          conductorDevolucionId: event.target.value,
        }))
      }
      className="input p-3"
    >
      <option value="">Seleccione conductor</option>
      {conductores.map((conductor) => (
        <option key={getItemId(conductor)} value={getItemId(conductor)}>
          {conductor.nombres} {conductor.apellidos}
        </option>
      ))}
    </select>
  );

  const TractosSelect = () => (
    <select
      name="tractoDevolucionId"
      value={formDevolucion.tractoDevolucionId}
      onChange={(event) =>
        setFormDevolucion((prev) => ({
          ...prev,
          tractoDevolucionId: event.target.value,
        }))
      }
      className="input p-3"
    >
      <option value="">Seleccione placa</option>
      {tractos.map((unidad) => (
        <option key={getItemId(unidad)} value={getItemId(unidad)}>
          {getPlacaUnidad(unidad) || "SIN PLACA"}
          {unidad.marca ? ` - ${unidad.marca}` : ""}
        </option>
      ))}
    </select>
  );

  const devolucionesFiltradas = Array.isArray(devolucionesPendientes)
    ? devolucionesPendientes
    : [];

  const devolucionesResumen = devolucionesFiltradas.reduce(
    (acc, orden) => {
      const diasLibres = calcularDiasLibres(
        getValue(orden, "fechaVencimientoDevolucion", null)
      );
      const estado = normalizar(getValue(orden, "estadoDevolucion", ""));
      const programada = estado === "PROGRAMADA";

      acc.total += 1;
      acc.programadas += programada ? 1 : 0;
      acc.pendientes += programada ? 0 : 1;
      acc.vencidas += diasLibres !== null && diasLibres < 0 ? 1 : 0;
      acc.hoy += diasLibres === 0 ? 1 : 0;
      acc.proximas += diasLibres !== null && diasLibres > 0 && diasLibres <= 3 ? 1 : 0;

      return acc;
    },
    {
      total: 0,
      programadas: 0,
      pendientes: 0,
      vencidas: 0,
      hoy: 0,
      proximas: 0,
    }
  );

  const resumenCards = [
    {
      label: "Pendientes",
      value: devolucionesResumen.pendientes,
      helper: "Aún no programadas",
      tone: "amber",
    },
    {
      label: "Programadas",
      value: devolucionesResumen.programadas,
      helper: "Ya agendadas",
      tone: "blue",
    },
    {
      label: "Vencidas",
      value: devolucionesResumen.vencidas,
      helper: "Requieren atención",
      tone: "red",
    },
    {
      label: "Próximas 3 días",
      value: devolucionesResumen.proximas + devolucionesResumen.hoy,
      helper: "Hoy y próximos días",
      tone: "violet",
    },
  ];

  const toggleOrdenTabla = (clave) => {
    if (ordenTabla === clave) {
      setDireccionTabla((actual) => (actual === "asc" ? "desc" : "asc"));
      return;
    }

    setOrdenTabla(clave);
    setDireccionTabla("asc");
  };

  return (
    <div className="page">
      <div className="page-wrap">
        <header className="page-hero">
          <div className="page-hero-content">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <div className="eyebrow">Control operativo</div>
                <h1 className="page-title">Devoluciones</h1>
                <p className="page-description">
                  Órdenes de servicio con carga tipo contenedor pendientes de
                  devolución.
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                {resumenCards.map((card) => (
                  <div
                    key={card.label}
                    className={`rounded-xl border px-4 py-3 shadow-sm ${
                      card.tone === "amber"
                        ? "border-amber-500/20 bg-amber-500/8"
                        : card.tone === "blue"
                        ? "border-blue-500/20 bg-blue-500/8"
                        : card.tone === "red"
                        ? "border-red-500/20 bg-red-500/8"
                        : "border-violet-500/20 bg-violet-500/8"
                    }`}
                  >
                    <p className="text-faint text-[11px] font-bold uppercase tracking-wide">
                      {card.label}
                    </p>
                    <div className="mt-1 flex items-end justify-between gap-3">
                      <p className="text-main text-2xl font-extrabold">
                        {card.value}
                      </p>
                      <p className="text-faint text-[11px]">{card.helper}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </header>

        <div className="panel mb-4 p-4">
          <div className="grid gap-3 xl:grid-cols-[1fr_auto] xl:items-center">
            <div className="relative">
              <Search className="text-faint pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
              <input
                type="text"
                value={filtroCliente}
                onChange={(event) => setFiltroCliente(event.target.value)}
                className="input h-11 pl-9 pr-10"
                placeholder="Buscar por PV, cliente, orden, contenedor, placa o conductor"
              />
              {filtroCliente ? (
                <button
                  type="button"
                  onClick={() => setFiltroCliente("")}
                  className="text-faint hover:text-main absolute right-2 top-1/2 -translate-y-1/2 rounded p-1"
                  aria-label="Limpiar búsqueda"
                  title="Limpiar búsqueda"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2 xl:justify-end">
              {filtroCliente ? (
                <button
                  type="button"
                  onClick={() => setFiltroCliente("")}
                  className="btn-secondary px-4 py-2"
                >
                  Limpiar búsqueda
                </button>
              ) : null}

              <button
                type="button"
                onClick={abrirProgramacionDevoluciones}
                className="btn-primary px-4 py-2"
              >
                <CalendarClock className="h-4 w-4" />
                Programación
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading-panel">
            <div className="loading-spinner" />
            <p className="text-muted text-sm">Cargando devoluciones...</p>
          </div>
        ) : devolucionesFiltradas.length === 0 ? (
          <div className="empty-panel">
            <h2 className="text-main text-lg font-semibold">
              No hay devoluciones para mostrar
            </h2>
            <p className="text-muted mt-1 text-sm">
              Ajusta la búsqueda o limpia el texto para volver al listado.
            </p>
            {filtroCliente ? (
              <button
                type="button"
                onClick={() => setFiltroCliente("")}
                className="btn-secondary mt-4 px-4 py-2"
              >
                Limpiar búsqueda
              </button>
            ) : null}
          </div>
        ) : (
          <>
            <div className="mobile-list">
              {devolucionesFiltradas.map((orden) => {
                const id = getItemId(orden);
                const diasLibres = calcularDiasLibres(
                  getValue(orden, "fechaVencimientoDevolucion", null)
                );
                const cliente = getClienteSolicitante(orden);
                const programada = estaProgramada(orden);

                return (
                  <article
                    key={`${id}-${orden.programacionViajeId || ""}`}
                    className={`mobile-card ${
                      diasLibres !== null && diasLibres < 0
                        ? "border border-red-500/30"
                        : ""
                    }`}
                  >
                    <div className="mobile-card-header">
                      <div>
                        <p className="text-faint text-xs font-medium">
                          Programación de viaje
                        </p>
                        <h2 className="mobile-card-title">
                          {getOrdenViaje(orden)}
                        </h2>
                        <p className="mobile-card-subtitle">
                          Orden: {getNumeroOrdenServicio(orden)}
                        </p>
                      </div>

                      <EstadoDevolucionBadge
                        estado={getValue(orden, "estadoDevolucion", "PENDIENTE")}
                      />
                    </div>

                    <div className="mb-3 flex flex-wrap gap-2">
                      <span className="inline-flex rounded-full border border-[var(--app-border)] px-2.5 py-1 text-[11px] font-semibold text-[var(--app-text-muted)]">
                        {programada ? "Programada" : "Pendiente"}
                      </span>
                      {diasLibres !== null ? (
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                            diasLibres < 0
                              ? "border-red-500/30 bg-red-500/10 text-red-400"
                              : diasLibres === 0
                              ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                          }`}
                        >
                          {diasLibres < 0
                            ? `${Math.abs(diasLibres)} día(s) vencido`
                            : diasLibres === 0
                            ? "Vence hoy"
                            : `${diasLibres} día(s) para vencer`}
                        </span>
                      ) : null}
                    </div>

                    <div className="mobile-detail-grid">
                      <div className="info-tile sm:col-span-2">
                        <p className="mobile-card-subtitle">Cliente</p>
                        <p className="text-main truncate font-semibold">
                          {cliente?.razonSocial || "-"}
                        </p>
                        <p className="mobile-card-subtitle">
                          {cliente?.numeroDocumento || ""}
                        </p>
                      </div>

                      <div className="info-tile">
                        <p className="mobile-card-subtitle">Contenedor</p>
                        <p className="text-main font-semibold">
                          {getValue(orden, "numeroContenedor", "-")}
                        </p>
                      </div>

                      <div className="info-tile">
                        <p className="mobile-card-subtitle">Vencimiento</p>
                        <p
                          className={`font-semibold ${
                            diasLibres !== null && diasLibres < 0
                              ? "text-red-400"
                              : "text-main"
                          }`}
                        >
                          {formatearFecha(
                            getValue(orden, "fechaVencimientoDevolucion", null)
                          )}
                        </p>
                        <p className="mobile-card-subtitle">
                          {diasLibres === null
                            ? "-"
                            : diasLibres < 0
                            ? `${Math.abs(diasLibres)} día(s) vencido`
                            : `${diasLibres} día(s)`}
                        </p>
                      </div>
                    </div>

                    <div className="mobile-card-actions">
                      <div className="grid gap-2 sm:grid-cols-4">
                        <button
                          type="button"
                          onClick={() => abrirDetalleDevolucion(orden)}
                          className="btn-secondary btn-icon"
                          title="Ver detalle"
                          aria-label="Ver detalle"
                        >
                          <Eye />
                        </button>
                        <button
                          type="button"
                          onClick={() => abrirModalDevolucion(orden, "edit")}
                          disabled={actualizando[id]}
                          className="btn-secondary btn-icon"
                          title="Editar datos de devolución"
                          aria-label="Editar datos de devolución"
                        >
                          <Pencil />
                        </button>
                        <button
                          type="button"
                          onClick={() => abrirModalDevolucion(orden, "schedule")}
                          disabled={actualizando[id]}
                          className="btn-primary btn-icon"
                          title={
                            programada
                              ? "Reprogramar devolución"
                              : "Programar devolución"
                          }
                          aria-label={
                            programada
                              ? "Reprogramar devolución"
                              : "Programar devolución"
                          }
                        >
                          <CalendarClock />
                        </button>
                        {programada ? (
                          <button
                            type="button"
                            onClick={() => abrirMarcarDevuelto(orden)}
                            disabled={actualizando[id]}
                            className="btn-success btn-icon"
                            title="Marcar devuelto"
                            aria-label="Marcar devuelto"
                          >
                            {actualizando[id] ? (
                              <LoaderCircle className="animate-spin" />
                            ) : (
                              <CheckCircle2 />
                            )}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="data-table-wrap">
              <div className="table-scroll">
                <table className="data-table dense-table w-full min-w-[920px] text-sm">
                  <thead>
                    <tr>
                      <th className="px-4 py-4 text-left align-top">
                        <div className="flex min-w-[240px] flex-col gap-2">
                          <button
                            type="button"
                            onClick={() => toggleOrdenTabla("cliente")}
                            className="flex w-full items-center justify-between gap-2 text-left"
                            aria-label={`Ordenar por cliente ${
                              ordenTabla === "cliente" && direccionTabla === "asc"
                                ? "descendente"
                                : "ascendente"
                            }`}
                          >
                            <span className="text-xs font-bold uppercase text-[var(--app-text)]">
                              Cliente
                            </span>
                            <ArrowUpDown
                              className={`h-4 w-4 ${
                                ordenTabla === "cliente"
                                  ? "text-[var(--app-primary)]"
                                  : "text-faint"
                              }`}
                            />
                          </button>
                        </div>
                      </th>
                      <th className="px-4 py-4 text-left">Viaje / contenedor</th>
                      <th className="px-4 py-4 text-left">
                        <button
                          type="button"
                          onClick={() => toggleOrdenTabla("fechaVencimiento")}
                          className="flex w-full items-center justify-between gap-2 text-left"
                          aria-label={`Ordenar por fecha de vencimiento ${
                            ordenTabla === "fechaVencimiento" &&
                            direccionTabla === "asc"
                              ? "descendente"
                              : "ascendente"
                          }`}
                        >
                          <span className="text-xs font-bold uppercase text-[var(--app-text)]">
                            Vencimiento
                          </span>
                          <ArrowUpDown
                            className={`h-4 w-4 ${
                              ordenTabla === "fechaVencimiento"
                                ? "text-[var(--app-primary)]"
                                : "text-faint"
                            }`}
                          />
                        </button>
                      </th>
                      <th className="px-4 py-4 text-left">Programada</th>
                      <th className="px-4 py-4 text-center">Estado devolución</th>
                      <th className="px-4 py-4 text-center">Alerta</th>
                      <th className="px-4 py-4 text-right">Acciones</th>
                    </tr>
                  </thead>

                  <tbody>
                    {devolucionesFiltradas.map((orden) => {
                      const id = getItemId(orden);
                      const diasLibres = calcularDiasLibres(
                        getValue(orden, "fechaVencimientoDevolucion", null)
                      );
                      const cliente = getClienteSolicitante(orden);
                      const programada = estaProgramada(orden);

                      return (
                        <tr
                          key={`${id}-${orden.programacionViajeId || ""}`}
                          className={
                            diasLibres !== null && diasLibres < 0
                              ? "bg-red-500/[0.04]"
                              : ""
                          }
                        >
                          <td className="min-w-[220px] px-4 py-4">
                            <p className="text-main max-w-[260px] truncate font-semibold">
                              {cliente?.razonSocial || "-"}
                            </p>
                            <p className="mobile-card-subtitle">
                              {cliente?.numeroDocumento || ""}
                            </p>
                          </td>
                          <td className="px-4 py-4">
                            <p className="text-main font-bold">
                              {getOrdenViaje(orden)}
                            </p>
                            <p className="mobile-card-subtitle">
                              Orden: {getNumeroOrdenServicio(orden)}
                            </p>
                            <p className="text-main mt-1 font-semibold">
                              {getValue(orden, "numeroContenedor", "-")}
                            </p>
                          </td>
                          <td className="whitespace-nowrap px-4 py-4">
                            <p className="text-main font-semibold">
                              {formatearFecha(
                                getValue(
                                  orden,
                                  "fechaVencimientoDevolucion",
                                  null
                                )
                              )}
                            </p>
                            <span
                              className={
                                diasLibres !== null && diasLibres < 0
                                  ? "font-semibold text-red-400"
                                  : "text-muted"
                              }
                            >
                              {diasLibres === null
                                ? "-"
                                : diasLibres < 0
                                ? `${Math.abs(diasLibres)} vencido`
                                : `${diasLibres} día(s)`}
                            </span>
                          </td>
                          <td className="text-muted whitespace-nowrap px-4 py-4">
                            <p className="text-main font-semibold">
                              {formatearFecha(
                                getValue(
                                  orden,
                                  "fechaProgramadaDevolucion",
                                  null
                                )
                              )}
                            </p>
                            <p className="mobile-card-subtitle">
                              {getValue(orden, "horaProgramadaDevolucion", "") ||
                                ""}
                            </p>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <EstadoDevolucionBadge
                              estado={getValue(
                                orden,
                                "estadoDevolucion",
                                "PENDIENTE"
                              )}
                            />
                          </td>
                          <td className="px-4 py-4 text-center">
                            {diasLibres !== null && diasLibres < 0 ? (
                              <span className="inline-flex rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-[11px] font-semibold text-red-400">
                                Vencida
                              </span>
                            ) : diasLibres === 0 ? (
                              <span className="inline-flex rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-400">
                                Hoy
                              </span>
                            ) : diasLibres !== null && diasLibres <= 3 ? (
                              <span className="inline-flex rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-[11px] font-semibold text-violet-400">
                                Próxima
                              </span>
                            ) : (
                              <span className="text-faint text-xs">—</span>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => abrirDetalleDevolucion(orden)}
                                className="btn-secondary btn-icon"
                                title="Ver detalle"
                                aria-label="Ver detalle"
                              >
                                <Eye />
                              </button>
                              <button
                                type="button"
                                onClick={() => abrirModalDevolucion(orden, "edit")}
                                disabled={actualizando[id]}
                                className="btn-secondary btn-icon"
                                title="Editar datos de devolución"
                                aria-label="Editar datos de devolución"
                              >
                                <Pencil />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  abrirModalDevolucion(orden, "schedule")
                                }
                                disabled={actualizando[id]}
                                className="btn-primary btn-icon"
                                title={
                                  programada
                                    ? "Reprogramar devolución"
                                    : "Programar devolución"
                                }
                                aria-label={
                                  programada
                                    ? "Reprogramar devolución"
                                    : "Programar devolución"
                                }
                              >
                                <CalendarClock />
                              </button>
                              {programada ? (
                                <button
                                  type="button"
                                  onClick={() => abrirMarcarDevuelto(orden)}
                                  disabled={actualizando[id]}
                                  className="btn-success btn-icon"
                                  title="Marcar devuelto"
                                  aria-label="Marcar devuelto"
                                >
                                  {actualizando[id] ? (
                                    <LoaderCircle className="animate-spin" />
                                  ) : (
                                    <CheckCircle2 />
                                  )}
                                </button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <TablePagination
              page={paginationDevoluciones.page}
              totalPages={paginationDevoluciones.totalPages}
              total={paginationDevoluciones.total}
              limit={paginationDevoluciones.limit}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>

      {programacionModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-panel max-w-[96vw] 2xl:max-w-7xl">
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-main text-xl font-bold">
                  Programación de devoluciones
                </h2>
                <p className="text-muted text-sm">
                  Devoluciones programadas para la fecha seleccionada.
                </p>
              </div>

              <button
                type="button"
                onClick={cerrarProgramacionDevoluciones}
                className="text-muted self-end text-2xl hover:text-blue-500 lg:self-auto"
                aria-label="Cerrar programación"
              >
                ×
              </button>
            </div>

            <div className="mb-5 grid gap-3 lg:grid-cols-[220px_auto_1fr] lg:items-end">
              <label>
                <span className="text-muted mb-1 block text-sm">Fecha</span>
                <input
                  type="date"
                  value={fechaProgramacionConsulta}
                  onChange={(event) =>
                    setFechaProgramacionConsulta(event.target.value)
                  }
                  className="input p-3"
                />
              </label>

              <button
                type="button"
                onClick={() =>
                  cargarProgramacionDevoluciones(fechaProgramacionConsulta)
                }
                className="btn-primary px-4 py-2"
                disabled={loadingProgramacion}
              >
                {loadingProgramacion ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                Buscar
              </button>

              <div className="info-tile py-3">
                <p className="mobile-card-subtitle">Total programadas</p>
                <p className="text-main text-xl font-bold">
                  {programacionDevoluciones.length}
                </p>
              </div>
            </div>

            <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="info-tile py-3">
                <p className="mobile-card-subtitle">Vencidas</p>
                <p className="text-main text-xl font-bold">
                  {
                    programacionDevoluciones.filter(
                      (item) =>
                        calcularDiasLibres(
                          getValue(item, "fechaVencimientoDevolucion", null)
                        ) < 0
                    ).length
                  }
                </p>
              </div>
              <div className="info-tile py-3">
                <p className="mobile-card-subtitle">Hoy</p>
                <p className="text-main text-xl font-bold">
                  {
                    programacionDevoluciones.filter(
                      (item) =>
                        calcularDiasLibres(
                          getValue(item, "fechaVencimientoDevolucion", null)
                        ) === 0
                    ).length
                  }
                </p>
              </div>
              <div className="info-tile py-3">
                <p className="mobile-card-subtitle">Conductor</p>
                <p className="text-main text-xl font-bold">
                  {new Set(
                    programacionDevoluciones.map((item) =>
                      getNombreConductor(
                        getValue(item, "conductorDevolucion", null)
                      )
                    )
                  ).size}
                </p>
              </div>
              <div className="info-tile py-3">
                <p className="mobile-card-subtitle">Contenedores únicos</p>
                <p className="text-main text-xl font-bold">
                  {new Set(
                    programacionDevoluciones.map((item) =>
                      getValue(item, "numeroContenedor", "-")
                    )
                  ).size}
                </p>
              </div>
            </div>

            {loadingProgramacion ? (
              <div className="loading-panel">
                <div className="loading-spinner" />
                <p className="text-muted text-sm">
                  Cargando programación...
                </p>
              </div>
            ) : programacionDevoluciones.length === 0 ? (
              <div className="empty-panel">
                <h3 className="text-main text-lg font-semibold">
                  No hay devoluciones programadas
                </h3>
                <p className="text-muted mt-1 text-sm">
                  Cambia la fecha para consultar otra programación.
                </p>
              </div>
            ) : (
              <div className="data-table-wrap">
                <div className="table-scroll">
                  <table className="data-table dense-table w-full min-w-[1040px] text-sm">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left">Contenedor</th>
                        <th className="px-4 py-3 text-left">Dimensión</th>
                        <th className="px-4 py-3 text-left">Almacén</th>
                        <th className="px-4 py-3 text-left">Programación</th>
                        <th className="px-4 py-3 text-left">Conductor</th>
                        <th className="px-4 py-3 text-left">Placa</th>
                        <th className="px-4 py-3 text-left">Vencimiento</th>
                        <th className="px-4 py-3 text-left">Viaje</th>
                      </tr>
                    </thead>
                    <tbody>
                      {programacionDevoluciones.map((devolucion) => (
                        <tr
                          key={`programacion-${getItemId(devolucion)}-${
                            devolucion.programacionViajeId || ""
                          }`}
                        >
                          <td className="px-4 py-3 font-semibold text-main">
                            {getValue(devolucion, "numeroContenedor", "-")}
                          </td>
                          <td className="px-4 py-3 text-muted">
                            {getValue(devolucion, "dimensionCarga", "")
                              ? `${getValue(devolucion, "dimensionCarga", "")} pies`
                              : "-"}
                          </td>
                          <td className="min-w-[180px] px-4 py-3 text-muted">
                            {getValue(devolucion, "almacenDevolucion", "-")}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            <p className="text-main font-semibold">
                              {formatearFecha(
                                getValue(
                                  devolucion,
                                  "fechaProgramadaDevolucion",
                                  null
                                )
                              )}
                            </p>
                            <p className="mobile-card-subtitle">
                              {getValue(
                                devolucion,
                                "horaProgramadaDevolucion",
                                ""
                              ) || "-"}
                            </p>
                          </td>
                          <td className="min-w-[190px] px-4 py-3">
                            <p className="text-main font-semibold">
                              {getNombreConductor(
                                getValue(
                                  devolucion,
                                  "conductorDevolucion",
                                  null
                                )
                              )}
                            </p>
                          </td>
                          <td className="px-4 py-3 font-semibold text-main">
                            {getPlacaUnidad(
                              getValue(devolucion, "tractoDevolucion", null)
                            ) || "-"}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-muted">
                            {formatearFecha(
                              getValue(
                                devolucion,
                                "fechaVencimientoDevolucion",
                                null
                              )
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-main font-semibold">
                              {getOrdenViaje(devolucion)}
                            </p>
                            <p className="mobile-card-subtitle">
                              Orden: {getNumeroOrdenServicio(devolucion)}
                            </p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={cerrarProgramacionDevoluciones}
                className="btn-secondary px-3 py-1.5"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {detalleDevolucion && (
        <div className="modal-backdrop">
          <div className="modal-panel max-w-3xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-main text-xl font-bold">
                  Detalle de devolución
                </h2>
                <p className="text-muted text-sm">
                  {getOrdenViaje(detalleDevolucion)} · Orden{" "}
                  {getNumeroOrdenServicio(detalleDevolucion)}
                </p>
              </div>

              <button
                type="button"
                onClick={cerrarDetalleDevolucion}
                className="text-muted text-2xl hover:text-blue-500"
                aria-label="Cerrar detalle"
              >
                ×
              </button>
            </div>

            <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <div className="info-tile">
                <p className="mobile-card-subtitle">Cliente</p>
                <p className="text-main font-semibold">
                  {getClienteSolicitante(detalleDevolucion)?.razonSocial || "-"}
                </p>
                <p className="mobile-card-subtitle">
                  {getClienteSolicitante(detalleDevolucion)?.numeroDocumento ||
                    ""}
                </p>
              </div>

              <div className="info-tile">
                <p className="mobile-card-subtitle">Fecha de viaje</p>
                <p className="text-main font-semibold">
                  {formatearFecha(getFechaProgramada(detalleDevolucion))}
                </p>
              </div>

              <div className="info-tile">
                <p className="mobile-card-subtitle">Contenedor</p>
                <p className="text-main font-semibold">
                  {getValue(detalleDevolucion, "numeroContenedor", "-")}
                </p>
              </div>

              <div className="info-tile">
                <p className="mobile-card-subtitle">Vencimiento</p>
                <p className="text-main font-semibold">
                  {formatearFecha(
                    getValue(
                      detalleDevolucion,
                      "fechaVencimientoDevolucion",
                      null
                    )
                  )}
                </p>
              </div>

              <div className="info-tile">
                <p className="mobile-card-subtitle">Almacén devolución</p>
                <p className="text-main font-semibold">
                  {getValue(detalleDevolucion, "almacenDevolucion", "-")}
                </p>
              </div>

              <div className="info-tile">
                <p className="mobile-card-subtitle">Estado</p>
                <EstadoDevolucionBadge
                  estado={getValue(
                    detalleDevolucion,
                    "estadoDevolucion",
                    "PENDIENTE"
                  )}
                />
              </div>

              <div className="info-tile">
                <p className="mobile-card-subtitle">Programada</p>
                <p className="text-main font-semibold">
                  {formatearFecha(
                    getValue(
                      detalleDevolucion,
                      "fechaProgramadaDevolucion",
                      null
                    )
                  )}
                </p>
                <p className="mobile-card-subtitle">
                  {getValue(detalleDevolucion, "horaProgramadaDevolucion", "") ||
                    ""}
                </p>
              </div>

              <div className="info-tile">
                <p className="mobile-card-subtitle">Devuelto</p>
                <p className="text-main font-semibold">
                  {formatearFecha(
                    getValue(detalleDevolucion, "fechaDevolucion", null)
                  )}
                </p>
              </div>

              <div className="info-tile">
                <p className="mobile-card-subtitle">Conductor / unidad</p>
                <p className="text-main font-semibold">
                  {getNombreConductor(
                    getValue(detalleDevolucion, "conductorDevolucion", null)
                  )}
                </p>
                <p className="mobile-card-subtitle">
                  {getPlacaUnidad(
                    getValue(detalleDevolucion, "tractoDevolucion", null)
                  ) || ""}
                </p>
              </div>

              <div className="info-tile sm:col-span-2 lg:col-span-3">
                <p className="mobile-card-subtitle">Ruta</p>
                <p className="text-main mt-1">
                  {getValue(detalleDevolucion, "partida", null)?.direccion ||
                    "-"}
                </p>
                <p className="text-faint mt-1 text-xs">
                  →{" "}
                  {getValue(detalleDevolucion, "llegada", null)?.direccion ||
                    "-"}
                </p>
              </div>

              <div className="info-tile sm:col-span-2 lg:col-span-3">
                <p className="mobile-card-subtitle">Observación</p>
                <p className="text-main mt-1 whitespace-pre-wrap">
                  {getValue(detalleDevolucion, "observacionDevolucion", "") ||
                    "-"}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={cerrarDetalleDevolucion}
                className="btn-secondary px-3 py-1.5"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => {
                  const orden = detalleDevolucion;
                  cerrarDetalleDevolucion();
                  abrirModalDevolucion(orden, "edit");
                }}
                className="btn-secondary px-3 py-1.5"
              >
                Editar datos
              </button>
              <button
                type="button"
                onClick={() => {
                  const orden = detalleDevolucion;
                  cerrarDetalleDevolucion();
                  if (estaProgramada(orden)) {
                    abrirMarcarDevuelto(orden);
                    return;
                  }
                  abrirModalDevolucion(orden, "schedule");
                }}
                className={
                  estaProgramada(detalleDevolucion)
                    ? "btn-success px-3 py-1.5"
                    : "btn-primary px-3 py-1.5"
                }
              >
                {estaProgramada(detalleDevolucion)
                  ? "Marcar devuelto"
                  : "Programar devolución"}
              </button>
            </div>
          </div>
        </div>
      )}

      {ordenSeleccionada && (
        <div className="modal-backdrop">
          <div className="modal-panel max-w-lg">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-main text-xl font-bold">
                  {modalMode === "edit"
                    ? "Editar datos de devolución"
                    : modalMode === "schedule"
                    ? "Programar devolución"
                    : "Marcar como devuelto"}
                </h2>
                <p className="text-muted text-sm">
                  {getOrdenViaje(ordenSeleccionada)} ·{" "}
                  {getClienteSolicitante(ordenSeleccionada)?.razonSocial ||
                    "Cliente"}
                </p>
              </div>

              <button
                type="button"
                onClick={cerrarModalDevolucion}
                className="text-muted text-2xl hover:text-blue-500"
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>

            <div className="mb-5 grid gap-3 text-sm sm:grid-cols-2">
              <div className="info-tile">
                <p className="mobile-card-subtitle">Cliente</p>
                <p className="text-main font-semibold">
                  {getClienteSolicitante(ordenSeleccionada)?.razonSocial || "-"}
                </p>
              </div>
              <div className="info-tile">
                <p className="mobile-card-subtitle">Programación de viaje</p>
                <p className="text-main font-semibold">
                  {getOrdenViaje(ordenSeleccionada)}
                </p>
                <p className="mobile-card-subtitle">
                  Orden: {getNumeroOrdenServicio(ordenSeleccionada)}
                </p>
              </div>
            </div>

            {modalMode === "edit" ? (
              <div className="grid gap-4">
                <div>
                  <label className="text-muted mb-1 block text-sm">
                    Número de contenedor
                  </label>
                  <input
                    type="text"
                    value={formDevolucion.numeroContenedor}
                    onChange={(event) =>
                      setFormDevolucion((prev) => ({
                        ...prev,
                        numeroContenedor: event.target.value,
                      }))
                    }
                    placeholder="Ingrese el número de contenedor"
                    className="input p-3"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-muted mb-1 block text-sm">
                      Fecha de vencimiento
                    </label>
                    <input
                      type="date"
                      value={formDevolucion.fechaVencimientoDevolucion}
                      onChange={(event) =>
                        setFormDevolucion((prev) => ({
                          ...prev,
                          fechaVencimientoDevolucion: event.target.value,
                        }))
                      }
                      className="input p-3"
                    />
                  </div>

                  <div>
                    <label className="text-muted mb-1 block text-sm">
                      Almacén de devolución
                    </label>
                    <input
                      type="text"
                      value={formDevolucion.almacenDevolucion}
                      onChange={(event) =>
                        setFormDevolucion((prev) => ({
                          ...prev,
                          almacenDevolucion: event.target.value,
                        }))
                      }
                      placeholder="Ingrese el almacén de devolución"
                      className="input p-3"
                    />
                  </div>
                </div>
              </div>
            ) : modalMode === "schedule" ? (
              <div className="grid gap-4">
                <div className="grid gap-3 text-sm sm:grid-cols-3">
                  <div className="info-tile">
                    <p className="mobile-card-subtitle">Contenedor</p>
                    <p className="text-main font-semibold">
                      {formDevolucion.numeroContenedor || "-"}
                    </p>
                  </div>
                  <div className="info-tile">
                    <p className="mobile-card-subtitle">Vencimiento</p>
                    <p className="text-main font-semibold">
                      {formatearFecha(formDevolucion.fechaVencimientoDevolucion)}
                    </p>
                  </div>
                  <div className="info-tile">
                    <p className="mobile-card-subtitle">Almacén</p>
                    <p className="text-main font-semibold">
                      {formDevolucion.almacenDevolucion || "-"}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-muted mb-1 block text-sm">
                      Fecha programada
                    </label>
                    <input
                      type="date"
                      value={formDevolucion.fechaProgramadaDevolucion}
                      onChange={(event) =>
                        setFormDevolucion((prev) => ({
                          ...prev,
                          fechaProgramadaDevolucion: event.target.value,
                        }))
                      }
                      className="input p-3"
                    />
                  </div>

                  <div>
                    <label className="text-muted mb-1 block text-sm">
                      Hora programada
                    </label>
                    <input
                      type="time"
                      value={formDevolucion.horaProgramadaDevolucion}
                      onChange={(event) =>
                        setFormDevolucion((prev) => ({
                          ...prev,
                          horaProgramadaDevolucion: event.target.value,
                        }))
                      }
                      className="input p-3"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-muted mb-1 block text-sm">
                    Conductor asignado
                  </label>
                  <ConductoresSelect />
                </div>

                <div>
                  <label className="text-muted mb-1 block text-sm">
                    Unidad asignada
                  </label>
                  <TractosSelect />
                </div>

                <div>
                  <label className="text-muted mb-1 block text-sm">
                    Observación
                  </label>
                  <textarea
                    value={formDevolucion.observacionDevolucion}
                    onChange={(event) =>
                      setFormDevolucion((prev) => ({
                        ...prev,
                        observacionDevolucion: event.target.value,
                      }))
                    }
                    className="input min-h-[90px] p-3"
                    placeholder="Observación de programación"
                  />
                </div>
              </div>
            ) : (
              <div className="grid gap-4">
                <div className="grid gap-3 text-sm sm:grid-cols-3">
                  <div className="info-tile">
                    <p className="mobile-card-subtitle">Contenedor</p>
                    <p className="text-main font-semibold">
                      {formDevolucion.numeroContenedor || "-"}
                    </p>
                  </div>
                  <div className="info-tile">
                    <p className="mobile-card-subtitle">Vencimiento</p>
                    <p className="text-main font-semibold">
                      {formatearFecha(formDevolucion.fechaVencimientoDevolucion)}
                    </p>
                  </div>
                  <div className="info-tile">
                    <p className="mobile-card-subtitle">Almacén</p>
                    <p className="text-main font-semibold">
                      {formDevolucion.almacenDevolucion || "-"}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-muted mb-1 block text-sm">
                      Fecha real de devolución
                    </label>
                    <input
                      type="date"
                      value={formDevolucion.fechaDevolucion}
                      onChange={(event) =>
                        setFormDevolucion((prev) => ({
                          ...prev,
                          fechaDevolucion: event.target.value,
                        }))
                      }
                      className="input p-3"
                    />
                  </div>

                  <div className="info-tile">
                    <p className="mobile-card-subtitle">Hora programada</p>
                    <p className="text-main font-semibold">
                      {formDevolucion.horaProgramadaDevolucion || "-"}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-muted mb-1 block text-sm">
                    Conductor asignado
                  </label>
                  <ConductoresSelect />
                </div>

                <div>
                  <label className="text-muted mb-1 block text-sm">
                    Unidad asignada
                  </label>
                  <TractosSelect />
                  {tractos.length === 0 && (
                    <p className="text-faint mt-1 text-xs">
                      No hay tractos activos registrados.
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-muted mb-1 block text-sm">
                    Observación final
                  </label>
                  <textarea
                    value={formDevolucion.observacionDevolucion}
                    onChange={(event) =>
                      setFormDevolucion((prev) => ({
                        ...prev,
                        observacionDevolucion: event.target.value,
                      }))
                    }
                    className="input min-h-[90px] p-3"
                    placeholder="Observación de devolución"
                  />
                </div>
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={cerrarModalDevolucion}
                className="btn-secondary px-3 py-1.5"
              >
                Cancelar
              </button>
              {modalMode === "edit" ? (
                <button
                  type="button"
                  onClick={guardarDatosDevolucion}
                  disabled={actualizando[getItemId(ordenSeleccionada)]}
                  className="btn-primary px-3 py-1.5"
                >
                  {actualizando[getItemId(ordenSeleccionada)]
                    ? "Guardando..."
                    : "Guardar datos"}
                </button>
              ) : modalMode === "schedule" ? (
                <button
                  type="button"
                  onClick={programarDevolucion}
                  disabled={actualizando[getItemId(ordenSeleccionada)]}
                  className="btn-primary px-3 py-1.5"
                >
                  {actualizando[getItemId(ordenSeleccionada)]
                    ? "Programando..."
                    : "Programar devolución"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={marcarDevuelto}
                  disabled={actualizando[getItemId(ordenSeleccionada)]}
                  className="btn-success px-3 py-1.5"
                >
                  {actualizando[getItemId(ordenSeleccionada)]
                    ? "Actualizando..."
                    : "Marcar devuelto"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DevolucionesPage;
