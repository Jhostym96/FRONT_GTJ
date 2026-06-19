import { useEffect, useState } from "react";
import {
  Ban,
  CalendarClock,
  CheckCircle2,
  Eye,
  FileCheck2,
  Flag,
  LoaderCircle,
  MapPin,
  Pencil,
  Route,
  Warehouse,
} from "lucide-react";
import { notify } from "../utils/notify";
import { useProgramacionViaje } from "../context/ProgramacionViajeContext";
import { useUnidades } from "../context/UnidadContext";
import { useConductores } from "../context/ConductorContext";
import { useConfirm } from "../context/ConfirmContext";
import { formatDateOnly } from "../utils/date";

import ProgramacionViajeModal from "../components/modals/ProgramacionViajeModal";
import ProgramacionGuiaSunatModal from "../components/modals/ProgramacionGuiaSunatModal";
import TablePagination from "../components/TablePagination";

const APP_TIME_ZONE = "America/Lima";
const APP_TIME_ZONE_OFFSET = "-05:00";

const formatearTipoCarga = (tipoCarga) =>
  tipoCarga ? tipoCarga.replace("_", " ") : "-";

const formatearDimensionCarga = (dimensionCarga) =>
  dimensionCarga ? `${dimensionCarga} pies` : "";

const requiereDimensionContenedor = (tipoCarga) =>
  ["CONTENEDOR", "EXPORTACION"].includes(tipoCarga);

const getDateTimeLocalNow = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );

  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
};

