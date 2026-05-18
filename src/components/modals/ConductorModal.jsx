import { useEffect, useState } from "react";

const initialForm = {
  tipoDocumento: "1",
  numeroDocumento: "",
  nombres: "",
  apellidos: "",
  numeroLicencia: "",
  telefono: "",
  estado: "ACTIVO",
  permisoIMO: false,
  permisoIQBF: false,
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
        permisoIMO: Boolean(data.permisoIMO),
        permisoIQBF: Boolean(data.permisoIQBF),
        observaciones: data.observaciones || "",
      });
    } else {
      setForm(initialForm);
    }
  }, [open, mode, data]);

  if (!open) return null;

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;

    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
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
      permisoIMO: form.permisoIMO,
      permisoIQBF: form.permisoIQBF,
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
    <div className="modal-backdrop">
      <div className="modal-panel max-w-3xl">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h2 className="text-xl font-bold">
              {mode === "create" ? "Nuevo conductor" : "Editar conductor"}
            </h2>
            <p className="text-muted text-sm">
              Complete los datos del conductor.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="text-muted text-xl hover:text-blue-500"
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
          <div>
            <label className="text-muted mb-1 block text-sm">
              Tipo de documento
            </label>
            <select
              name="tipoDocumento"
              value={form.tipoDocumento}
              onChange={handleChange}
              className="input p-3"
              required
            >
              <option value="1">DNI</option>
              <option value="4">Carnet de extranjería</option>
              <option value="6">RUC</option>
              <option value="7">Pasaporte</option>
              <option value="A">Cédula diplomática</option>
              <option value="0">Otro</option>
            </select>
          </div>

          <div>
            <label className="text-muted mb-1 block text-sm">
              Número de documento
            </label>
            <input
              name="numeroDocumento"
              value={form.numeroDocumento}
              onChange={handleChange}
              placeholder="Ingrese el número de documento"
              className="input p-3"
              required
            />
          </div>

          <div>
            <label className="text-muted mb-1 block text-sm">Nombres</label>
            <input
              name="nombres"
              value={form.nombres}
              onChange={handleChange}
              placeholder="Ingrese los nombres del conductor"
              className="input p-3"
              required
            />
          </div>

          <div>
            <label className="text-muted mb-1 block text-sm">Apellidos</label>
            <input
              name="apellidos"
              value={form.apellidos}
              onChange={handleChange}
              placeholder="Ingrese los apellidos del conductor"
              className="input p-3"
              required
            />
          </div>

          <div>
            <label className="text-muted mb-1 block text-sm">
              Número de licencia
            </label>
            <input
              name="numeroLicencia"
              value={form.numeroLicencia}
              onChange={handleChange}
              placeholder="Ingrese el número de licencia"
              className="input p-3"
              required
            />
          </div>

          <div>
            <label className="text-muted mb-1 block text-sm">Teléfono</label>
            <input
              name="telefono"
              value={form.telefono}
              onChange={handleChange}
              placeholder="Ingrese el teléfono de contacto"
              className="input p-3"
            />
          </div>

          <div>
            <label className="text-muted mb-1 block text-sm">Estado</label>
            <select
              name="estado"
              value={form.estado}
              onChange={handleChange}
              className="input p-3"
            >
              <option value="ACTIVO">ACTIVO</option>
              <option value="INACTIVO">INACTIVO</option>
            </select>
          </div>

          <div className="md:col-span-2 grid gap-3 rounded-lg border border-[var(--app-border)] p-3 sm:grid-cols-2">
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                name="permisoIMO"
                checked={form.permisoIMO}
                onChange={handleChange}
                className="h-4 w-4"
              />
              <span className="text-main font-semibold">Permiso IMO</span>
            </label>

            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                name="permisoIQBF"
                checked={form.permisoIQBF}
                onChange={handleChange}
                className="h-4 w-4"
              />
              <span className="text-main font-semibold">Permiso IQBF</span>
            </label>
          </div>

          <div className="md:col-span-2">
            <label className="text-muted mb-1 block text-sm">
              Observaciones
            </label>
            <textarea
              name="observaciones"
              value={form.observaciones}
              onChange={handleChange}
              placeholder="Indique observaciones del conductor"
              className="input resize-none p-3"
              rows="3"
            />
          </div>

          <div className="md:col-span-2 flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn-secondary px-4 py-2"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading}
              className="btn-success px-4 py-2"
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
