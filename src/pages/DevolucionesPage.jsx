import { useEffect, useState } from "react";
import { notify } from "../utils/notify";
import { CheckCircle2, LoaderCircle, Pencil } from "lucide-react";
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

  if (!id) return "-";

  return `VIAJE-${String(id).padStart(6, "0")}`;
};

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
    fechaDevolucion: getTodayInputDate(),
    conductorDevolucionId: "",
    tractoDevolucionId: "",
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
      fechaDevolucion: getTodayInputDate(),
      conductorDevolucionId: "",
      tractoDevolucionId: "",
    });
  };

  const cerrarModalDevolucion = () => {
    setOrdenSeleccionada(null);
    setModalMode("edit");
    setFormDevolucion({
      numeroContenedor: "",
      fechaVencimientoDevolucion: "",
      almacenDevolucion: "",
      fechaDevolucion: getTodayInputDate(),
      conductorDevolucionId: "",
      tractoDevolucionId: "",
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

  const marcarDevuelto = async () => {
    const orden = ordenSeleccionada;
    const id = getItemId(orden);
    if (!id) return;

    if (!validarDatosContenedor()) return;

    if (!formDevolucion.fechaDevolucion) {
      notify.error("Selecciona la fecha de devolución");
      return;
    }

    if (!formDevolucion.conductorDevolucionId) {
      notify.error("Selecciona el conductor que devuelve");
      return;
    }

    if (!formDevolucion.tractoDevolucionId) {
      notify.error("Selecciona la placa de devolución");
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
        fechaDevolucion: formDevolucion.fechaDevolucion,
        conductorDevolucionId: Number(formDevolucion.conductorDevolucionId),
        tractoDevolucionId: Number(formDevolucion.tractoDevolucionId),
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
    <div className="w-full py-4">
      <div className="page-wrap">
        <header className="page-hero">
          <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
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
          <div className="panel p-8 text-center">
            <div className="mx-auto mb-3 h-9 w-9 animate-spin rounded-full border-2 border-[var(--app-border)] border-t-blue-500" />
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
            <div className="grid gap-4 lg:hidden">
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
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-faint text-xs font-medium">
                          Orden de viaje
                        </p>
                        <h2 className="text-main text-lg font-bold">
                          {getOrdenViaje(orden)}
                        </h2>
                      </div>

                      <span className="inline-flex rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-bold tracking-wide text-amber-400">
                        PENDIENTE
                      </span>
                    </div>

                    <div className="grid gap-3 text-sm">
                      <div className="info-tile">
                        <p className="text-faint text-xs">Fecha programada</p>
                        <p className="text-main font-semibold">
                          {formatearFecha(getFechaProgramada(orden))}
                        </p>
                      </div>

                      <div className="info-tile">
                        <p className="text-faint text-xs">Cliente</p>
                        <p className="text-main font-semibold">
                          {cliente?.razonSocial || "-"}
                        </p>
                        <p className="text-faint text-xs">
                          {cliente?.numeroDocumento || ""}
                        </p>
                      </div>

                      <div className="info-tile">
                        <p className="text-faint text-xs">Contenedor</p>
                        <p className="text-main font-semibold">
                          {getValue(orden, "numeroContenedor", "-")}
                        </p>
                      </div>

                      <div className="info-tile">
                        <p className="text-faint text-xs">Vencimiento</p>
                        <p className="text-main font-semibold">
                          {formatearFecha(
                            getValue(orden, "fechaVencimientoDevolucion", null)
                          )}
                        </p>
                      </div>

                      <div className="info-tile">
                        <p className="text-faint text-xs">Días libres</p>
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
                        <p className="text-faint text-xs">Almacén devolución</p>
                        <p className="text-main font-semibold">
                          {getValue(orden, "almacenDevolucion", "-")}
                        </p>
                      </div>

                      <div className="info-tile">
                        <p className="text-faint text-xs">Ruta</p>
                        <p className="text-muted mt-1">
                          {partida?.direccion || "-"}
                        </p>
                        <p className="text-faint mt-1 text-xs">
                          → {llegada?.direccion || "-"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 border-t pt-4">
                      <div className="grid gap-2 sm:grid-cols-2">
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
                <table className="data-table w-full min-w-[1000px] text-sm">
                  <thead>
                    <tr>
                      <th className="px-4 py-4 text-left">Orden de viaje</th>
                      <th className="px-4 py-4 text-left">Fecha</th>
                      <th className="px-4 py-4 text-left">Contenedor</th>
                      <th className="px-4 py-4 text-left">Vencimiento</th>
                      <th className="px-4 py-4 text-left">Días libres</th>
                      <th className="px-4 py-4 text-left">Almacén</th>
                      <th className="px-4 py-4 text-left">Cliente</th>
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
                          </td>
                          <td className="text-muted whitespace-nowrap px-4 py-4">
                            {formatearFecha(getFechaProgramada(orden))}
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
                          <td className="min-w-[220px] px-4 py-4">
                            <p className="text-main max-w-[260px] truncate font-semibold">
                              {cliente?.razonSocial || "-"}
                            </p>
                            <p className="text-faint text-xs">
                              {cliente?.numeroDocumento || ""}
                            </p>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className="inline-flex rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-bold tracking-wide text-amber-400">
                              PENDIENTE
                            </span>
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
                <p className="text-faint text-xs">Cliente</p>
                <p className="text-main font-semibold">
                  {getClienteSolicitante(ordenSeleccionada)?.razonSocial || "-"}
                </p>
              </div>
              <div className="info-tile">
                <p className="text-faint text-xs">Orden de viaje</p>
                <p className="text-main font-semibold">
                  {getOrdenViaje(ordenSeleccionada)}
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
            ) : (
              <div className="grid gap-4">
                <div className="grid gap-3 text-sm sm:grid-cols-3">
                  <div className="info-tile">
                    <p className="text-faint text-xs">Contenedor</p>
                    <p className="text-main font-semibold">
                      {formDevolucion.numeroContenedor || "-"}
                    </p>
                  </div>
                  <div className="info-tile">
                    <p className="text-faint text-xs">Vencimiento</p>
                    <p className="text-main font-semibold">
                      {formatearFecha(formDevolucion.fechaVencimientoDevolucion)}
                    </p>
                  </div>
                  <div className="info-tile">
                    <p className="text-faint text-xs">Almacén</p>
                    <p className="text-main font-semibold">
                      {formDevolucion.almacenDevolucion || "-"}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-muted mb-1 block text-sm">
                    Fecha de devolución
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
                    Conductor que devuelve
                  </label>
                  <ConductoresSelect />
                </div>

                <div>
                  <label className="text-muted mb-1 block text-sm">
                    Placa de devolución (tracto)
                  </label>
                  <TractosSelect />
                  {tractos.length === 0 && (
                    <p className="text-faint mt-1 text-xs">
                      No hay tractos activos registrados.
                    </p>
                  )}
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
