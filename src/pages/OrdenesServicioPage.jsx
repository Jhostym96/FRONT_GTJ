import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useOrdenesServicio } from "../context/OrdenServicioContext";

import OrdenServicioModal from "../components/modals/OrdenServicioModal";

const getItemId = (item) => item?.id ?? item?._id;

const OrdenesServicioPage = () => {
  const {
    ordenes = [],
    loading,
    cargarOrdenesServicio,
    anularOrdenServicio,
  } = useOrdenesServicio();

  const [anulando, setAnulando] = useState({});

  const [openOrdenModal, setOpenOrdenModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);

  useEffect(() => {
    cargarOrdenesServicio();
  }, []);

  const totalOrdenes = useMemo(() => ordenes?.length || 0, [ordenes]);

  const formatearFecha = (fecha) => {
    if (!fecha) return "-";

    return new Date(fecha).toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getEstadoStyle = (estado) => {
    switch (estado) {
      case "PENDIENTE":
        return "bg-yellow-500/10 text-yellow-300 border-yellow-500/30";
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
  };

  const handleAnular = async (id) => {
    const confirmar = window.confirm(
      "¿Seguro que deseas anular esta orden de servicio?"
    );

    if (!confirmar) return;

    try {
      setAnulando((prev) => ({ ...prev, [id]: true }));

      await anularOrdenServicio(id);

      toast.success("Orden anulada correctamente");
      await cargarOrdenesServicio();
    } catch (error) {
      console.error("Error al anular orden:", error);
      toast.error(error.response?.data?.message || "Error al anular la orden");
    } finally {
      setAnulando((prev) => ({ ...prev, [id]: false }));
    }
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
    if (orden.tipoCarga !== "CONTENEDOR") {
      return <span className="text-faint text-xs">No aplica</span>;
    }

    const pendiente = orden.estadoDevolucion !== "DEVUELTO";

    return (
      <span
        className={`inline-flex items-center justify-center rounded-full border px-3 py-1 text-[11px] font-bold tracking-wide ${
          pendiente
            ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
            : "border-green-500/30 bg-green-500/10 text-green-400"
        }`}
      >
        {pendiente ? "PENDIENTE" : "DEVUELTO"}
      </span>
    );
  };

  const AccionesOrden = ({ orden, mobile = false }) => {
    const ordenId = getItemId(orden);

    return (
      <div
        className={`flex ${
          mobile ? "w-full flex-col sm:flex-row" : "justify-center"
        } gap-2`}
      >
        <button
          type="button"
          onClick={() => abrirVer(orden)}
          className="btn-secondary px-3 py-2 text-xs"
        >
          Ver
        </button>

        <button
          type="button"
          onClick={() => abrirEditar(orden)}
          disabled={orden.estado === "ANULADA"}
          className="btn-primary px-3 py-2 text-xs"
        >
          Editar
        </button>

        {orden.estado !== "ANULADA" && (
          <button
            type="button"
            onClick={() => handleAnular(ordenId)}
            disabled={anulando[ordenId]}
            className="btn-danger px-3 py-2 text-xs"
          >
            {anulando[ordenId] ? "Anulando..." : "Anular"}
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
              <div className="eyebrow">
                Gestión de transporte
              </div>

              <h1 className="page-title">
                Órdenes de Servicio
              </h1>

              <p className="page-description">
                Visualiza, registra y administra las órdenes de servicio para
                transporte.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="info-tile border px-4 py-3">
                <p className="text-faint text-xs">Total órdenes</p>
                <p className="text-main text-xl font-bold">
                  {totalOrdenes}
                </p>
              </div>

              <button
                type="button"
                onClick={abrirCrear}
                className="btn-primary px-5 py-3"
              >
                Nueva orden
              </button>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="panel p-8 text-center">
            <div className="mx-auto mb-3 h-9 w-9 animate-spin rounded-full border-2 border-[var(--app-border)] border-t-blue-500" />
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
              className="btn-primary mt-5 px-5 py-3"
            >
              Crear orden
            </button>
          </div>
        ) : (
          <>
            <div className="grid gap-4 lg:hidden">
              {ordenes.map((orden) => {
                const ordenId = getItemId(orden);

                return (
                  <article
                    key={ordenId}
                    className="mobile-card"
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-faint text-xs font-medium">
                          N° Orden
                        </p>
                        <h2 className="text-main text-lg font-bold">
                          {orden.numeroOrden || "-"}
                        </h2>
                      </div>

                      <EstadoBadge estado={orden.estado} />
                    </div>

                    <div className="grid gap-3 text-sm">
                      <div className="info-tile">
                        <p className="text-faint text-xs">Fecha</p>
                        <p className="text-main font-semibold">
                          {formatearFecha(orden.fechaProgramada)}
                        </p>
                      </div>

                      <div className="info-tile">
                        <p className="text-faint text-xs">Tipo de carga</p>
                        <p className="text-main font-semibold">
                          {(orden.tipoCarga || "-").replace("_", " ")}
                        </p>
                      </div>

                      {orden.tipoCarga === "CONTENEDOR" && (
                        <div className="info-tile">
                          <p className="text-faint text-xs">Contenedor</p>
                          <p className="text-main font-semibold">
                            {orden.numeroContenedor || "-"}
                          </p>
                          <p className="text-faint text-xs">
                            Vence: {formatearFecha(orden.fechaVencimientoDevolucion)}
                          </p>
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

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="info-tile">
                          <p className="text-faint text-xs">Remitente</p>
                          <p className="text-main font-semibold">
                            {orden.remitente?.razonSocial || "-"}
                          </p>
                          <p className="text-faint text-xs">
                            {orden.remitente?.numeroDocumento || ""}
                          </p>
                        </div>

                        <div className="info-tile">
                          <p className="text-faint text-xs">
                            Destinatario
                          </p>
                          <p className="text-main font-semibold">
                            {orden.destinatario?.razonSocial || "-"}
                          </p>
                          <p className="text-faint text-xs">
                            {orden.destinatario?.numeroDocumento || ""}
                          </p>
                        </div>
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

                    <div className="mt-4 border-t pt-4">
                      <AccionesOrden orden={orden} mobile />
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="data-table-wrap">
              <div className="overflow-x-auto">
                <table className="data-table w-full min-w-[1200px] text-sm">
                  <thead>
                    <tr>
                      <th className="px-4 py-4 text-left">N° Orden</th>
                      <th className="px-4 py-4 text-left">Fecha</th>
                      <th className="px-4 py-4 text-left">Tipo carga</th>
                      <th className="px-4 py-4 text-left">Contenedor</th>
                      <th className="px-4 py-4 text-left">Cliente</th>
                      <th className="px-4 py-4 text-left">Remitente</th>
                      <th className="px-4 py-4 text-left">Destinatario</th>
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

                          <td className="text-muted whitespace-nowrap px-4 py-4">
                            {(orden.tipoCarga || "-").replace("_", " ")}
                          </td>

                          <td className="text-muted whitespace-nowrap px-4 py-4">
                            {orden.tipoCarga === "CONTENEDOR" ? (
                              <>
                                <p className="text-main font-semibold">
                                  {orden.numeroContenedor || "-"}
                                </p>
                                <p className="text-faint text-xs">
                                  Vence:{" "}
                                  {formatearFecha(
                                    orden.fechaVencimientoDevolucion
                                  )}
                                </p>
                              </>
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

                          <td className="min-w-[190px] px-4 py-4">
                            <p className="text-main max-w-[230px] truncate font-semibold">
                              {orden.remitente?.razonSocial || "-"}
                            </p>
                            <p className="text-faint text-xs">
                              {orden.remitente?.numeroDocumento || ""}
                            </p>
                          </td>

                          <td className="min-w-[190px] px-4 py-4">
                            <p className="text-main max-w-[230px] truncate font-semibold">
                              {orden.destinatario?.razonSocial || "-"}
                            </p>
                            <p className="text-faint text-xs">
                              {orden.destinatario?.numeroDocumento || ""}
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
