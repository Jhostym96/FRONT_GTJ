import { useEffect, useState } from "react";
import { notify } from "../utils/notify";
import { Ban, Eye, LoaderCircle, Pencil } from "lucide-react";
import { useOrdenesServicio } from "../context/OrdenServicioContext";
import { useConfirm } from "../context/ConfirmContext";
import { formatDateOnly } from "../utils/date";

import OrdenServicioModal from "../components/modals/OrdenServicioModal";
import TablePagination from "../components/TablePagination";

const getItemId = (item) => item?.id ?? item?._id;

const formatearTipoCarga = (tipoCarga) =>
  tipoCarga ? tipoCarga.replace("_", " ") : "-";

const formatearDimensionCarga = (dimensionCarga) =>
  dimensionCarga ? `${dimensionCarga} pies` : "-";

const requiereDimensionContenedor = (tipoCarga) =>
  ["CONTENEDOR", "EXPORTACION"].includes(tipoCarga);

const estadosNoAnulables = ["ANULADA", "FINALIZADA", "FINALIZADO"];

const OrdenesServicioPage = () => {
  const {
    ordenes = [],
    loading,
    paginationOrdenes,
    cargarOrdenesServicio,
    anularOrdenServicio,
  } = useOrdenesServicio();
  const confirm = useConfirm();

  const [anulando, setAnulando] = useState({});

  const [openOrdenModal, setOpenOrdenModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);

  useEffect(() => {
    cargarOrdenesServicio({ page: 1, limit: 10 });
  }, [cargarOrdenesServicio]);

  const formatearFecha = (fecha) => {
    return formatDateOnly(fecha);
  };

  const getEstadoStyle = (estado) => {
    switch (estado) {
      case "PENDIENTE":
        return "bg-yellow-500/10 text-yellow-300 border-yellow-500/30";
      case "PARCIALMENTE_PROGRAMADA":
        return "bg-cyan-500/10 text-cyan-300 border-cyan-500/30";
      case "PROGRAMADA":
        return "bg-blue-500/10 text-blue-300 border-blue-500/30";
      case "EN_PROCESO":
        return "bg-purple-500/10 text-purple-300 border-purple-500/30";
      case "FINALIZADA":
        return "bg-green-500/10 text-green-300 border-green-500/30";
      case "ANULADA":
        return "bg-red-500/10 text-red-300 border-red-500/30";
      default:
        return "text-muted";
    }
  };

  const abrirCrear = () => {
    setModalMode("create");
    setOrdenSeleccionada(null);
    setOpenOrdenModal(true);
  };

  const abrirVer = (orden) => {
    setModalMode("view");
    setOrdenSeleccionada(orden);
    setOpenOrdenModal(true);
  };

  const abrirEditar = (orden) => {
    setModalMode("edit");
    setOrdenSeleccionada(orden);
    setOpenOrdenModal(true);
  };

  const cerrarOrdenModal = () => {
    setOpenOrdenModal(false);
    setOrdenSeleccionada(null);
    setModalMode("create");
    cargarOrdenesServicio({
      page: paginationOrdenes.page,
      limit: paginationOrdenes.limit,
    });
  };

  const getViajesAsignados = (orden) => {
    const viajesProgramados = Number(orden?.viajesProgramados) || 0;

    const relaciones = [
      orden?.programaciones,
      orden?.programacionesViaje,
      orden?.viajes,
      orden?.viajesAsignados,
    ];

    const viajesEnRelaciones = relaciones.some(
      (relacion) => Array.isArray(relacion) && relacion.length > 0
    );

    return viajesProgramados > 0 || viajesEnRelaciones || Boolean(orden?.programacionViaje);
  };

  const getMotivoBloqueoAnulacion = (orden) => {
    if (estadosNoAnulables.includes(orden?.estado)) {
      return "La orden ya está finalizada o anulada.";
    }

    if (getViajesAsignados(orden)) {
      return "La orden ya tiene viajes asignados.";
    }

    return "";
  };

  const handleAnular = async (orden) => {
    const id = getItemId(orden);
    const motivoBloqueo = getMotivoBloqueoAnulacion(orden);

    if (motivoBloqueo) {
      notify.info(`No se puede anular esta orden. ${motivoBloqueo}`);
      return;
    }

    const confirmar = await confirm({
      title: "Anular orden",
      message: "¿Seguro que deseas anular esta orden de servicio?",
      confirmText: "Anular",
      variant: "danger",
    });

    if (!confirmar) return;

    try {
      setAnulando((prev) => ({ ...prev, [id]: true }));

      await anularOrdenServicio(id);

      notify.success("Orden anulada correctamente");
      const nextPage =
        ordenes.length === 1 && paginationOrdenes.page > 1
          ? paginationOrdenes.page - 1
          : paginationOrdenes.page;
      await cargarOrdenesServicio({
        page: nextPage,
        limit: paginationOrdenes.limit,
      });
    } catch (error) {
      console.error("Error al anular orden:", error);
      notify.error(error.response?.data?.message || "Error al anular la orden");
    } finally {
      setAnulando((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handlePageChange = (page) => {
    cargarOrdenesServicio({ page, limit: paginationOrdenes.limit });
  };

  const EstadoBadge = ({ estado }) => (
    <span
      className={`inline-flex items-center justify-center rounded-full border px-3 py-1 text-[11px] font-bold tracking-wide ${getEstadoStyle(
        estado
      )}`}
    >
      {estado || "SIN ESTADO"}
    </span>
  );

  const DevolucionBadge = ({ orden }) => {
    if (
      orden.estado === "ANULADA" ||
      orden.estado === "ANULADO" ||
      orden.tipoCarga !== "CONTENEDOR"
    ) {
      return <span className="text-faint text-xs">No aplica</span>;
    }

    const devoluciones = Array.isArray(orden.devolucionesContenedor)
      ? orden.devolucionesContenedor
      : [];
    const devolucionesValidas = devoluciones.filter(
      (devolucion) => devolucion?.estadoDevolucion
    );

    if (devolucionesValidas.length === 0) {
      const estadoLegado = orden.estadoDevolucion || "PENDIENTE";
      const devuelta = estadoLegado === "DEVUELTO";
      const programada = estadoLegado === "PROGRAMADA";

      return (
        <span
          className={`inline-flex items-center justify-center rounded-full border px-3 py-1 text-[11px] font-bold tracking-wide ${
            devuelta
              ? "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-300"
              : programada
              ? "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300"
              : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
          }`}
        >
          {devuelta ? "DEVUELTO" : programada ? "PROGRAMADA" : "PENDIENTE"}
        </span>
      );
    }

    const total = devolucionesValidas.length;
    const devueltas = devolucionesValidas.filter(
      (devolucion) => devolucion.estadoDevolucion === "DEVUELTO"
    ).length;
    const programadas = devolucionesValidas.filter(
      (devolucion) => devolucion.estadoDevolucion === "PROGRAMADA"
    ).length;

    const todasDevueltas = devueltas === total;
    const parcialmenteDevuelta = devueltas > 0 && devueltas < total;
    const todasProgramadas = programadas === total;
    const tieneProgramadas = programadas > 0;

    let label = "PENDIENTE";
    let classes =
      "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300";

    if (todasDevueltas) {
      label = total > 1 ? `DEVUELTO ${devueltas}/${total}` : "DEVUELTO";
      classes =
        "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-300";
    } else if (parcialmenteDevuelta) {
      label = `PARCIAL ${devueltas}/${total}`;
      classes =
        "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300";
    } else if (todasProgramadas) {
      label = total > 1 ? `PROGRAMADA ${programadas}/${total}` : "PROGRAMADA";
      classes =
        "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300";
    } else if (tieneProgramadas) {
      label = `PROGRAMADA ${programadas}/${total}`;
      classes =
        "border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300";
    } else if (total > 1) {
      label = `PENDIENTE 0/${total}`;
    }

    return (
      <span
        className={`inline-flex items-center justify-center rounded-full border px-3 py-1 text-[11px] font-bold tracking-wide ${classes}`}
        title={`${devueltas} de ${total} contenedor(es) devuelto(s)`}
      >
        {label}
      </span>
    );
  };

  const AccionesOrden = ({ orden, mobile = false }) => {
    const ordenId = getItemId(orden);
    const motivoBloqueoAnulacion = getMotivoBloqueoAnulacion(orden);

    return (
      <div className={mobile ? "mobile-actions" : "table-actions"}>
        <button
          type="button"
          onClick={() => abrirVer(orden)}
          className={mobile ? "btn-secondary" : "btn-secondary btn-icon"}
          title="Ver orden"
          aria-label="Ver orden"
        >
          <Eye />
          {mobile && "Ver"}
        </button>

        <button
          type="button"
          onClick={() => abrirEditar(orden)}
          disabled={orden.estado === "ANULADA"}
          className={mobile ? "btn-primary" : "btn-primary btn-icon"}
          title="Editar orden"
          aria-label="Editar orden"
        >
          <Pencil />
          {mobile && "Editar"}
        </button>

        {!motivoBloqueoAnulacion && (
          <button
            type="button"
            onClick={() => handleAnular(orden)}
            disabled={anulando[ordenId]}
            className={mobile ? "btn-danger" : "btn-danger btn-icon"}
            title="Anular orden"
            aria-label="Anular orden"
          >
            {anulando[ordenId] ? <LoaderCircle className="animate-spin" /> : <Ban />}
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
              <div className="eyebrow">Gestión de transporte</div>

              <h1 className="page-title">Órdenes de Servicio</h1>

              <p className="page-description">
                Visualiza, registra y administra las órdenes de servicio para
                transporte.
              </p>
            </div>

            <button
              type="button"
              onClick={abrirCrear}
              className="btn-primary px-3 py-2"
            >
              Nueva orden
            </button>
          </div>
        </header>

        {loading ? (
          <div className="loading-panel">
            <div className="loading-spinner" />
            <p className="text-muted text-sm">
              Cargando órdenes de servicio...
            </p>
          </div>
        ) : ordenes.length === 0 ? (
          <div className="empty-panel">
            <h2 className="text-main text-lg font-semibold">
              No hay órdenes registradas
            </h2>

            <p className="text-muted mt-1 text-sm">
              Crea tu primera orden de servicio para empezar.
            </p>

            <button
              type="button"
              onClick={abrirCrear}
              className="btn-primary mt-4 px-3 py-2"
            >
              Crear orden
            </button>
          </div>
        ) : (
          <>
            <div className="mobile-list">
              {ordenes.map((orden) => {
                const ordenId = getItemId(orden);

                return (
                  <article key={ordenId} className="mobile-card">
                    <div className="mobile-card-header">
                      <div>
                        <p className="text-faint text-xs font-medium">
                          N° Orden
                        </p>
                        <h2 className="mobile-card-title">
                          {orden.numeroOrden || "-"}
                        </h2>
                      </div>

                      <EstadoBadge estado={orden.estado} />
                    </div>

                    <div className="mobile-detail-grid">
                      <div className="info-tile">
                        <p className="text-faint text-xs">Fecha</p>
                        <p className="text-main font-semibold">
                          {formatearFecha(orden.fechaProgramada)}
                        </p>
                      </div>

                      <div className="info-tile">
                        <p className="text-faint text-xs">Tipo de carga</p>
                        <p className="text-main font-semibold">
                          {formatearTipoCarga(orden.tipoCarga)}
                        </p>
                        <p className="text-faint text-xs">
                          {orden.clasificacionCarga || "GENERAL"}
                        </p>
                      </div>

                      <div className="info-tile">
                        <p className="text-faint text-xs">Viajes</p>
                        <p className="text-main font-semibold">
                          {orden.viajesProgramados || 0}/
                          {orden.cantidadViajes || 1}
                        </p>
                      </div>

                      {requiereDimensionContenedor(orden.tipoCarga) && (
                        <div className="info-tile">
                          <p className="text-faint text-xs">Contenedor</p>
                          <p className="text-main font-semibold">
                            {formatearDimensionCarga(orden.dimensionCarga)}
                          </p>
                          {orden.tipoCarga === "CONTENEDOR" && (
                            <>
                              {orden.numeroContenedor && (
                                <p className="text-faint text-xs">
                                  N° {orden.numeroContenedor}
                                </p>
                              )}
                              <p className="text-faint text-xs">
                                Vence:{" "}
                                {formatearFecha(
                                  orden.fechaVencimientoDevolucion
                                )}
                              </p>
                            </>
                          )}
                          {orden.tipoCarga === "EXPORTACION" && (
                            <p className="text-faint text-xs">
                              Sin devolución
                            </p>
                          )}
                        </div>
                      )}

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
                        <p className="text-faint text-xs">Ruta</p>
                        <p className="text-muted mt-1">
                          {orden.partida?.direccion || "-"}
                        </p>
                        <p className="text-faint mt-1 text-xs">
                          → {orden.llegada?.direccion || "-"}
                        </p>
                      </div>

                      <div className="info-tile">
                        <p className="text-faint mb-2 text-xs">Devolución</p>
                        <DevolucionBadge orden={orden} />
                      </div>
                    </div>

                    <div className="mobile-card-actions">
                      <AccionesOrden orden={orden} mobile />
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="data-table-wrap">
              <div className="table-scroll">
                <table className="data-table dense-table w-full min-w-[1200px] text-sm">
                  <thead>
                    <tr>
                      <th className="px-4 py-4 text-left">N° Orden</th>
                      <th className="px-4 py-4 text-left">Fecha</th>
                      <th className="px-4 py-4 text-left">Carga</th>
                      <th className="px-4 py-4 text-left">Viajes</th>
                      <th className="px-4 py-4 text-left">Contenedor</th>
                      <th className="px-4 py-4 text-left">Cliente</th>
                      <th className="px-4 py-4 text-left">Ruta</th>
                      <th className="px-4 py-4 text-center">Estado</th>
                      <th className="px-4 py-4 text-center">Devolución</th>
                      <th className="px-4 py-4 text-center">Acciones</th>
                    </tr>
                  </thead>

                  <tbody>
                    {ordenes.map((orden) => {
                      const ordenId = getItemId(orden);

                      return (
                        <tr key={ordenId}>
                          <td className="px-4 py-4">
                            <p className="text-main font-bold">
                              {orden.numeroOrden || "-"}
                            </p>
                          </td>

                          <td className="text-muted whitespace-nowrap px-4 py-4">
                            {formatearFecha(orden.fechaProgramada)}
                          </td>

                          <td className="whitespace-nowrap px-4 py-4">
                            <p className="text-main font-semibold">
                              {formatearTipoCarga(orden.tipoCarga)}
                            </p>
                            <p className="text-faint text-xs">
                              {orden.clasificacionCarga || "GENERAL"}
                            </p>
                            {requiereDimensionContenedor(orden.tipoCarga) && (
                              <p className="text-faint text-xs">
                                {formatearDimensionCarga(orden.dimensionCarga)}
                              </p>
                            )}
                          </td>

                          <td className="text-muted whitespace-nowrap px-4 py-4">
                            <p className="text-main font-semibold">
                              {orden.viajesProgramados || 0}/
                              {orden.cantidadViajes || 1}
                            </p>
                            <p className="text-faint text-xs">
                              Pendientes: {orden.viajesPendientes ?? "-"}
                            </p>
                          </td>

                          <td className="text-muted whitespace-nowrap px-4 py-4">
                            {orden.tipoCarga === "CONTENEDOR" ? (
                              <>
                                <p className="text-main font-semibold">
                                  {orden.numeroContenedor ||
                                    formatearDimensionCarga(
                                      orden.dimensionCarga
                                    )}
                                </p>
                                <p className="text-faint text-xs">
                                  Vence:{" "}
                                  {formatearFecha(
                                    orden.fechaVencimientoDevolucion
                                  )}
                                </p>
                              </>
                            ) : orden.tipoCarga === "EXPORTACION" ? (
                              <p className="text-main font-semibold">
                                {formatearDimensionCarga(orden.dimensionCarga)}
                              </p>
                            ) : (
                              "-"
                            )}
                          </td>

                          <td className="min-w-[190px] px-4 py-4">
                            <p className="text-main max-w-[230px] truncate font-semibold">
                              {orden.clienteSolicitante?.razonSocial || "-"}
                            </p>
                            <p className="text-faint text-xs">
                              {orden.clienteSolicitante?.numeroDocumento || ""}
                            </p>
                          </td>

                          <td className="min-w-[280px] px-4 py-4">
                            <p className="text-muted max-w-[360px] truncate">
                              {orden.partida?.direccion || "-"}
                            </p>
                            <p className="text-faint max-w-[360px] truncate text-xs">
                              → {orden.llegada?.direccion || "-"}
                            </p>
                          </td>

                          <td className="whitespace-nowrap px-4 py-4 text-center">
                            <EstadoBadge estado={orden.estado} />
                          </td>

                          <td className="whitespace-nowrap px-4 py-4 text-center">
                            <DevolucionBadge orden={orden} />
                          </td>

                          <td className="whitespace-nowrap px-4 py-4">
                            <AccionesOrden orden={orden} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <TablePagination
              page={paginationOrdenes.page}
              totalPages={paginationOrdenes.totalPages}
              total={paginationOrdenes.total}
              limit={paginationOrdenes.limit}
              onPageChange={handlePageChange}
            />
          </>
        )}

        <OrdenServicioModal
          isOpen={openOrdenModal}
          onClose={cerrarOrdenModal}
          mode={modalMode}
          orden={ordenSeleccionada}
        />
      </div>
    </div>
  );
};

export default OrdenesServicioPage;
