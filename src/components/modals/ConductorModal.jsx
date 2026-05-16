import { useEffect, useState } from "react";

const initialForm = {
  tipoDocumento: "1",
  numeroDocumento: "",
  nombres: "",
  apellidos: "",
  numeroLicencia: "",
  telefono: "",
  estado: "ACTIVO",
  observaciones: "",
};

function ConductorModal({
  open,
  onClose,
  mode = "create",
  data = null,
  onSubmit,
  errors = [],
}) {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (mode === "edit" && data) {
      setForm({
        tipoDocumento: data.tipoDocumento || "1",
        numeroDocumento: data.numeroDocumento || "",
        nombres: data.nombres || "",
        apellidos: data.apellidos || "",
        numeroLicencia: data.numeroLicencia || "",
        telefono: data.telefono || "",
        estado: data.estado || "ACTIVO",
        observaciones: data.observaciones || "",
      });
    } else {
      setForm(initialForm);
    }
  }, [open, mode, data]);

  if (!open) return null;

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    const data = {
      tipoDocumento: form.tipoDocumento || "1",
      numeroDocumento: form.numeroDocumento.trim(),
      nombres: form.nombres.trim().toUpperCase(),
      apellidos: form.apellidos.trim().toUpperCase(),
      numeroLicencia: form.numeroLicencia.trim().toUpperCase(),
      telefono: form.telefono.trim(),
      estado: form.estado || "ACTIVO",
      observaciones: form.observaciones.trim(),
    };

    try {
      setLoading(true);
      await onSubmit(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-3xl p-6 text-white">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h2 className="text-xl font-bold">
              {mode === "create" ? "Nuevo conductor" : "Editar conductor"}
            </h2>
            <p className="text-sm text-gray-400">
              Complete los datos del conductor.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-white text-xl"
          >
            ×
          </button>
        </div>

        {errors.length > 0 && (
          <div className="mb-4 bg-red-600/20 border border-red-500 text-red-300 p-3 rounded-lg text-sm">
            {errors.map((error, index) => (
              <p key={index}>{error}</p>
            ))}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <select
            name="tipoDocumento"
            value={form.tipoDocumento}
            onChange={handleChange}
            className="bg-gray-800 border border-gray-700 rounded-lg p-3 outline-none"
            required
          >
            <option value="1">DNI</option>
            <option value="4">Carnet de extranjería</option>
            <option value="6">RUC</option>
            <option value="7">Pasaporte</option>
            <option value="A">Cédula diplomática</option>
            <option value="0">Otro</option>
          </select>

          <input
            name="numeroDocumento"
            value={form.numeroDocumento}
            onChange={handleChange}
            placeholder="Número de documento"
            className="bg-gray-800 border border-gray-700 rounded-lg p-3 outline-none"
            required
          />

          <input
            name="nombres"
            value={form.nombres}
            onChange={handleChange}
            placeholder="Nombres"
            className="bg-gray-800 border border-gray-700 rounded-lg p-3 outline-none"
            required
          />

          <input
            name="apellidos"
            value={form.apellidos}
            onChange={handleChange}
            placeholder="Apellidos"
            className="bg-gray-800 border border-gray-700 rounded-lg p-3 outline-none"
            required
          />

          <input
            name="numeroLicencia"
            value={form.numeroLicencia}
            onChange={handleChange}
            placeholder="Número de licencia"
            className="bg-gray-800 border border-gray-700 rounded-lg p-3 outline-none"
            required
          />

          <input
            name="telefono"
            value={form.telefono}
            onChange={handleChange}
            placeholder="Teléfono"
            className="bg-gray-800 border border-gray-700 rounded-lg p-3 outline-none"
          />

          <select
            name="estado"
            value={form.estado}
            onChange={handleChange}
            className="bg-gray-800 border border-gray-700 rounded-lg p-3 outline-none"
          >
            <option value="ACTIVO">ACTIVO</option>
            <option value="INACTIVO">INACTIVO</option>
          </select>

          <textarea
            name="observaciones"
            value={form.observaciones}
            onChange={handleChange}
            placeholder="Observaciones"
            className="md:col-span-2 bg-gray-800 border border-gray-700 rounded-lg p-3 outline-none resize-none"
            rows="3"
          />

          <div className="md:col-span-2 flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Guardando..."
                : mode === "create"
                ? "Guardar conductor"
                : "Actualizar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ConductorModal;
