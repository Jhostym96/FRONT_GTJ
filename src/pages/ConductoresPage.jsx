import { useEffect, useState } from "react";
import { useConductores } from "../context/ConductorContext";
import ConductorModal from "../components/modals/ConductorModal";

function ConductoresPage() {
  const {
    conductores,
    errors,
    obtenerConductores,
    crearConductor,
    actualizarConductor,
    limpiarErrores,
  } = useConductores();

  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState("create");
  const [selectedConductor, setSelectedConductor] = useState(null);
  const [loading, setLoading] = useState(false);

  const cargarConductores = async () => {
    try {
      setLoading(true);
      await obtenerConductores();
    } catch (error) {
      console.error("Error al cargar conductores:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarConductores();
  }, []);

  const abrirCrear = () => {
    limpiarErrores();
    setMode("create");
    setSelectedConductor(null);
    setModalOpen(true);
  };

  const abrirEditar = (conductor) => {
    limpiarErrores();
    setMode("edit");
    setSelectedConductor(conductor);
    setModalOpen(true);
  };

  const cerrarModal = () => {
    limpiarErrores();
    setModalOpen(false);
    setSelectedConductor(null);
  };

  const handleSubmit = async (form) => {
    try {
      if (mode === "create") {
        await crearConductor(form);
      } else {
        await actualizarConductor(selectedConductor.id, form);
      }

      cerrarModal();
    } catch (error) {
      console.error("Error al guardar conductor:", error);
    }
  };

  return (
    <div className="p-6 text-white">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Conductores</h1>
          <p className="text-gray-400 text-sm">
            Registro y mantenimiento de conductores.
          </p>
        </div>

        <button
          onClick={abrirCrear}
          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-semibold"
        >
          Nuevo conductor
        </button>
      </div>

      <div className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-800 text-gray-300">
            <tr>
              <th className="p-3 text-left">Documento</th>
              <th className="p-3 text-left">Conductor</th>
              <th className="p-3 text-left">Licencia</th>
              <th className="p-3 text-left">Teléfono</th>
              <th className="p-3 text-left">Estado</th>
              <th className="p-3 text-right">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="p-6 text-center text-gray-400">
                  Cargando conductores...
                </td>
              </tr>
            ) : conductores.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-6 text-center text-gray-400">
                  No hay conductores registrados.
                </td>
              </tr>
            ) : (
              conductores.map((conductor) => (
                <tr
                  key={conductor.id}
                  className="border-t border-gray-800 hover:bg-gray-800/60"
                >
                  <td className="p-3">{conductor.numeroDocumento}</td>

                  <td className="p-3">
                    {conductor.nombres} {conductor.apellidos}
                  </td>

                  <td className="p-3">{conductor.numeroLicencia}</td>

                  <td className="p-3">{conductor.telefono || "-"}</td>

                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        conductor.estado === "ACTIVO"
                          ? "bg-green-600/20 text-green-400"
                          : "bg-red-600/20 text-red-400"
                      }`}
                    >
                      {conductor.estado}
                    </span>
                  </td>

                  <td className="p-3 text-right">
                    <button
                      onClick={() => abrirEditar(conductor)}
                      className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ConductorModal
        open={modalOpen}
        onClose={cerrarModal}
        mode={mode}
        data={selectedConductor}
        onSubmit={handleSubmit}
        errors={errors}
      />
    </div>
  );
}

export default ConductoresPage;