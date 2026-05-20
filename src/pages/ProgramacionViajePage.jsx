import { useEffect, useState } from "react";
import {
  Ban,
  CalendarClock,
  CheckCircle2,
  Eye,
  Flag,
  LoaderCircle,
  MapPin,
  Route,
  Warehouse,
} from "lucide-react";
import { notify } from "../utils/notify";
import { useProgramacionViaje } from "../context/ProgramacionViajeContext";
import { useUnidades } from "../context/UnidadContext";
import { useConductores } from "../context/ConductorContext";
import { useConfirm } from "../context/ConfirmContext";

import ProgramacionViajeModal from "../components/modals/ProgramacionViajeModal";
import TablePagination from "../components/TablePagination";

const formatearTipoCarga = (tipoCarga) =>
  tipoCarga ? tipoCarga.replace("_", " ") : "-";

const formatearDimensionCarga = (dimensionCarga) =>
  dimensionCarga ? `${dimensionCarga} pies` : "";

const getDateTimeLocalNow = () => {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60000;

  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 16);
};

const TRANSICIONES = {
  ASIGNADO: [{ estado: "EN_RUTA", label: "En ruta" }],
  EN_RUTA: [
    { estado: "EN_ALMACEN", label: "En almacén" },
    { estado: "EN_CLIENTE", label: "En cliente", requiereFecha: true },
  ],
  EN_ALMACEN: [
    { estado: "EN_CLIENTE", label: "En cliente", requiereFecha: true },
  ],
  EN_CLIENTE: [
    { estado: "ENTREGADO", label: "Entregado", requiereFecha: true },
  ],
  ENTREGADO: [{ estado: "FINALIZADO", label: "Finalizar" }],
};

const getAccionIcon = (estado) => {
  switch (estado) {
    case "EN_RUTA":
      return <Route />;
    case "EN_ALMACEN":
      return <Warehouse />;
    case "EN_CLIENTE":
      return <MapPin />;
    case "ENTREGADO":
      return <CheckCircle2 />;
    case "FINALIZADO":
      return <Flag />;
    default:
      return <CheckCircle2 />;
  }
};

