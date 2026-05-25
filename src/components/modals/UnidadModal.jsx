import { useEffect, useState } from "react";
import { notify } from "../../utils/notify";

const initialForm = {
  placa: "",
  tipoUnidad: "",
  numeroTUCE_CHV: "",
  marca: "",
  modelo: "",
  anio: "",
  serieMotor: "",
  serieChasis: "",
  estado: "ACTIVO",
  estadoOperativo: "OPERATIVA",
  ubicacionOperativa: "",
  kilometrajeActual: "0",
  horometroActual: "0",
  fechaUltimoMantenimiento: "",
  proximoMantenimientoKm: "",
  proximoMantenimientoFecha: "",
  permisoIMO: false,
  permisoIQBF: false,
  observaciones: "",
};

const toInputDate = (value) => {
  if (!value) return "";
  return String(value).slice(0, 10);
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
        anio: unidad.anio ? String(unidad.anio) : "",
        serieMotor: unidad.serieMotor || "",
        serieChasis: unidad.serieChasis || "",
        estado: unidad.estado || "ACTIVO",
        estadoOperativo: unidad.estadoOperativo || "OPERATIVA",
        ubicacionOperativa: unidad.ubicacionOperativa || "",
        kilometrajeActual: String(unidad.kilometrajeActual ?? "0"),
        horometroActual: String(unidad.horometroActual ?? "0"),
        fechaUltimoMantenimiento: toInputDate(unidad.fechaUltimoMantenimiento),
        proximoMantenimientoKm: String(unidad.proximoMantenimientoKm ?? ""),
        proximoMantenimientoFecha: toInputDate(unidad.proximoMantenimientoFecha),
        permisoIMO: Boolean(unidad.permisoIMO),
        permisoIQBF: Boolean(unidad.permisoIQBF),
        observaciones: unidad.observaciones || "",
      });
    } else {
      setForm(initialForm);
    }
  }, [isOpen, mode, unidad, isEdit, isView]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isView || loading) return;

    const tipoUnidadNormalizado = form.tipoUnidad.trim().toUpperCase();
    const estadoNormalizado = form.estado.trim().toUpperCase();
    const estadoOperativoNormalizado = form.estadoOperativo.trim().toUpperCase();
    const anio = form.anio ? Number(form.anio) : null;
    const kilometrajeActual = Number(form.kilometrajeActual || 0);
    const horometroActual = Number(form.horometroActual || 0);
    const proximoMantenimientoKm = form.proximoMantenimientoKm
      ? Number(form.proximoMantenimientoKm)
      : null;

    if (!form.placa.trim()) {
      notify.error("La placa es obligatoria");
      return;
    }

    if (!["TRACTO", "CARRETA"].includes(tipoUnidadNormalizado)) {
      notify.error("Selecciona un tipo de unidad válido");
      return;
    }

    if (!["ACTIVO", "INACTIVO"].includes(estadoNormalizado)) {
      notify.error("Selecciona un estado válido");
      return;
    }

    if (
      !["OPERATIVA", "EN_MANTENIMIENTO", "INACTIVA", "BAJA"].includes(
        estadoOperativoNormalizado
      )
    ) {
      notify.error("Selecciona un estado operativo válido");
      return;
    }

    if (form.anio && (!Number.isInteger(anio) || anio < 1900)) {
      notify.error("Ingresa un año válido");
      return;
    }

    if (kilometrajeActual < 0 || horometroActual < 0) {
      notify.error("Kilometraje y horómetro no pueden ser negativos");
      return;
    }

    if (proximoMantenimientoKm !== null && proximoMantenimientoKm < 0) {
      notify.error("El próximo mantenimiento por km no puede ser negativo");
      return;
    }

    const data = {
      placa: form.placa.trim().toUpperCase(),
      tipoUnidad: tipoUnidadNormalizado,
      numeroTUCE_CHV: form.numeroTUCE_CHV.trim().toUpperCase(),
      marca: form.marca.trim().toUpperCase(),
      modelo: form.modelo.trim().toUpperCase(),
      anio,
      serieMotor: form.serieMotor.trim().toUpperCase(),
      serieChasis: form.serieChasis.trim().toUpperCase(),
      estado: estadoNormalizado,
      estadoOperativo: estadoOperativoNormalizado,
      ubicacionOperativa: form.ubicacionOperativa.trim().toUpperCase(),
      kilometrajeActual,
      horometroActual,
      fechaUltimoMantenimiento: form.fechaUltimoMantenimiento || null,
      proximoMantenimientoKm,
      proximoMantenimientoFecha: form.proximoMantenimientoFecha || null,
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

  const titulo = {
    create: "Nueva unidad",
    edit: "Editar unidad",
    view: "Detalle de unidad",
  }[mode];

  return (
    <div className="modal-backdrop">
      <div className="modal-panel max-w-4xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">{titulo}</h2>
            <p className="text-muted text-sm">
              Registra datos documentarios, técnicos y de mantenimiento.
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
            <label className="text-muted mb-1 block text-sm">Placa</label>
            <input
              name="placa"
              value={form.placa}
              onChange={handleChange}
              disabled={isView || loading}
              required
              className="input p-3 uppercase"
              placeholder="Ingrese la placa de la unidad"
            />
          </div>

          <div>
            <label className="text-muted mb-1 block text-sm">
              Tipo unidad
            </label>
            <select
              name="tipoUnidad"
              value={form.tipoUnidad}
              onChange={handleChange}
              disabled={isView || loading}
              required
              className="input p-3"
            >
              <option value="">Seleccione tipo</option>
              <option value="TRACTO">TRACTO</option>
              <option value="CARRETA">CARRETA</option>
            </select>
          </div>

          <div>
            <label className="text-muted mb-1 block text-sm">
              N° TUCE / CHV
            </label>
            <input
              name="numeroTUCE_CHV"
              value={form.numeroTUCE_CHV}
              onChange={handleChange}
              disabled={isView || loading}
              className="input p-3 uppercase"
              placeholder="Ingrese el número TUCE o CHV"
            />
          </div>

          <div>
            <label className="text-muted mb-1 block text-sm">Marca</label>
            <input
              name="marca"
              value={form.marca}
              onChange={handleChange}
              disabled={isView || loading}
              className="input p-3 uppercase"
              placeholder="Ingrese la marca de la unidad"
            />
          </div>

          <div>
            <label className="text-muted mb-1 block text-sm">Modelo</label>
            <input
              name="modelo"
              value={form.modelo}
              onChange={handleChange}
              disabled={isView || loading}
              className="input p-3 uppercase"
              placeholder="Ingrese el modelo de la unidad"
            />
          </div>

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
            <label className="text-muted mb-1 block text-sm">Estado</label>
            <select
              name="estado"
              value={form.estado}
              onChange={handleChange}
              disabled={isView || loading}
              className="input p-3"
            >
              <option value="ACTIVO">ACTIVO</option>
              <option value="INACTIVO">INACTIVO</option>
            </select>
          </div>

          <div>
            <label className="text-muted mb-1 block text-sm">
              Estado operativo
            </label>
            <select
              name="estadoOperativo"
              value={form.estadoOperativo}
              onChange={handleChange}
              disabled={isView || loading}
              className="input p-3"
            >
              <option value="OPERATIVA">OPERATIVA</option>
              <option value="EN_MANTENIMIENTO">EN MANTENIMIENTO</option>
              <option value="INACTIVA">INACTIVA</option>
              <option value="BAJA">BAJA</option>
            </select>
          </div>

          <div>
            <label className="text-muted mb-1 block text-sm">
              Serie motor
            </label>
            <input
              name="serieMotor"
              value={form.serieMotor}
              onChange={handleChange}
              disabled={isView || loading}
              className="input p-3 uppercase"
            />
          </div>

          <div>
            <label className="text-muted mb-1 block text-sm">
              Serie chasis
            </label>
            <input
              name="serieChasis"
              value={form.serieChasis}
              onChange={handleChange}
              disabled={isView || loading}
              className="input p-3 uppercase"
            />
          </div>

          <div>
            <label className="text-muted mb-1 block text-sm">
              Ubicación operativa
            </label>
            <input
              name="ubicacionOperativa"
              value={form.ubicacionOperativa}
              onChange={handleChange}
              disabled={isView || loading}
              className="input p-3 uppercase"
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
              Último mantenimiento
            </label>
            <input
              name="fechaUltimoMantenimiento"
              value={form.fechaUltimoMantenimiento}
              onChange={handleChange}
              disabled={isView || loading}
              type="date"
              className="input p-3"
            />
          </div>

          <div>
            <label className="text-muted mb-1 block text-sm">
              Próximo mantenimiento km
            </label>
            <input
              name="proximoMantenimientoKm"
              value={form.proximoMantenimientoKm}
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
              Próximo mantenimiento fecha
            </label>
            <input
              name="proximoMantenimientoFecha"
              value={form.proximoMantenimientoFecha}
              onChange={handleChange}
              disabled={isView || loading}
              type="date"
              className="input p-3"
            />
          </div>

          <div className="grid gap-3 rounded-lg border border-[var(--app-border)] p-3 md:col-span-2 sm:grid-cols-2">
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                name="permisoIMO"
                checked={form.permisoIMO}
                onChange={handleChange}
                disabled={isView || loading}
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
                disabled={isView || loading}
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
              disabled={isView || loading}
              rows="3"
              className="input resize-none p-3"
              placeholder="Indique observaciones de la unidad"
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
