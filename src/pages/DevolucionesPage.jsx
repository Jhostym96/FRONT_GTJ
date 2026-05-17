import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useOrdenesServicio } from "../context/OrdenServicioContext";
import { useConductores } from "../context/ConductorContext";
import { getTodayInputDate } from "../utils/date";

const getItemId = (item) => item?.id ?? item?._id;

function DevolucionesPage() {
  const {
    devolucionesPendientes = [],
    loading,
    cargarDevolucionesPendientes,
    actualizarEstadoDevolucion,
  } = useOrdenesServicio();
  const { conductores = [], obtenerConductores, getConductores } = useConductores();

  const [actualizando, setActualizando] = useState({});
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);
  const [modalMode, setModalMode] = useState("edit");
  const [formDevolucion, setFormDevolucion] = useState({
    numeroContenedor: "",
    fechaVencimientoDevolucion: "",
    almacenDevolucion: "",
    fechaDevolucion: getTodayInputDate(),
    conductorDevolucionId: "",
  });

  useEffect(() => {
    cargarDevolucionesPendientes();
    if (obtenerConductores) {
      obtenerConductores();
    } else {
      getConductores?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = useMemo(
    () => devolucionesPendientes?.length || 0,
    [devolucionesPendientes]
  );

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
      numeroContenedor: orden.numeroContenedor || "",
      fechaVencimientoDevolucion: orden.fechaVencimientoDevolucion
        ? orden.fechaVencimientoDevolucion.slice(0, 10)
        : "",
      almacenDevolucion: orden.almacenDevolucion || "",
      fechaDevolucion: getTodayInputDate(),
      conductorDevolucionId: "",
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
    });
  };

  const tieneDatosDevolucion = (orden) => {
    return Boolean(
      orden?.numeroContenedor &&
        orden?.fechaVencimientoDevolucion &&
        orden?.almacenDevolucion
    );
  };

  const abrirMarcarDevuelto = (orden) => {
    if (!tieneDatosDevolucion(orden)) {
      toast.error("Primero completa los datos de devolución");
      abrirModalDevolucion(orden, "edit");
      return;
    }

    abrirModalDevolucion(orden, "return");
  };

  const validarDatosContenedor = () => {
    if (!formDevolucion.numeroContenedor.trim()) {
      toast.error("Ingresa el número de contenedor");
      return false;
    }

    if (!formDevolucion.fechaVencimientoDevolucion) {
      toast.error("Selecciona la fecha de vencimiento");
      return false;
    }

    if (!formDevolucion.almacenDevolucion.trim()) {
      toast.error("Ingresa el almacén de devolución");
      return false;
    }

    return true;
  };

  const guardarDatosDevolucion = async () => {
    const orden = ordenSeleccionada;
    const id = getItemId(orden);
    if (!id) return;

    if (!validarDatosContenedor()) return;

    try {
      setActualizando((prev) => ({ ...prev, [id]: true }));
      await actualizarEstadoDevolucion(id, {
        estadoDevolucion: "PENDIENTE",
        numeroContenedor: formDevolucion.numeroContenedor,
        fechaVencimientoDevolucion: formDevolucion.fechaVencimientoDevolucion,
        almacenDevolucion: formDevolucion.almacenDevolucion,
      });
      toast.success("Datos de devolución guardados");
      cerrarModalDevolucion();
    } catch (error) {
      toast.error(
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
      toast.error("Selecciona la fecha de devolución");
      return;
    }

    if (!formDevolucion.conductorDevolucionId) {
      toast.error("Selecciona el conductor que devuelve");
      return;
    }

    try {
      setActualizando((prev) => ({ ...prev, [id]: true }));
      await actualizarEstadoDevolucion(id, {
        estadoDevolucion: "DEVUELTO",
        numeroContenedor: formDevolucion.numeroContenedor,
        fechaVencimientoDevolucion: formDevolucion.fechaVencimientoDevolucion,
        almacenDevolucion: formDevolucion.almacenDevolucion,
        fechaDevolucion: formDevolucion.fechaDevolucion,
        conductorDevolucionId: Number(formDevolucion.conductorDevolucionId),
      });
      toast.success("Devolución marcada como devuelta");
      cerrarModalDevolucion();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "No se pudo actualizar la devolución"
      );
    } finally {
      setActualizando((prev) => ({ ...prev, [id]: false }));
    }
  };

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
        <option key={conductor.id} value={conductor.id}>
          {conductor.nombres} {conductor.apellidos}
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

            <div className="info-tile border px-4 py-3">
              <p className="text-faint text-xs">Pendientes</p>
              <p className="text-main text-xl font-bold">{total}</p>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="panel p-8 text-center">
            <div className="mx-auto mb-3 h-9 w-9 animate-spin rounded-full border-2 border-[var(--app-border)] border-t-blue-500" />
            <p className="text-muted text-sm">Cargando devoluciones...</p>
          </div>
        ) : total === 0 ? (
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
                  orden.fechaVencimientoDevolucion
                );

                return (
                  <article key={id} className="mobile-card">
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-faint text-xs font-medium">
                          Orden
                        </p>
                        <h2 className="text-main text-lg font-bold">
                          {orden.numeroOrden || "-"}
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
                          {formatearFecha(orden.fechaProgramada)}
                        </p>
                      </div>

                      <div className="info-tile">
                        <p className="text-faint text-xs">Cliente</p>
                        <p className="text-main font-semibold">
                          {orden.clienteSolicitante?.razonSocial || "-"}
                        </p>
                        <p className="text-faint text-xs">
                          {orden.clienteSolicitante?.numeroDocumento || ""}
                        </p>
                      </div>

                      <div className="info-tile">
                        <p className="text-faint text-xs">Contenedor</p>
                        <p className="text-main font-semibold">
                          {orden.numeroContenedor || "-"}
                        </p>
                      </div>

                      <div className="info-tile">
                        <p className="text-faint text-xs">Vencimiento</p>
                        <p className="text-main font-semibold">
                          {formatearFecha(orden.fechaVencimientoDevolucion)}
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
                          {orden.almacenDevolucion || "-"}
                        </p>
                      </div>

                      <div className="info-tile">
                        <p className="text-faint text-xs">Ruta</p>
                        <p className="text-muted mt-1">
                          {orden.partida?.direccion || "-"}
                        </p>
                        <p className="text-faint mt-1 text-xs">
                          → {orden.llegada?.direccion || "-"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 border-t pt-4">
                      <div className="grid gap-2 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => abrirModalDevolucion(orden, "edit")}
                          disabled={actualizando[id]}
                          className="btn-secondary w-full px-4 py-2"
                        >
                          Editar datos
                        </button>
                        <button
                          type="button"
                          onClick={() => abrirMarcarDevuelto(orden)}
                          disabled={actualizando[id]}
                          className="btn-success w-full px-4 py-2"
                        >
                          {actualizando[id]
                            ? "Actualizando..."
                            : "Marcar devuelto"}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="data-table-wrap">
              <div className="overflow-x-auto">
                <table className="data-table w-full min-w-[1000px] text-sm">
                  <thead>
                    <tr>
                      <th className="px-4 py-4 text-left">Orden</th>
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
                        orden.fechaVencimientoDevolucion
                      );

                      return (
                        <tr key={id}>
                          <td className="px-4 py-4">
                            <p className="text-main font-bold">
                              {orden.numeroOrden || "-"}
                            </p>
                          </td>
                          <td className="text-muted whitespace-nowrap px-4 py-4">
                            {formatearFecha(orden.fechaProgramada)}
                          </td>
                          <td className="text-main whitespace-nowrap px-4 py-4 font-semibold">
                            {orden.numeroContenedor || "-"}
                          </td>
                          <td className="text-muted whitespace-nowrap px-4 py-4">
                            {formatearFecha(orden.fechaVencimientoDevolucion)}
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
                            {orden.almacenDevolucion || "-"}
                          </td>
                          <td className="min-w-[220px] px-4 py-4">
                            <p className="text-main max-w-[260px] truncate font-semibold">
                              {orden.clienteSolicitante?.razonSocial || "-"}
                            </p>
                            <p className="text-faint text-xs">
                              {orden.clienteSolicitante?.numeroDocumento || ""}
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
                                className="btn-secondary px-3 py-2 text-xs"
                              >
                                Editar datos
                              </button>
                              <button
                                type="button"
                                onClick={() => abrirMarcarDevuelto(orden)}
                                disabled={actualizando[id]}
                                className="btn-success px-3 py-2 text-xs"
                              >
                                {actualizando[id] ? "Actualizando..." : "Marcar devuelto"}
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
          </>
        )}
      </div>

      {ordenSeleccionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm">
          <div className="panel w-full max-w-lg p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-main text-xl font-bold">
                  {modalMode === "edit"
                    ? "Editar datos de devolución"
                    : "Marcar como devuelto"}
                </h2>
                <p className="text-muted text-sm">
                  {ordenSeleccionada.numeroOrden} ·{" "}
                  {ordenSeleccionada.clienteSolicitante?.razonSocial || "Cliente"}
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
                  {ordenSeleccionada.clienteSolicitante?.razonSocial || "-"}
                </p>
              </div>
              <div className="info-tile">
                <p className="text-faint text-xs">Orden</p>
                <p className="text-main font-semibold">
                  {ordenSeleccionada.numeroOrden || "-"}
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
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={cerrarModalDevolucion}
                className="btn-secondary px-4 py-2"
              >
                Cancelar
              </button>
              {modalMode === "edit" ? (
                <button
                  type="button"
                  onClick={guardarDatosDevolucion}
                  disabled={actualizando[getItemId(ordenSeleccionada)]}
                  className="btn-primary px-4 py-2"
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
                  className="btn-success px-4 py-2"
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