const ProgramacionViajePage = () => {
  const {
    programaciones = [],
    paginationProgramaciones,
    getProgramacionesViaje,
    obtenerProgramacionesViaje,
    cambiarEstadoProgramacion,
  } = useProgramacionViaje();

  const { obtenerUnidades } = useUnidades();
  const { obtenerConductores, getConductores } = useConductores();
  const confirm = useConfirm();

  const [openModal, setOpenModal] = useState(false);
  const [viajeSeleccionado, setViajeSeleccionado] = useState(null);
  const [modalMode, setModalMode] = useState("create");
  const [cambiandoEstado, setCambiandoEstado] = useState({});
  const [estadoConFecha, setEstadoConFecha] = useState(null);
  const [fechaHoraOperacion, setFechaHoraOperacion] = useState(
    getDateTimeLocalNow()
  );

  const getId = (item) => item?.id ?? item?._id ?? "";

  useEffect(() => {
    const cargarDatos = async () => {
      if (getProgramacionesViaje) {
        await getProgramacionesViaje({ page: 1, limit: 10 });
      } else if (obtenerProgramacionesViaje) {
        await obtenerProgramacionesViaje();
      }

      await obtenerUnidades?.();

      if (obtenerConductores) {
        await obtenerConductores();
      } else if (getConductores) {
        await getConductores();
      }
    };

    cargarDatos();
  }, [
    getConductores,
    getProgramacionesViaje,
    obtenerConductores,
    obtenerProgramacionesViaje,
    obtenerUnidades,
  ]);

  const formatearFecha = (fecha) => {
    if (!fecha) return "-";

    const fechaObj = new Date(fecha);

    if (Number.isNaN(fechaObj.getTime())) return "-";

    return fechaObj.toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatearFechaHora = (fecha) => {
    if (!fecha) return "-";

    const fechaObj = new Date(fecha);

    if (Number.isNaN(fechaObj.getTime())) return "-";

    return fechaObj.toLocaleString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatearStandby = (minutos) => {
    if (minutos === null || minutos === undefined) return "-";

    return `${minutos} min (${(minutos / 60).toFixed(2)} h)`;
  };

  const getEstadoStyle = (estado) => {
    switch (estado) {
      case "PENDIENTE":
        return "bg-yellow-500/10 text-yellow-300 border-yellow-500/30";

      case "ASIGNADO":
        return "bg-blue-500/10 text-blue-300 border-blue-500/30";

      case "EN_RUTA":
        return "bg-purple-500/10 text-purple-300 border-purple-500/30";

      case "EN_ALMACEN":
        return "bg-cyan-500/10 text-cyan-300 border-cyan-500/30";

      case "EN_CLIENTE":
        return "bg-orange-500/10 text-orange-300 border-orange-500/30";

      case "ENTREGADO":
        return "bg-emerald-500/10 text-emerald-300 border-emerald-500/30";

      case "FINALIZADO":
        return "bg-green-500/10 text-green-300 border-green-500/30";

      case "ANULADO":
        return "bg-red-500/10 text-red-300 border-red-500/30";

      default:
        return "text-muted";
    }
  };

  const abrirCrear = () => {
    setModalMode("create");
    setViajeSeleccionado(null);
    setOpenModal(true);
  };

  const abrirVer = (viaje) => {
    setModalMode("view");
    setViajeSeleccionado(viaje);
    setOpenModal(true);
  };

  const cerrarModal = async () => {
    setOpenModal(false);
    setViajeSeleccionado(null);
    await recargarProgramaciones();
  };

  const recargarProgramaciones = async (page = paginationProgramaciones.page) => {
    if (getProgramacionesViaje) {
      await getProgramacionesViaje({
        page,
        limit: paginationProgramaciones.limit,
      });
    } else if (obtenerProgramacionesViaje) {
      await obtenerProgramacionesViaje();
    }
  };

  const handlePageChange = (page) => {
    recargarProgramaciones(page);
  };

  const ejecutarCambioEstado = async (viaje, nuevoEstado, fechaHora = "") => {
    const viajeId = getId(viaje);

    if (!viajeId) {
      notify.error("ID de programación no válido");
      return false;
    }

    const requiereFecha = ["EN_CLIENTE", "ENTREGADO"].includes(nuevoEstado);

    const mensajeConfirmacion =
      nuevoEstado === "FINALIZADO"
        ? "¿Seguro que deseas finalizar este servicio?"
        : nuevoEstado === "ANULADO"
        ? "¿Seguro que deseas anular esta programación?"
        : `¿Seguro que deseas cambiar el estado a ${nuevoEstado}?`;

    const confirmar = await confirm({
      title:
        nuevoEstado === "FINALIZADO"
          ? "Finalizar servicio"
          : nuevoEstado === "ANULADO"
          ? "Anular programación"
          : "Cambiar estado",
      message: mensajeConfirmacion,
      confirmText:
        nuevoEstado === "FINALIZADO"
          ? "Finalizar"
          : nuevoEstado === "ANULADO"
          ? "Anular"
          : "Cambiar estado",
      variant: nuevoEstado === "ANULADO" ? "danger" : "primary",
    });

    if (!confirmar) return;

    try {
      setCambiandoEstado((prev) => ({
        ...prev,
        [viajeId]: true,
      }));

      await cambiarEstadoProgramacion(viajeId, {
        estado: nuevoEstado,
        ...(requiereFecha ? { fechaHora } : {}),
      });

      await recargarProgramaciones();

      notify.success(`Programación actualizada a ${nuevoEstado}`);
      return true;
    } catch (error) {
      console.error("Error al cambiar estado:", error);

      notify.error(
        error?.response?.data?.message ||
          "Error al cambiar el estado de la programación"
      );
      return false;
    } finally {
      setCambiandoEstado((prev) => ({
        ...prev,
        [viajeId]: false,
      }));
    }
  };

  const handleCambiarEstado = async (viaje, nuevoEstado) => {
    if (["EN_CLIENTE", "ENTREGADO"].includes(nuevoEstado)) {
      setEstadoConFecha({ viaje, nuevoEstado });
      setFechaHoraOperacion(getDateTimeLocalNow());
      return;
    }

    await ejecutarCambioEstado(viaje, nuevoEstado);
  };

  const cerrarFechaOperacion = () => {
    setEstadoConFecha(null);
    setFechaHoraOperacion(getDateTimeLocalNow());
  };

  const confirmarFechaOperacion = async (e) => {
    e.preventDefault();

    if (!estadoConFecha?.viaje || !estadoConFecha?.nuevoEstado) return;

    if (!fechaHoraOperacion) {
      notify.error("Selecciona fecha y hora");
      return;
    }

    const actualizado = await ejecutarCambioEstado(
      estadoConFecha.viaje,
      estadoConFecha.nuevoEstado,
      fechaHoraOperacion
    );

    if (actualizado) {
      cerrarFechaOperacion();
    }
  };

  const puedeAnular = (estado) => {
    return !["FINALIZADO", "ANULADO"].includes(estado);
  };

  const obtenerNombreConductor = (conductor) => {
    if (!conductor) return "-";

    return `${conductor.nombres || ""} ${conductor.apellidos || ""}`.trim();
  };

  const listaProgramaciones = Array.isArray(programaciones)
    ? programaciones
    : [];

  const EstadoBadge = ({ estado }) => (
    <span
      className={`inline-flex items-center justify-center rounded-full border px-3 py-1 text-[11px] font-bold tracking-wide ${getEstadoStyle(
        estado
      )}`}
    >
      {estado || "SIN ESTADO"}
    </span>
  );

  const AccionesViaje = ({ viaje, mobile = false }) => {
    const viajeId = getId(viaje);

    return (
      <div
        className={`flex ${
          mobile ? "flex-wrap" : "justify-start"
        } flex-wrap gap-2`}
      >
        <button
          type="button"
          onClick={() => abrirVer(viaje)}
          className="btn-secondary btn-icon"
          title="Ver programación"
          aria-label="Ver programación"
        >
          <Eye />
        </button>

        {(TRANSICIONES[viaje.estado] || []).map((accion) => (
          <button
            key={accion.estado}
            type="button"
            disabled={cambiandoEstado[viajeId]}
            onClick={() => handleCambiarEstado(viaje, accion.estado)}
            className="btn-primary btn-icon"
            title={accion.label}
            aria-label={accion.label}
          >
            {cambiandoEstado[viajeId] ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              getAccionIcon(accion.estado)
            )}
          </button>
        ))}

        {puedeAnular(viaje.estado) && (
          <button
            type="button"
            disabled={cambiandoEstado[viajeId]}
            onClick={() => handleCambiarEstado(viaje, "ANULADO")}
            className="btn-danger btn-icon"
            title="Anular programación"
            aria-label="Anular programación"
          >
            {cambiandoEstado[viajeId] ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <Ban />
            )}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="w-full py-4">
      <div className="page-wrap">
        <header className="page-hero">
          <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="eyebrow">Gestión de viajes</div>

              <h1 className="page-title">Programación de Viajes</h1>

              <p className="page-description">
                Asigna órdenes de servicio a unidades y conductores para iniciar
                el flujo operativo.
              </p>
            </div>

            <button
              type="button"
              onClick={abrirCrear}
              className="btn-primary px-3 py-2"
            >
              Nueva programación
            </button>
          </div>
        </header>

        {listaProgramaciones.length === 0 ? (
          <div className="empty-panel">
            <h2 className="text-main text-lg font-semibold">
              No hay programaciones registradas
            </h2>

            <p className="text-muted mt-1 text-sm">
              Crea una programación para asignar unidad y conductor a una orden.
            </p>

            <button
              type="button"
              onClick={abrirCrear}
              className="btn-primary mt-4 px-3 py-2"
            >
              Crear programación
            </button>
          </div>
        ) : (
          <>
            <div className="grid gap-4 lg:hidden">
              {listaProgramaciones.map((viaje) => {
                const viajeId = getId(viaje);

                return (
                  <article key={viajeId} className="mobile-card">
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-faint text-xs font-medium">Orden</p>
                        <h2 className="text-main text-lg font-bold">
                          {viaje.ordenServicio?.numeroOrden || "-"}
                        </h2>
                      </div>

                      <EstadoBadge estado={viaje.estado} />
                    </div>

                    <div className="grid gap-3 text-sm sm:grid-cols-2">
                      <div className="info-tile">
                        <p className="text-faint text-xs">Carga</p>
                        <p className="text-main font-semibold">
                          {formatearTipoCarga(viaje.ordenServicio?.tipoCarga)}
                        </p>
                        <p className="text-faint text-xs">
                          {viaje.ordenServicio?.clasificacionCarga ||
                            "GENERAL"}
                          {viaje.ordenServicio?.tipoCarga === "CONTENEDOR" &&
                          viaje.ordenServicio?.dimensionCarga
                            ? ` · ${formatearDimensionCarga(
                                viaje.ordenServicio.dimensionCarga
                              )}`
                            : ""}
                        </p>
                      </div>

                      <div className="info-tile">
                        <p className="text-faint text-xs">Tracto</p>
                        <p className="text-main font-semibold">
                          {viaje.vehiculoPrincipal?.placa || "-"}
                        </p>
                      </div>

                      <div className="info-tile">
                        <p className="text-faint text-xs">Carreta</p>
                        <p className="text-main font-semibold">
                          {viaje.vehiculoSecundario?.placa || "-"}
                        </p>
                      </div>

                      <div className="info-tile">
                        <p className="text-faint text-xs">Conductor</p>
                        <p className="text-main font-semibold">
                          {obtenerNombreConductor(viaje.conductor)}
                        </p>
                      </div>

                      <div className="info-tile">
                        <p className="text-faint text-xs">Fecha inicio</p>
                        <p className="text-main font-semibold">
                          {formatearFecha(viaje.fechaInicioTraslado)}
                        </p>
                      </div>

                      <div className="info-tile">
                        <p className="text-faint text-xs">Standby</p>
                        <p className="text-main font-semibold">
                          {formatearStandby(viaje.standbyMinutos)}
                        </p>
                        <p className="text-faint text-xs">
                          Cliente:{" "}
                          {formatearFechaHora(viaje.fechaHoraLlegadaCliente)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 border-t pt-4">
                      <AccionesViaje viaje={viaje} mobile />
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="data-table-wrap">
              <div className="table-scroll">
                <table className="data-table w-full min-w-[1100px] text-sm">
                  <thead>
                    <tr>
                      <th className="px-4 py-4 text-left">Orden</th>
                      <th className="px-4 py-4 text-left">Carga</th>
                      <th className="px-4 py-4 text-left">Tracto</th>
                      <th className="px-4 py-4 text-left">Carreta</th>
                      <th className="px-4 py-4 text-left">Conductor</th>
                      <th className="px-4 py-4 text-left">Fecha Inicio</th>
                      <th className="px-4 py-4 text-left">Operación</th>
                      <th className="px-4 py-4 text-center">Estado</th>
                      <th className="px-4 py-4 text-left">Acciones</th>
                    </tr>
                  </thead>

                  <tbody>
                    {listaProgramaciones.map((viaje) => {
                      const viajeId = getId(viaje);

                      return (
                        <tr key={viajeId}>
                          <td className="px-4 py-4">
                            <p className="text-main font-bold">
                              {viaje.ordenServicio?.numeroOrden || "-"}
                            </p>
                          </td>

                          <td className="whitespace-nowrap px-4 py-4">
                            <p className="text-main font-semibold">
                              {formatearTipoCarga(
                                viaje.ordenServicio?.tipoCarga
                              )}
                            </p>
                            <p className="text-faint text-xs">
                              {viaje.ordenServicio?.clasificacionCarga ||
                                "GENERAL"}
                              {viaje.ordenServicio?.tipoCarga ===
                                "CONTENEDOR" &&
                              viaje.ordenServicio?.dimensionCarga
                                ? ` · ${formatearDimensionCarga(
                                    viaje.ordenServicio.dimensionCarga
                                  )}`
                                : ""}
                            </p>
                          </td>

                          <td className="text-muted px-4 py-4">
                            {viaje.vehiculoPrincipal?.placa || "-"}
                          </td>

                          <td className="text-muted px-4 py-4">
                            {viaje.vehiculoSecundario?.placa || "-"}
                          </td>

                          <td className="text-muted min-w-[220px] px-4 py-4">
                            {obtenerNombreConductor(viaje.conductor)}
                          </td>

                          <td className="text-muted whitespace-nowrap px-4 py-4">
                            {formatearFecha(viaje.fechaInicioTraslado)}
                          </td>

                          <td className="text-muted min-w-[220px] px-4 py-4">
                            <p className="text-faint text-xs">
                              Cliente:{" "}
                              {formatearFechaHora(
                                viaje.fechaHoraLlegadaCliente
                              )}
                            </p>
                            <p className="text-faint text-xs">
                              Entrega:{" "}
                              {formatearFechaHora(viaje.fechaHoraEntrega)}
                            </p>
                            <p className="text-main text-xs font-semibold">
                              Standby: {formatearStandby(viaje.standbyMinutos)}
                            </p>
                          </td>

                          <td className="whitespace-nowrap px-4 py-4 text-center">
                            <EstadoBadge estado={viaje.estado} />
                          </td>

                          <td className="px-4 py-4">
                            <AccionesViaje viaje={viaje} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <TablePagination
              page={paginationProgramaciones.page}
              totalPages={paginationProgramaciones.totalPages}
              total={paginationProgramaciones.total}
              limit={paginationProgramaciones.limit}
              onPageChange={handlePageChange}
            />
          </>
        )}

        <ProgramacionViajeModal
          isOpen={openModal}
          open={openModal}
          onClose={cerrarModal}
          mode={modalMode}
          data={viajeSeleccionado}
        />

        {estadoConFecha && (
          <div className="modal-backdrop">
            <form
              onSubmit={confirmarFechaOperacion}
              className="modal-panel max-w-md"
            >
              <div className="mb-4 flex items-start gap-3">
                <div className="rounded-lg border border-[var(--app-border)] p-2">
                  <CalendarClock className="h-5 w-5 text-blue-400" />
                </div>

                <div>
                  <h2 className="text-main text-lg font-bold">
                    {estadoConFecha.nuevoEstado === "EN_CLIENTE"
                      ? "Llegada al cliente"
                      : "Entrega completada"}
                  </h2>
                  <p className="text-muted text-sm">
                    Selecciona la fecha y hora registrada para este estado.
                  </p>
                </div>
              </div>

              <label className="text-muted mb-1 block text-sm font-semibold">
                Fecha y hora
              </label>
              <input
                type="datetime-local"
                value={fechaHoraOperacion}
                onChange={(e) => setFechaHoraOperacion(e.target.value)}
                className="input p-3"
                required
              />

              <div className="mt-5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={cerrarFechaOperacion}
                  className="btn-secondary px-3 py-1.5"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary px-3 py-1.5">
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgramacionViajePage;
