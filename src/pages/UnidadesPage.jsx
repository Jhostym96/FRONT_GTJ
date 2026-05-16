import { useEffect, useState } from "react";
import { useUnidades } from "../context/UnidadContext";
import UnidadModal from "../components/modals/UnidadModal";

function UnidadesPage() {
  const {
    unidades = [],
    obtenerUnidades,
    crearUnidad,
    actualizarUnidad,
    eliminarUnidad,
  } = useUnidades();

  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState("create");
  const [unidadSeleccionada, setUnidadSeleccionada] = useState(null);

  useEffect(() => {
    obtenerUnidades?.();
  }, []);

  const abrirCrear = () => {
    setMode("create");
    setUnidadSeleccionada(null);
    setModalOpen(true);
  };

  const abrirEditar = (unidad) => {
    setMode("edit");
    setUnidadSeleccionada(unidad);
    setModalOpen(true);
  };

  const abrirVer = (unidad) => {
    setMode("view");
    setUnidadSeleccionada(unidad);
    setModalOpen(true);
  };

  const cerrarModal = () => {
    setModalOpen(false);
    setUnidadSeleccionada(null);
  };

  const handleSubmit = async (data) => {
    if (mode === "edit" && unidadSeleccionada?.id) {
      await actualizarUnidad(unidadSeleccionada.id, data);
    } else {
      await crearUnidad(data);
    }

    await obtenerUnidades?.();
    cerrarModal();
  };

  const handleEliminar = async (id) => {
    const confirmar = confirm("¿Seguro que deseas eliminar esta unidad?");
    if (!confirmar) return;

    await eliminarUnidad(id);
    await obtenerUnidades?.();
  };

  return (
    <div className="min-h-screen bg-gray-950 p-6 text-white">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">Unidades</h1>
          <p className="text-sm text-gray-400">
            Gestión de tractos y carretas.
          </p>
        </div>

        <button
          onClick={abrirCrear}
          className="rounded-lg bg-green-600 px-4 py-2 font-semibold hover:bg-green-700"
        >
          + Nueva unidad
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-gray-800 text-gray-300">
            <tr>
              <th className="p-3">Placa</th>
              <th className="p-3">Tipo</th>
              <th className="p-3">Marca</th>
              <th className="p-3">Modelo</th>
              <th className="p-3">Estado</th>
              <th className="p-3 text-right">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {unidades.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-6 text-center text-gray-400">
                  No hay unidades registradas.
                </td>
              </tr>
            ) : (
              unidades.map((unidad) => (
                <tr
                  key={unidad.id}
                  className="border-t border-gray-800 hover:bg-gray-800/60"
                >
                  <td className="p-3 font-semibold">{unidad.placa}</td>
                  <td className="p-3">{unidad.tipoUnidad}</td>
                  <td className="p-3">{unidad.marca || "-"}</td>
                  <td className="p-3">{unidad.modelo || "-"}</td>
                  <td className="p-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        unidad.estado === "ACTIVO"
                          ? "bg-green-500/10 text-green-400"
                          : "bg-red-500/10 text-red-400"
                      }`}
                    >
                      {unidad.estado}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => abrirVer(unidad)}
                        className="rounded bg-gray-700 px-3 py-1 hover:bg-gray-600"
                      >
                        Ver
                      </button>

                      <button
                        onClick={() => abrirEditar(unidad)}
                        className="rounded bg-blue-600 px-3 py-1 hover:bg-blue-700"
                      >
                        Editar
                      </button>

                      <button
                        onClick={() => handleEliminar(unidad.id)}
                        className="rounded bg-red-600 px-3 py-1 hover:bg-red-700"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <UnidadModal
        isOpen={modalOpen}
        onClose={cerrarModal}
        onSubmit={handleSubmit}
        mode={mode}
        unidad={unidadSeleccionada}
      />
    </div>
  );
}

export default UnidadesPage;