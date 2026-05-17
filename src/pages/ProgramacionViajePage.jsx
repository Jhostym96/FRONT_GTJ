import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useProgramacionViaje } from "../context/ProgramacionViajeContext";
import { useUnidades } from "../context/UnidadContext";
import { useConductores } from "../context/ConductorContext";

import ProgramacionViajeModal from "../components/modals/ProgramacionViajeModal";

const ProgramacionViajePage = () => {
  const {
    programaciones = [],
    getProgramacionesViaje,
    obtenerProgramacionesViaje,
    cambiarEstadoProgramacion,
  } = useProgramacionViaje();

  const { obtenerUnidades } = useUnidades();
  const { obtenerConductores, getConductores } = useConductores();

  const [openModal, setOpenModal] = useState(false);
  const [viajeSeleccionado, setViajeSeleccionado] = useState(null);
  const [modalMode, setModalMode] = useState("create");
  const [cambiandoEstado, setCambiandoEstado] = useState({});

  const getId = (item) => item?.id ?? item?._id ?? "";

  useEffect(() => {
    const cargarDatos = async () => {
      if (getProgramacionesViaje) {
        await getProgramacionesViaje();
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
  }, []);

  const total = useMemo(() => {
    return Array.isArray(programaciones) ? programaciones.length : 0;
  }, [programaciones]);

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

  const getEstadoStyle = (estado) => {
    switch (estado) {
      case "PENDIENTE":
        return "bg-yellow-500/10 text-yellow-300 border-yellow-500/30";

      case "ASIGNADO":
        return "bg-blue-500/10 text-blue-300 border-blue-500/30";

      case "EN_RUTA":
        return "bg-purple-500/10 text-purple-300 border-purple-500/30";

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

  const recargarProgramaciones = async () => {
    if (getProgramacionesViaje) {
      await getProgramacionesViaje();
    } else if (obtenerProgramacionesViaje) {
      await obtenerProgramacionesViaje();
    }
  };

  const handleCambiarEstado = async (viaje, nuevoEstado) => {
    const viajeId = getId(viaje);

    if (!viajeId) {
      toast.error("ID de programación no válido");
      return;
    }

    const mensajeConfirmacion =
      nuevoEstado === "FINALIZADO"
        ? "¿Seguro que deseas finalizar este servicio? La unidad quedará disponible para otro viaje."
        : nuevoEstado === "EN_RUTA"
        ? "¿Seguro que deseas marcar este servicio como EN RUTA?"
        : nuevoEstado === "ANULADO"
        ? "¿Seguro que deseas anular esta programación?"
        : `¿Seguro que deseas cambiar el estado a ${nuevoEstado}?`;

    const confirmar = window.confirm(mensajeConfirmacion);

    if (!confirmar) return;

    try {
      setCambiandoEstado((prev) => ({
        ...prev,
        [viajeId]: true,
      }));

      await cambiarEstadoProgramacion(viajeId, nuevoEstado);

      await recargarProgramaciones();

      toast.success(`Programación actualizada a ${nuevoEstado}`);
    } catch (error) {
      console.error("Error al cambiar estado:", error);

      toast.error(
        error?.response?.data?.message ||
          "Error al cambiar el estado de la programación"
      );
    } finally {
      setCambiandoEstado((prev) => ({
        ...prev,
        [viajeId]: false,
      }));
    }
  };

  const puedeMarcarEnRuta = (estado) => {
    return ["PENDIENTE", "ASIGNADO"].includes(estado);
  };

  const puedeFinalizar = (estado) => {
    return ["PENDIENTE", "ASIGNADO", "EN_RUTA"].includes(estado);
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
          mobile ? "w-full flex-col sm:flex-row" : "justify-start"
        } flex-wrap gap-2`}
      >
        <button
          type="button"
          onClick={() => abrirVer(viaje)}
          className="btn-secondary px-3 py-2 text-xs"
        >
          Ver
        </button>

        {puedeMarcarEnRuta(viaje.estado) && (
          <button
            type="button"
            disabled={cambiandoEstado[viajeId]}
            onClick={() => handleCambiarEstado(viaje, "EN_RUTA")}
            className="btn-primary bg-purple-600 px-3 py-2 text-xs hover:bg-purple-500"
          >
            En ruta
          </button>
        )}

        {puedeFinalizar(viaje.estado) && (
          <button
            type="button"
            disabled={cambiandoEstado[viajeId]}
            onClick={() => handleCambiarEstado(viaje, "FINALIZADO")}
            className="btn-success px-3 py-2 text-xs"
          >
            Finalizar
          </button>
        )}

        {puedeAnular(viaje.estado) && (
          <button
            type="button"
            disabled={cambiandoEstado[viajeId]}
            onClick={() => handleCambiarEstado(viaje, "ANULADO")}
            className="btn-danger px-3 py-2 text-xs"
          >
            Anular
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

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="info-tile border px-4 py-3">
                <p className="text-faint text-xs">Total programaciones</p>
                <p className="text-main text-xl font-bold">{total}</p>
              </div>

              <button
                type="button"
                onClick={abrirCrear}
                className="btn-primary px-5 py-3"
              >
                Nueva programación
              </button>
            </div>
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
              className="btn-primary mt-5 px-5 py-3"
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
                    </div>

                    <div className="mt-4 border-t pt-4">
                      <AccionesViaje viaje={viaje} mobile />
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
                      <th className="px-4 py-4 text-left">Tracto</th>
                      <th className="px-4 py-4 text-left">Carreta</th>
                      <th className="px-4 py-4 text-left">Conductor</th>
                      <th className="px-4 py-4 text-left">Fecha Inicio</th>
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
          </>
        )}

        <ProgramacionViajeModal
          isOpen={openModal}
          open={openModal}
          onClose={cerrarModal}
          mode={modalMode}
          data={viajeSeleccionado}
        />
      </div>
    </div>
  );
};

export default ProgramacionViajePage;
