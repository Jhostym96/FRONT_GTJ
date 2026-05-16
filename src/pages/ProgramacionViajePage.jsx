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
        return "bg-neutral-700/40 text-neutral-300 border-neutral-600";
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

  return (
    <div className="p-6 text-white">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Programación de Viajes</h1>

          <p className="text-sm text-zinc-400">
            Total de programaciones: {total}
          </p>
        </div>

        <button
          type="button"
          onClick={abrirCrear}
          className="rounded-lg bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700"
        >
          + Nueva Programación
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
        <table className="w-full text-sm">
          <thead className="bg-zinc-800 text-zinc-300">
            <tr>
              <th className="p-3 text-left">Orden</th>
              <th className="p-3 text-left">Tracto</th>
              <th className="p-3 text-left">Carreta</th>
              <th className="p-3 text-left">Conductor</th>
              <th className="p-3 text-left">Fecha Inicio</th>
              <th className="p-3 text-left">Estado</th>
              <th className="p-3 text-left">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {listaProgramaciones.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-6 text-center text-zinc-400">
                  No hay programaciones registradas
                </td>
              </tr>
            ) : (
              listaProgramaciones.map((viaje) => {
                const viajeId = getId(viaje);

                return (
                  <tr
                    key={viajeId}
                    className="border-b border-zinc-800 hover:bg-zinc-800/60"
                  >
                    <td className="p-3">
                      {viaje.ordenServicio?.numeroOrden || "-"}
                    </td>

                    <td className="p-3">
                      {viaje.vehiculoPrincipal?.placa || "-"}
                    </td>

                    <td className="p-3">
                      {viaje.vehiculoSecundario?.placa || "-"}
                    </td>

                    <td className="p-3">
                      {obtenerNombreConductor(viaje.conductor)}
                    </td>

                    <td className="p-3">
                      {formatearFecha(viaje.fechaInicioTraslado)}
                    </td>

                    <td className="p-3">
                      <span
                        className={`rounded border px-2 py-1 text-xs font-semibold ${getEstadoStyle(
                          viaje.estado
                        )}`}
                      >
                        {viaje.estado || "-"}
                      </span>
                    </td>

                    <td className="p-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => abrirVer(viaje)}
                          className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-500"
                        >
                          Ver
                        </button>

                        {puedeMarcarEnRuta(viaje.estado) && (
                          <button
                            type="button"
                            disabled={cambiandoEstado[viajeId]}
                            onClick={() =>
                              handleCambiarEstado(viaje, "EN_RUTA")
                            }
                            className="rounded-lg bg-purple-600 px-3 py-2 text-xs font-semibold text-white hover:bg-purple-500 disabled:cursor-not-allowed disabled:bg-zinc-700"
                          >
                            En ruta
                          </button>
                        )}

                        {puedeFinalizar(viaje.estado) && (
                          <button
                            type="button"
                            disabled={cambiandoEstado[viajeId]}
                            onClick={() =>
                              handleCambiarEstado(viaje, "FINALIZADO")
                            }
                            className="rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-500 disabled:cursor-not-allowed disabled:bg-zinc-700"
                          >
                            Finalizar
                          </button>
                        )}

                        {puedeAnular(viaje.estado) && (
                          <button
                            type="button"
                            disabled={cambiandoEstado[viajeId]}
                            onClick={() =>
                              handleCambiarEstado(viaje, "ANULADO")
                            }
                            className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-zinc-700"
                          >
                            Anular
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <ProgramacionViajeModal
        isOpen={openModal}
        open={openModal}
        onClose={cerrarModal}
        mode={modalMode}
        data={viajeSeleccionado}
      />
    </div>
  );
};

export default ProgramacionViajePage;