const toApiFechaHoraOperacion = (fechaHora) => {
  if (!fechaHora) return "";

  const texto = String(fechaHora).trim();

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(texto)) {
    return `${texto}:00${APP_TIME_ZONE_OFFSET}`;
  }

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(texto)) {
    return `${texto}${APP_TIME_ZONE_OFFSET}`;
  }

  return texto;
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

  const { obtenerUnidades, obtenerTodasUnidades } = useUnidades();
  const { obtenerConductores, obtenerTodosConductores, getConductores } =
    useConductores();
  const confirm = useConfirm();

  const [openModal, setOpenModal] = useState(false);
  const [viajeSeleccionado, setViajeSeleccionado] = useState(null);
  const [modalMode, setModalMode] = useState("create");
  const [cambiandoEstado, setCambiandoEstado] = useState({});
  const [estadoConFecha, setEstadoConFecha] = useState(null);
  const [viajeGuiaSunat, setViajeGuiaSunat] = useState(null);
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

      const selectParams = { page: 1, limit: 100 };

      if (obtenerTodasUnidades) {
        await obtenerTodasUnidades(selectParams);
      } else {
        await obtenerUnidades?.(selectParams);
      }

      if (obtenerTodosConductores) {
        await obtenerTodosConductores(selectParams);
      } else if (obtenerConductores) {
        await obtenerConductores(selectParams);
      } else if (getConductores) {
        await getConductores(selectParams);
      }
    };

    cargarDatos();
  }, [
    getConductores,
    getProgramacionesViaje,
    obtenerConductores,
    obtenerTodosConductores,
    obtenerProgramacionesViaje,
    obtenerTodasUnidades,
    obtenerUnidades,
  ]);

  const formatearFecha = (fecha) => {
    return formatDateOnly(fecha);
  };

  const formatearFechaHora = (fecha) => {
    if (!fecha) return "-";

    const fechaObj = new Date(fecha);

    if (Number.isNaN(fechaObj.getTime())) return "-";

    return fechaObj.toLocaleString("es-PE", {
      timeZone: APP_TIME_ZONE,
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

  const abrirEditar = async (viaje) => {
    const requiereConfirmacion = viaje.estado === "EN_RUTA";

    if (requiereConfirmacion) {
      const confirmar = await confirm({
        title: "Editar viaje en ruta",
        message:
          "El viaje ya está en ruta. Solo continúa si hay una incidencia operativa y registrarás el motivo.",
        confirmText: "Continuar",
        variant: "primary",
      });

      if (!confirmar) return;
    }

    setModalMode("edit");
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
        ...(requiereFecha
          ? { fechaHora: toApiFechaHoraOperacion(fechaHora) }
          : {}),
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

  const tieneGuiaAsociada = (viaje) => {
    return (viaje?.guiasTransportista || []).some(
      (guia) => guia.estado !== "ANULADA"
    );
  };

  const tieneGuiaRegistrada = (viaje) =>
    Boolean(viaje?.guiaSunatNumero) || tieneGuiaAsociada(viaje);

  const puedeAnular = (viaje) => {
    return (
      viaje &&
      !["FINALIZADO", "ANULADO"].includes(viaje.estado) &&
      !tieneGuiaRegistrada(viaje)
    );
  };

  const tieneGuiaEmitida = (viaje) => {
    return (viaje?.guiasTransportista || []).some(
      (guia) => !["ANULADA", "ERROR"].includes(guia.estado)
    );
  };

  const puedeEditar = (viaje) => {
    return (
      viaje &&
      !["FINALIZADO", "ANULADO"].includes(viaje.estado) &&
      !tieneGuiaEmitida(viaje)
    );
  };

  const obtenerNombreConductor = (conductor) => {
    if (!conductor) return "-";

    return `${conductor.nombres || ""} ${conductor.apellidos || ""}`.trim();
  };

  const obtenerClienteSolicitante = (viaje) => {
    const orden = viaje?.ordenServicio || {};
    const cliente =
      orden?.clienteSolicitante ||
      orden?.cliente ||
      viaje?.ordenServicio?.clienteSolicitante ||
      viaje?.ordenServicio?.cliente ||
      viaje?.clienteSolicitante ||
      viaje?.cliente;

    if (cliente?.razonSocial || cliente?.numeroDocumento) return cliente;

    if (
      orden?.clienteSolicitanteRazonSocial ||
      orden?.clienteSolicitanteNumeroDocumento
    ) {
      return {
        razonSocial: orden.clienteSolicitanteRazonSocial,
        numeroDocumento: orden.clienteSolicitanteNumeroDocumento,
      };
    }

    if (
      viaje?.clienteSolicitanteRazonSocial ||
      viaje?.clienteSolicitanteNumeroDocumento
    ) {
      return {
        razonSocial: viaje.clienteSolicitanteRazonSocial,
        numeroDocumento: viaje.clienteSolicitanteNumeroDocumento,
      };
    }

    return null;
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
    const actionClass = (variant) => (mobile ? variant : `${variant} btn-icon`);

    return (
      <div className={mobile ? "mobile-actions" : "table-actions"}>
        <button
          type="button"
          onClick={() => abrirVer(viaje)}
          className={actionClass("btn-secondary")}
          title="Ver programación"
          aria-label="Ver programación"
        >
          <Eye />
          {mobile && "Ver"}
        </button>

        {puedeEditar(viaje) && (
          <button
            type="button"
            onClick={() => abrirEditar(viaje)}
            className={actionClass("btn-secondary")}
            title={
              viaje.estado === "EN_RUTA"
                ? "Editar con motivo operativo"
                : "Editar programación"
            }
            aria-label="Editar programación"
          >
            <Pencil />
            {mobile && "Editar"}
          </button>
        )}

        {(TRANSICIONES[viaje.estado] || []).map((accion) => (
          <button
            key={accion.estado}
            type="button"
            disabled={cambiandoEstado[viajeId]}
            onClick={() => handleCambiarEstado(viaje, accion.estado)}
            className={actionClass("btn-primary")}
            title={accion.label}
            aria-label={accion.label}
          >
            {cambiandoEstado[viajeId] ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              getAccionIcon(accion.estado)
            )}
            {mobile && accion.label}
          </button>
        ))}

        {!tieneGuiaRegistrada(viaje) &&
          !["FINALIZADO", "ANULADO"].includes(viaje.estado) && (
            <button
              type="button"
              onClick={() => setViajeGuiaSunat(viaje)}
              className={actionClass("btn-secondary")}
              title="Registrar guía emitida en SUNAT"
              aria-label="Registrar guía emitida en SUNAT"
            >
              <FileCheck2 />
              {mobile && "Guía SUNAT"}
            </button>
          )}

        {puedeAnular(viaje) && (
          <button
            type="button"
            disabled={cambiandoEstado[viajeId]}
            onClick={() => handleCambiarEstado(viaje, "ANULADO")}
            className={actionClass("btn-danger")}
            title="Anular programación"
            aria-label="Anular programación"
          >
            {cambiandoEstado[viajeId] ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <Ban />
            )}
            {mobile && "Anular"}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="page">
      <div className="page-wrap">
        <header className="page-hero">
          <div className="page-hero-content">
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
            <div className="mobile-list">
              {listaProgramaciones.map((viaje) => {
                const viajeId = getId(viaje);
                const cliente = obtenerClienteSolicitante(viaje);

                return (
                  <article key={viajeId} className="mobile-card">
                    <div className="mobile-card-header">
                      <div>
                        <p className="text-faint text-xs font-medium">
                          Programación
                        </p>
                        <h2 className="mobile-card-title">
                          {viaje.numeroProgramacion ||
                            `PV-${String(viajeId).padStart(6, "0")}`}
                        </h2>
                        <p className="mobile-card-subtitle">
                          Orden: {viaje.ordenServicio?.numeroOrden || "-"}
                        </p>
                      </div>

                      <EstadoBadge estado={viaje.estado} />
                    </div>

                    <div className="mobile-detail-grid-2">
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
                        <p className="text-faint text-xs">Carga</p>
                        <p className="text-main font-semibold">
                          {formatearTipoCarga(viaje.ordenServicio?.tipoCarga)}
                        </p>
                        <p className="text-faint text-xs">
                          {viaje.ordenServicio?.clasificacionCarga ||
                            "GENERAL"}
                          {requiereDimensionContenedor(
                            viaje.ordenServicio?.tipoCarga
                          ) &&
                          viaje.ordenServicio?.dimensionCarga
                            ? ` · ${formatearDimensionCarga(
                                viaje.ordenServicio.dimensionCarga
                              )}`
                            : ""}
                        </p>
                        {viaje.ordenServicio?.tipoCarga === "CONTENEDOR" && (
                          <p className="text-faint text-xs">
                            Contenedor: {viaje.numeroContenedor || "-"}
                          </p>
                        )}
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
                        <p className="text-faint text-xs">
                          Cita: {viaje.horaCita || "-"}
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
                        {viaje.guiaSunatNumero && (
                          <p className="mt-1 text-xs font-semibold text-amber-300">
                            Guía SUNAT: {viaje.guiaSunatNumero}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mobile-card-actions">
                      <AccionesViaje viaje={viaje} mobile />
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="data-table-wrap">
              <div className="table-scroll">
                <table className="data-table dense-table w-full min-w-[1250px] text-sm">
                  <thead>
                    <tr>
                      <th className="px-4 py-4 text-left">Programación</th>
                      <th className="px-4 py-4 text-left">Cliente</th>
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
                      const cliente = obtenerClienteSolicitante(viaje);

                      return (
                        <tr key={viajeId}>
                          <td className="px-4 py-4">
                            <p className="text-main font-bold">
                              {viaje.numeroProgramacion ||
                                `PV-${String(viajeId).padStart(6, "0")}`}
                            </p>
                            <p className="text-faint text-xs">
                              Orden: {viaje.ordenServicio?.numeroOrden || "-"}
                            </p>
                          </td>

                          <td className="min-w-[220px] px-4 py-4">
                            <p className="text-main max-w-[260px] truncate font-semibold">
                              {cliente?.razonSocial || "-"}
                            </p>
                            <p className="text-faint text-xs">
                              {cliente?.numeroDocumento || ""}
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
                              {requiereDimensionContenedor(
                                viaje.ordenServicio?.tipoCarga
                              ) &&
                              viaje.ordenServicio?.dimensionCarga
                                ? ` · ${formatearDimensionCarga(
                                    viaje.ordenServicio.dimensionCarga
                                  )}`
                                : ""}
                            </p>
                            {viaje.ordenServicio?.tipoCarga ===
                              "CONTENEDOR" && (
                              <p className="text-faint text-xs">
                                Contenedor: {viaje.numeroContenedor || "-"}
                              </p>
                            )}
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
                            <p>{formatearFecha(viaje.fechaInicioTraslado)}</p>
                            <p className="text-faint text-xs">
                              Cita: {viaje.horaCita || "-"}
                            </p>
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
                            {viaje.guiaSunatNumero && (
                              <p className="mt-1 text-xs font-semibold text-amber-300">
                                Guía SUNAT: {viaje.guiaSunatNumero}
                              </p>
                            )}
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

        <ProgramacionGuiaSunatModal
          isOpen={Boolean(viajeGuiaSunat)}
          programacion={viajeGuiaSunat}
          onClose={async (actualizado) => {
            setViajeGuiaSunat(null);
            if (actualizado) {
              await recargarProgramaciones();
            }
          }}
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
