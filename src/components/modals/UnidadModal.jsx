import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const initialForm = {
  placa: "",
  tipoUnidad: "",
  numeroTUCE_CHV: "",
  marca: "",
  modelo: "",
  estado: "ACTIVO",
  observaciones: "",
};

function UnidadModal({
  isOpen,
  onClose,
  onSubmit,
  mode = "create",
  unidad = null,
}) {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);

  const isView = mode === "view";
  const isEdit = mode === "edit";

  useEffect(() => {
    if (!isOpen) return;

    if ((isEdit || isView) && unidad) {
      setForm({
        placa: unidad.placa || "",
        tipoUnidad: unidad.tipoUnidad || "",
        numeroTUCE_CHV: unidad.numeroTUCE_CHV || "",
        marca: unidad.marca || "",
        modelo: unidad.modelo || "",
        estado: unidad.estado || "ACTIVO",
        observaciones: unidad.observaciones || "",
      });
    } else {
      setForm(initialForm);
    }
  }, [isOpen, mode, unidad, isEdit, isView]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isView || loading) return;

    const tipoUnidadNormalizado = form.tipoUnidad.trim().toUpperCase();
    const estadoNormalizado = form.estado.trim().toUpperCase();

    if (!form.placa.trim()) {
      toast.error("La placa es obligatoria");
      return;
    }

    if (!["TRACTO", "CARRETA"].includes(tipoUnidadNormalizado)) {
      toast.error("Selecciona un tipo de unidad válido");
      return;
    }

    if (!["ACTIVO", "INACTIVO"].includes(estadoNormalizado)) {
      toast.error("Selecciona un estado válido");
      return;
    }

    const data = {
      placa: form.placa.trim().toUpperCase(),
      tipoUnidad: tipoUnidadNormalizado,
      numeroTUCE_CHV: form.numeroTUCE_CHV.trim().toUpperCase(),
      marca: form.marca.trim().toUpperCase(),
      modelo: form.modelo.trim().toUpperCase(),
      estado: estadoNormalizado,
      observaciones: form.observaciones.trim(),
    };

    try {
      setLoading(true);
      await onSubmit(data);
    } finally {
      setLoading(false);
    }
  };

  const titulo = {
    create: "Nueva unidad",
    edit: "Editar unidad",
    view: "Detalle de unidad",
  }[mode];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-2xl rounded-xl border border-gray-700 bg-gray-900 p-6 text-white shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">{titulo}</h2>
            <p className="text-sm text-gray-400">
              Registra tractos y carretas con su N° TUCE / CHV.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-2xl text-gray-400 hover:text-white"
          >
            ×
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          <div>
            <label className="mb-1 block text-sm text-gray-300">Placa</label>
            <input
              name="placa"
              value={form.placa}
              onChange={handleChange}
              disabled={isView || loading}
              required
              className="w-full rounded-lg border border-gray-700 bg-gray-800 p-3 uppercase outline-none disabled:opacity-70"
              placeholder="ABC-123"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-300">
              Tipo unidad
            </label>
            <select
              name="tipoUnidad"
              value={form.tipoUnidad}
              onChange={handleChange}
              disabled={isView || loading}
              required
              className="w-full rounded-lg border border-gray-700 bg-gray-800 p-3 outline-none disabled:opacity-70"
            >
              <option value="">Seleccione tipo</option>
              <option value="TRACTO">TRACTO</option>
              <option value="CARRETA">CARRETA</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-300">
              N° TUCE / CHV
            </label>
            <input
              name="numeroTUCE_CHV"
              value={form.numeroTUCE_CHV}
              onChange={handleChange}
              disabled={isView || loading}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 p-3 uppercase outline-none disabled:opacity-70"
              placeholder="Tarjeta circulación / CHV"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-300">Marca</label>
            <input
              name="marca"
              value={form.marca}
              onChange={handleChange}
              disabled={isView || loading}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 p-3 uppercase outline-none disabled:opacity-70"
              placeholder="VOLVO"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-300">Modelo</label>
            <input
              name="modelo"
              value={form.modelo}
              onChange={handleChange}
              disabled={isView || loading}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 p-3 uppercase outline-none disabled:opacity-70"
              placeholder="FH"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-300">Estado</label>
            <select
              name="estado"
              value={form.estado}
              onChange={handleChange}
              disabled={isView || loading}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 p-3 outline-none disabled:opacity-70"
            >
              <option value="ACTIVO">ACTIVO</option>
              <option value="INACTIVO">INACTIVO</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm text-gray-300">
              Observaciones
            </label>
            <textarea
              name="observaciones"
              value={form.observaciones}
              onChange={handleChange}
              disabled={isView || loading}
              rows="3"
              className="w-full resize-none rounded-lg border border-gray-700 bg-gray-800 p-3 outline-none disabled:opacity-70"
              placeholder="Observaciones"
            />
          </div>

          <div className="mt-4 flex justify-end gap-3 md:col-span-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg bg-gray-700 px-4 py-2 hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isView ? "Cerrar" : "Cancelar"}
            </button>

            {!isView && (
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-green-600 px-4 py-2 font-semibold hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Guardando..."
                  : isEdit
                  ? "Actualizar"
                  : "Guardar"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default UnidadModal;
