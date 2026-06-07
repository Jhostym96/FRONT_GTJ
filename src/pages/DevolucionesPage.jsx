import { useEffect, useState } from "react";
import { notify } from "../utils/notify";
import { CalendarClock, CheckCircle2, LoaderCircle, Pencil } from "lucide-react";
import { useOrdenesServicio } from "../context/OrdenServicioContext";
import { useConductores } from "../context/ConductorContext";
import { useUnidades } from "../context/UnidadContext";
import TablePagination from "../components/TablePagination";
import { getTodayInputDate } from "../utils/date";

const getItemId = (item) =>
  item?.devolucionContenedorId ?? item?.id ?? item?._id;

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

function DevolucionesPage() {
  const {
    devolucionesPendientes = [],
    loading,
    paginationDevoluciones,
    cargarDevolucionesPendientes,
    actualizarEstadoDevolucion,
  } = useOrdenesServicio();
  const { conductores = [], obtenerConductores, getConductores } = useConductores();
  const { unidades = [], obtenerUnidades } = useUnidades();

  const [actualizando, setActualizando] = useState({});
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);
  const [modalMode, setModalMode] = useState("edit");
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
    cargarDevolucionesPendientes({ page: 1, limit: 10 });
    if (obtenerConductores) {
      obtenerConductores();
    } else {
      getConductores?.();
    }
    obtenerUnidades?.({ page: 1, limit: 100 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recargarDevoluciones = (page = paginationDevoluciones.page) =>
    cargarDevolucionesPendientes({
      page,
      limit: paginationDevoluciones.limit,
    });

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
      fechaProgramadaDevolucion: getValue(orden, "fechaProgramadaDevolucion", "")
        ? getValue(orden, "fechaProgramadaDevolucion", "").slice(0, 10)
        : "",
      horaProgramadaDevolucion: getValue(orden, "horaProgramadaDevolucion", ""),
      fechaDevolucion: getValue(orden, "fechaDevolucion", "")
        ? getValue(orden, "fechaDevolucion", "").slice(0, 10)
        : getTodayInputDate(),
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
      await actualizarEstadoDevolucion(id, {
        ...getAccionPayload(orden),
        estadoDevolucion: "PENDIENTE",
        numeroContenedor: formDevolucion.numeroContenedor,
        fechaVencimientoDevolucion: formDevolucion.fechaVencimientoDevolucion,
        almacenDevolucion: formDevolucion.almacenDevolucion,
        observacionDevolucion: formDevolucion.observacionDevolucion,
      });
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
      await actualizarEstadoDevolucion(id, {
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
      });
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

    if (!formDevolucion.horaDevolucion) {
      notify.error("Selecciona la hora de devolución");
      return;
    }

    try {
      setActualizando((prev) => ({ ...prev, [id]: true }));
      await actualizarEstadoDevolucion(id, {
        ...getAccionPayload(orden),
        estadoDevolucion: "DEVUELTO",
        numeroContenedor: formDevolucion.numeroContenedor,
        fechaVencimientoDevolucion: formDevolucion.fechaVencimientoDevolucion,
        almacenDevolucion: formDevolucion.almacenDevolucion,
        fechaProgramadaDevolucion: formDevolucion.fechaProgramadaDevolucion,
        horaProgramadaDevolucion: formDevolucion.horaProgramadaDevolucion,
        fechaDevolucion: formDevolucion.fechaDevolucion,
        horaDevolucion: formDevolucion.horaDevolucion,
        conductorDevolucionId: Number(formDevolucion.conductorDevolucionId),
        tractoDevolucionId: Number(formDevolucion.tractoDevolucionId),
        observacionDevolucion: formDevolucion.observacionDevolucion,
      });
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

  return (
    <div className="page">
      <div className="page-wrap">
        <header className="page-hero">
          <div className="page-hero-content">
            <div>
              <div className="eyebrow">Control operativo</div>
              <h1 className="page-title">Devoluciones</h1>
              <p className="page-description">
                Órdenes de servicio con carga tipo contenedor pendientes de devolución.
              </p>
            </div>

          </div>
        </header>

        {loading ? (
          <div className="loading-panel">
            <div className="loading-spinner" />
            <p className="text-muted text-sm">Cargando devoluciones...</p>
          </div>
        ) : devolucionesPendientes.length === 0 ? (
          <div className="empty-panel">
            <h2 className="text-main text-lg font-semibold">
              No hay devoluciones pendientes
            </h2>
            <p className="text-muted mt-1 text-sm">
              Las órdenes tipo contenedor pendientes aparecerán aquí.
            </p>
          </div>
        ) : (
          <>
            <div className="mobile-list">
              {devolucionesPendientes.map((orden) => {
                const id = getItemId(orden);
                const diasLibres = calcularDiasLibres(
                  getValue(orden, "fechaVencimientoDevolucion", null)
                );
                const cliente = getClienteSolicitante(orden);
                const partida = getValue(orden, "partida", null);
                const llegada = getValue(orden, "llegada", null);

                return (
                  <article
                    key={`${id}-${orden.programacionViajeId || ""}`}
                    className="mobile-card"
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

                    <div className="mobile-detail-grid">
                      <div className="info-tile">
                        <p className="mobile-card-subtitle">Fecha programada</p>
                        <p className="text-main font-semibold">
                          {formatearFecha(getFechaProgramada(orden))}
                        </p>
                      </div>

                      <div className="info-tile">
                        <p className="mobile-card-subtitle">Cliente</p>
                        <p className="text-main font-semibold">
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
                        <p className="text-main font-semibold">
                          {formatearFecha(
                            getValue(orden, "fechaVencimientoDevolucion", null)
                          )}
                        </p>
                      </div>

                      <div className="info-tile">
                        <p className="mobile-card-subtitle">Días libres</p>
                        <p
                          className={`font-semibold ${
                            diasLibres !== null && diasLibres < 0
                              ? "text-red-400"
                              : "text-main"
                          }`}
                        >
                          {diasLibres === null
                            ? "-"
                            : diasLibres < 0
                            ? `${Math.abs(diasLibres)} día(s) vencido`
                            : `${diasLibres} día(s)`}
                        </p>
                      </div>

                      <div className="info-tile">
                        <p className="mobile-card-subtitle">Almacén devolución</p>
                        <p className="text-main font-semibold">
                          {getValue(orden, "almacenDevolucion", "-")}
                        </p>
                      </div>

                      <div className="info-tile">
                        <p className="mobile-card-subtitle">Programada</p>
                        <p className="text-main font-semibold">
                          {formatearFecha(
                            getValue(orden, "fechaProgramadaDevolucion", null)
                          )}
                          {getValue(orden, "horaProgramadaDevolucion", "")
                            ? ` ${getValue(
                                orden,
                                "horaProgramadaDevolucion",
                                ""
                              )}`
                            : ""}
                        </p>
                      </div>

                      <div className="info-tile">
                        <p className="mobile-card-subtitle">Conductor asignado</p>
                        <p className="text-main font-semibold">
                          {getNombreConductor(
                            getValue(orden, "conductorDevolucion", null)
                          )}
                        </p>
                        <p className="mobile-card-subtitle">
                          {getPlacaUnidad(
                            getValue(orden, "tractoDevolucion", null)
                          ) || ""}
                        </p>
                      </div>

                      <div className="info-tile">
                        <p className="mobile-card-subtitle">Ruta</p>
                        <p className="text-muted mt-1">
                          {partida?.direccion || "-"}
                        </p>
                        <p className="text-faint mt-1 text-xs">
                          → {llegada?.direccion || "-"}
                        </p>
                      </div>
                    </div>

                    <div className="mobile-card-actions">
                      <div className="grid gap-2 sm:grid-cols-3">
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
                          title="Programar devolución"
                          aria-label="Programar devolución"
                        >
                          <CalendarClock />
                        </button>
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
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="data-table-wrap">
              <div className="table-scroll">
                <table className="data-table dense-table w-full min-w-[1300px] text-sm">
                  <thead>
                    <tr>
                      <th className="px-4 py-4 text-left">
                        Programación de viaje
                      </th>
                      <th className="px-4 py-4 text-left">Fecha</th>
                      <th className="px-4 py-4 text-left">Cliente</th>
                      <th className="px-4 py-4 text-left">Contenedor</th>
                      <th className="px-4 py-4 text-left">Vencimiento</th>
                      <th className="px-4 py-4 text-left">Días libres</th>
                      <th className="px-4 py-4 text-left">Almacén</th>
                      <th className="px-4 py-4 text-left">Programada</th>
                      <th className="px-4 py-4 text-left">Conductor</th>
                      <th className="px-4 py-4 text-center">Estado devolución</th>
                      <th className="px-4 py-4 text-right">Acción</th>
                    </tr>
                  </thead>

                  <tbody>
                    {devolucionesPendientes.map((orden) => {
                      const id = getItemId(orden);
                      const diasLibres = calcularDiasLibres(
                        getValue(orden, "fechaVencimientoDevolucion", null)
                      );
                      const cliente = getClienteSolicitante(orden);

                      return (
                        <tr key={`${id}-${orden.programacionViajeId || ""}`}>
                          <td className="px-4 py-4">
                            <p className="text-main font-bold">
                              {getOrdenViaje(orden)}
                            </p>
                            <p className="mobile-card-subtitle">
                              Orden: {getNumeroOrdenServicio(orden)}
                            </p>
                          </td>
                          <td className="text-muted whitespace-nowrap px-4 py-4">
                            {formatearFecha(getFechaProgramada(orden))}
                          </td>
                          <td className="min-w-[220px] px-4 py-4">
                            <p className="text-main max-w-[260px] truncate font-semibold">
                              {cliente?.razonSocial || "-"}
                            </p>
                            <p className="mobile-card-subtitle">
                              {cliente?.numeroDocumento || ""}
                            </p>
                          </td>
                          <td className="text-main whitespace-nowrap px-4 py-4 font-semibold">
                            {getValue(orden, "numeroContenedor", "-")}
                          </td>
                          <td className="text-muted whitespace-nowrap px-4 py-4">
                            {formatearFecha(
                              getValue(orden, "fechaVencimientoDevolucion", null)
                            )}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4">
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
                          <td className="text-muted min-w-[180px] px-4 py-4">
                            {getValue(orden, "almacenDevolucion", "-")}
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
                          <td className="min-w-[180px] px-4 py-4">
                            <p className="text-main font-semibold">
                              {getNombreConductor(
                                getValue(orden, "conductorDevolucion", null)
                              )}
                            </p>
                            <p className="mobile-card-subtitle">
                              {getPlacaUnidad(
                                getValue(orden, "tractoDevolucion", null)
                              ) || ""}
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
                          <td className="px-4 py-4">
                            <div className="flex justify-end gap-2">
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
                                title="Programar devolución"
                                aria-label="Programar devolución"
                              >
                                <CalendarClock />
                              </button>
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

                  <div>
                    <label className="text-muted mb-1 block text-sm">
                      Hora real
                    </label>
                    <input
                      type="time"
                      value={formDevolucion.horaDevolucion}
                      onChange={(event) =>
                        setFormDevolucion((prev) => ({
                          ...prev,
                          horaDevolucion: event.target.value,
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
