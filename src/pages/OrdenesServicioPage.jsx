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
        return "bg-neutral-700/40 text-neutral-300 border-neutral-600";
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
          className="rounded-lg bg-neutral-700/80 px-3 py-2 text-xs font-semibold text-neutral-100 transition hover:bg-neutral-600"
        >
          Ver
        </button>

        <button
          type="button"
          onClick={() => abrirEditar(orden)}
          disabled={orden.estado === "ANULADA"}
          className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-neutral-700 disabled:text-neutral-400"
        >
          Editar
        </button>

        {orden.estado !== "ANULADA" && (
          <button
            type="button"
            onClick={() => handleAnular(ordenId)}
            disabled={anulando[ordenId]}
            className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-neutral-700 disabled:text-neutral-400"
          >
            {anulando[ordenId] ? "Anulando..." : "Anular"}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="w-full px-2 py-4 text-text-primary sm:px-4 lg:px-4">
      <div className="mx-auto flex w-full max-w-[98%] flex-col gap-5">
        <header className="overflow-hidden rounded-2xl border border-neutral-800 bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 shadow-xl">
          <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 inline-flex rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300">
                Gestión de transporte
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-gray-100 sm:text-3xl">
                Órdenes de Servicio
              </h1>

              <p className="mt-1 max-w-2xl text-sm text-neutral-400">
                Visualiza, registra y administra las órdenes de servicio para
                transporte.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="rounded-xl border border-neutral-800 bg-neutral-950/50 px-4 py-3">
                <p className="text-xs text-neutral-500">Total órdenes</p>
                <p className="text-xl font-bold text-gray-100">
                  {totalOrdenes}
                </p>
              </div>

              <button
                type="button"
                onClick={abrirCrear}
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-950/30 transition hover:bg-blue-500 active:scale-[0.98]"
              >
                Nueva orden
              </button>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="rounded-2xl border border-neutral-800 bg-surface p-8 text-center shadow-lg">
            <div className="mx-auto mb-3 h-9 w-9 animate-spin rounded-full border-2 border-neutral-700 border-t-blue-500" />
            <p className="text-sm text-neutral-400">
              Cargando órdenes de servicio...
            </p>
          </div>
        ) : ordenes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-700 bg-surface p-8 text-center shadow-lg">
            <h2 className="text-lg font-semibold text-gray-200">
              No hay órdenes registradas
            </h2>

            <p className="mt-1 text-sm text-neutral-400">
              Crea tu primera orden de servicio para empezar.
            </p>

            <button
              type="button"
              onClick={abrirCrear}
              className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-500"
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
                    className="rounded-2xl border border-neutral-800 bg-surface p-4 shadow-lg"
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-medium text-neutral-500">
                          N° Orden
                        </p>
                        <h2 className="text-lg font-bold text-gray-100">
                          {orden.numeroOrden || "-"}
                        </h2>
                      </div>

                      <EstadoBadge estado={orden.estado} />
                    </div>

                    <div className="grid gap-3 text-sm">
                      <div className="rounded-xl bg-neutral-900/60 p-3">
                        <p className="text-xs text-neutral-500">Fecha</p>
                        <p className="font-semibold text-neutral-200">
                          {formatearFecha(orden.fechaProgramada)}
                        </p>
                      </div>

                      <div className="rounded-xl bg-neutral-900/60 p-3">
                        <p className="text-xs text-neutral-500">Cliente</p>
                        <p className="font-semibold text-gray-200">
                          {orden.clienteSolicitante?.razonSocial || "-"}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {orden.clienteSolicitante?.numeroDocumento || ""}
                        </p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl bg-neutral-900/60 p-3">
                          <p className="text-xs text-neutral-500">Remitente</p>
                          <p className="font-semibold text-gray-200">
                            {orden.remitente?.razonSocial || "-"}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {orden.remitente?.numeroDocumento || ""}
                          </p>
                        </div>

                        <div className="rounded-xl bg-neutral-900/60 p-3">
                          <p className="text-xs text-neutral-500">
                            Destinatario
                          </p>
                          <p className="font-semibold text-gray-200">
                            {orden.destinatario?.razonSocial || "-"}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {orden.destinatario?.numeroDocumento || ""}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-xl bg-neutral-900/60 p-3">
                        <p className="text-xs text-neutral-500">Ruta</p>
                        <p className="mt-1 text-neutral-300">
                          {orden.partida?.direccion || "-"}
                        </p>
                        <p className="mt-1 text-xs text-neutral-500">
                          → {orden.llegada?.direccion || "-"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 border-t border-neutral-800 pt-4">
                      <AccionesOrden orden={orden} mobile />
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="hidden overflow-hidden rounded-2xl border border-neutral-800 bg-surface shadow-xl lg:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1200px] text-sm">
                  <thead className="bg-neutral-900">
                    <tr className="border-b border-neutral-800 text-xs uppercase tracking-wide text-neutral-400">
                      <th className="px-4 py-4 text-left">N° Orden</th>
                      <th className="px-4 py-4 text-left">Fecha</th>
                      <th className="px-4 py-4 text-left">Cliente</th>
                      <th className="px-4 py-4 text-left">Remitente</th>
                      <th className="px-4 py-4 text-left">Destinatario</th>
                      <th className="px-4 py-4 text-left">Ruta</th>
                      <th className="px-4 py-4 text-center">Estado</th>
                      <th className="px-4 py-4 text-center">Acciones</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-neutral-800">
                    {ordenes.map((orden) => {
                      const ordenId = getItemId(orden);

                      return (
                        <tr
                          key={ordenId}
                          className="bg-neutral-950/20 transition hover:bg-neutral-800/50"
                        >
                          <td className="px-4 py-4">
                            <p className="font-bold text-gray-100">
                              {orden.numeroOrden || "-"}
                            </p>
                          </td>

                          <td className="whitespace-nowrap px-4 py-4 text-neutral-300">
                            {formatearFecha(orden.fechaProgramada)}
                          </td>

                          <td className="min-w-[190px] px-4 py-4">
                            <p className="max-w-[230px] truncate font-semibold text-gray-200">
                              {orden.clienteSolicitante?.razonSocial || "-"}
                            </p>
                            <p className="text-xs text-neutral-500">
                              {orden.clienteSolicitante?.numeroDocumento || ""}
                            </p>
                          </td>

                          <td className="min-w-[190px] px-4 py-4">
                            <p className="max-w-[230px] truncate font-semibold text-gray-200">
                              {orden.remitente?.razonSocial || "-"}
                            </p>
                            <p className="text-xs text-neutral-500">
                              {orden.remitente?.numeroDocumento || ""}
                            </p>
                          </td>

                          <td className="min-w-[190px] px-4 py-4">
                            <p className="max-w-[230px] truncate font-semibold text-gray-200">
                              {orden.destinatario?.razonSocial || "-"}
                            </p>
                            <p className="text-xs text-neutral-500">
                              {orden.destinatario?.numeroDocumento || ""}
                            </p>
                          </td>

                          <td className="min-w-[280px] px-4 py-4">
                            <p className="max-w-[360px] truncate text-neutral-300">
                              {orden.partida?.direccion || "-"}
                            </p>
                            <p className="max-w-[360px] truncate text-xs text-neutral-500">
                              → {orden.llegada?.direccion || "-"}
                            </p>
                          </td>

                          <td className="whitespace-nowrap px-4 py-4 text-center">
                            <EstadoBadge estado={orden.estado} />
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