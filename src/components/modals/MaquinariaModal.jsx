import { useEffect, useState } from "react";
import { notify } from "../../utils/notify";

const tiposMaquinaria = [
  "STACKER",
  "MONTACARGA",
  "GRUA",
  "GENERADOR",
  "COMPRESORA",
  "OTRO",
];

const estadosMaquinaria = [
  "OPERATIVA",
  "EN_MANTENIMIENTO",
  "INACTIVA",
  "BAJA",
];

const initialForm = {
  codigo: "",
  nombre: "",
  tipo: "MONTACARGA",
  marca: "",
  modelo: "",
  serie: "",
  anio: "",
  estado: "OPERATIVA",
  ubicacion: "",
  horometroActual: "0",
  kilometrajeActual: "0",
  observaciones: "",
};

function MaquinariaModal({
  isOpen,
  onClose,
  onSubmit,
  mode = "create",
  maquinaria = null,
}) {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);

  const isView = mode === "view";
  const isEdit = mode === "edit";

  useEffect(() => {
    if (!isOpen) return;

    if ((isEdit || isView) && maquinaria) {
      setForm({
        codigo: maquinaria.codigo || "",
        nombre: maquinaria.nombre || "",
        tipo: maquinaria.tipo || "MONTACARGA",
        marca: maquinaria.marca || "",
        modelo: maquinaria.modelo || "",
        serie: maquinaria.serie || "",
        anio: maquinaria.anio ? String(maquinaria.anio) : "",
        estado: maquinaria.estado || "OPERATIVA",
        ubicacion: maquinaria.ubicacion || "",
        horometroActual: String(maquinaria.horometroActual ?? "0"),
        kilometrajeActual: String(maquinaria.kilometrajeActual ?? "0"),
        observaciones: maquinaria.observaciones || "",
      });
    } else {
      setForm(initialForm);
    }
  }, [isOpen, isEdit, isView, maquinaria]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isView || loading) return;

    const tipo = form.tipo.trim().toUpperCase();
    const estado = form.estado.trim().toUpperCase();
    const anio = form.anio ? Number(form.anio) : null;
    const horometroActual = Number(form.horometroActual || 0);
    const kilometrajeActual = Number(form.kilometrajeActual || 0);

    if (!form.codigo.trim() || !form.nombre.trim()) {
      notify.error("Código y nombre son obligatorios");
      return;
    }

    if (!tiposMaquinaria.includes(tipo)) {
      notify.error("Selecciona un tipo de maquinaria válido");
      return;
    }

    if (!estadosMaquinaria.includes(estado)) {
      notify.error("Selecciona un estado válido");
      return;
    }

    if (form.anio && (!Number.isInteger(anio) || anio < 1900)) {
      notify.error("Ingresa un año válido");
      return;
    }

    if (horometroActual < 0 || kilometrajeActual < 0) {
      notify.error("Horómetro y kilometraje no pueden ser negativos");
      return;
    }

    const data = {
      codigo: form.codigo.trim().toUpperCase(),
      nombre: form.nombre.trim().toUpperCase(),
      tipo,
      marca: form.marca.trim().toUpperCase(),
      modelo: form.modelo.trim().toUpperCase(),
      serie: form.serie.trim().toUpperCase(),
      anio,
      estado,
      ubicacion: form.ubicacion.trim().toUpperCase(),
      horometroActual,
      kilometrajeActual,
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
    create: "Nueva maquinaria",
    edit: "Editar maquinaria",
    view: "Detalle de maquinaria",
  }[mode];

  return (
    <div className="modal-backdrop">
      <div className="modal-panel max-w-4xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">{titulo}</h2>
            <p className="text-muted text-sm">
              Registra equipos operativos para almacén y mantenimiento.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-muted text-2xl hover:text-blue-500"
          >
            ×
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          <div>
            <label className="text-muted mb-1 block text-sm">Código</label>
            <input
              name="codigo"
              value={form.codigo}
              onChange={handleChange}
              disabled={isView || loading}
              required
              className="input p-3 uppercase"
              placeholder="Ej. MQ-001"
            />
          </div>

          <div>
            <label className="text-muted mb-1 block text-sm">Nombre</label>
            <input
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              disabled={isView || loading}
              required
              className="input p-3 uppercase"
              placeholder="Ej. MONTACARGA 3T"
            />
          </div>

          <div>
            <label className="text-muted mb-1 block text-sm">Tipo</label>
            <select
              name="tipo"
              value={form.tipo}
              onChange={handleChange}
              disabled={isView || loading}
              className="input p-3"
            >
              {tiposMaquinaria.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-muted mb-1 block text-sm">Estado</label>
            <select
              name="estado"
              value={form.estado}
              onChange={handleChange}
              disabled={isView || loading}
              className="input p-3"
            >
              {estadosMaquinaria.map((estado) => (
                <option key={estado} value={estado}>
                  {estado}
                </option>
              ))}
            </select>
          </div>

          {[
            ["marca", "Marca"],
            ["modelo", "Modelo"],
            ["serie", "Serie"],
            ["ubicacion", "Ubicación"],
          ].map(([name, label]) => (
            <div key={name}>
              <label className="text-muted mb-1 block text-sm">{label}</label>
              <input
                name={name}
                value={form[name]}
                onChange={handleChange}
                disabled={isView || loading}
                className="input p-3 uppercase"
              />
            </div>
          ))}

          <div>
            <label className="text-muted mb-1 block text-sm">Año</label>
            <input
              name="anio"
              value={form.anio}
              onChange={handleChange}
              disabled={isView || loading}
              type="number"
              min="1900"
              className="input p-3"
            />
          </div>

          <div>
            <label className="text-muted mb-1 block text-sm">
              Horómetro actual
            </label>
            <input
              name="horometroActual"
              value={form.horometroActual}
              onChange={handleChange}
              disabled={isView || loading}
              type="number"
              min="0"
              step="0.01"
              className="input p-3"
            />
          </div>

          <div>
            <label className="text-muted mb-1 block text-sm">
              Kilometraje actual
            </label>
            <input
              name="kilometrajeActual"
              value={form.kilometrajeActual}
              onChange={handleChange}
              disabled={isView || loading}
              type="number"
              min="0"
              step="0.01"
              className="input p-3"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-muted mb-1 block text-sm">
              Observaciones
            </label>
            <textarea
              name="observaciones"
              value={form.observaciones}
              onChange={handleChange}
              disabled={isView || loading}
              rows="3"
              className="input resize-none p-3"
            />
          </div>

          <div className="mt-4 flex justify-end gap-3 md:col-span-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn-secondary px-3 py-1.5"
            >
              {isView ? "Cerrar" : "Cancelar"}
            </button>

            {!isView && (
              <button
                type="submit"
                disabled={loading}
                className="btn-success px-3 py-1.5"
              >
                {loading ? "Guardando..." : isEdit ? "Actualizar" : "Guardar"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default MaquinariaModal;
