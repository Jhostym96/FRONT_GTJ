import { useEffect, useMemo, useState } from "react";
import { notify } from "../../utils/notify";
import { getRecordId } from "../../utils/apiData";

const initialForm = {
  tipoEquipo: "UNIDAD",
  unidadId: "",
  maquinariaId: "",
  tipoMantenimiento: "PREVENTIVO",
  estado: "PROGRAMADO",
  fechaProgramada: "",
  fechaInicio: "",
  fechaFinalizacion: "",
  responsable: "",
  kilometraje: "",
  horometro: "",
  descripcion: "",
  diagnostico: "",
  trabajoRealizado: "",
  proximoFecha: "",
  proximoKilometraje: "",
  proximoHorometro: "",
  costoManoObra: "0",
  costoTotal: "0",
  observaciones: "",
  detalles: [],
};

const initialDetalle = {
  tipoDetalle: "CAMBIO_PIEZA",
  itemAlmacenId: "",
  descripcion: "",
  cantidad: "1",
  unidadMedida: "UND",
  fechaCambio: "",
  kilometraje: "",
  horometro: "",
  responsable: "",
  proximoCambioFecha: "",
  proximoCambioKilometraje: "",
  proximoCambioHorometro: "",
  observaciones: "",
};

const toInputDate = (value) => (value ? String(value).slice(0, 10) : "");

function MantenimientoModal({
  isOpen,
  onClose,
  onSubmit,
  mode = "create",
  mantenimiento = null,
  unidades = [],
  maquinarias = [],
  itemsAlmacen = [],
}) {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);

  const isView = mode === "view";
  const isEdit = mode === "edit";

  useEffect(() => {
    if (!isOpen) return;

    if ((isEdit || isView) && mantenimiento) {
      setForm({
        tipoEquipo: mantenimiento.tipoEquipo || "UNIDAD",
        unidadId: mantenimiento.unidadId ? String(mantenimiento.unidadId) : "",
        maquinariaId: mantenimiento.maquinariaId
          ? String(mantenimiento.maquinariaId)
          : "",
        tipoMantenimiento: mantenimiento.tipoMantenimiento || "PREVENTIVO",
        estado: mantenimiento.estado || "PROGRAMADO",
        fechaProgramada: toInputDate(mantenimiento.fechaProgramada),
        fechaInicio: toInputDate(mantenimiento.fechaInicio),
        fechaFinalizacion: toInputDate(mantenimiento.fechaFinalizacion),
        responsable: mantenimiento.responsable || "",
        kilometraje: String(mantenimiento.kilometraje ?? ""),
        horometro: String(mantenimiento.horometro ?? ""),
        descripcion: mantenimiento.descripcion || "",
        diagnostico: mantenimiento.diagnostico || "",
        trabajoRealizado: mantenimiento.trabajoRealizado || "",
        proximoFecha: toInputDate(mantenimiento.proximoFecha),
        proximoKilometraje: String(mantenimiento.proximoKilometraje ?? ""),
        proximoHorometro: String(mantenimiento.proximoHorometro ?? ""),
        costoManoObra: String(mantenimiento.costoManoObra ?? "0"),
        costoTotal: String(mantenimiento.costoTotal ?? "0"),
        observaciones: mantenimiento.observaciones || "",
        detalles: Array.isArray(mantenimiento.detalles)
          ? mantenimiento.detalles.map((detalle) => ({
              tipoDetalle: detalle.tipoDetalle || "CAMBIO_PIEZA",
              itemAlmacenId: detalle.itemAlmacenId
                ? String(detalle.itemAlmacenId)
                : "",
              descripcion: detalle.descripcion || "",
              cantidad: String(detalle.cantidad ?? "0"),
              unidadMedida: detalle.unidadMedida || "UND",
              fechaCambio: toInputDate(detalle.fechaCambio),
              kilometraje: String(detalle.kilometraje ?? ""),
              horometro: String(detalle.horometro ?? ""),
              responsable: detalle.responsable || "",
              proximoCambioFecha: toInputDate(detalle.proximoCambioFecha),
              proximoCambioKilometraje: String(
                detalle.proximoCambioKilometraje ?? ""
              ),
              proximoCambioHorometro: String(detalle.proximoCambioHorometro ?? ""),
              observaciones: detalle.observaciones || "",
            }))
          : [],
      });
    } else {
      setForm(initialForm);
    }
  }, [isOpen, isEdit, isView, mantenimiento]);

  const equipoSeleccionado = useMemo(() => {
    if (form.tipoEquipo === "UNIDAD") {
      return unidades.find((unidad) => String(getRecordId(unidad)) === form.unidadId);
    }

    return maquinarias.find(
      (maquinaria) => String(getRecordId(maquinaria)) === form.maquinariaId
    );
  }, [form.maquinariaId, form.tipoEquipo, form.unidadId, maquinarias, unidades]);

  if (!isOpen) return null;

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "tipoEquipo"
        ? {
            unidadId: "",
            maquinariaId: "",
            kilometraje: "",
            horometro: "",
          }
        : {}),
    }));
  };

  const agregarDetalle = () => {
    setForm((prev) => ({
      ...prev,
      detalles: [
        ...prev.detalles,
        {
          ...initialDetalle,
          fechaCambio: prev.fechaFinalizacion || prev.fechaInicio || prev.fechaProgramada,
          kilometraje: prev.kilometraje,
          horometro: prev.horometro,
          responsable: prev.responsable,
        },
      ],
    }));
  };

  const actualizarDetalle = (index, name, value) => {
    setForm((prev) => {
      const detalles = prev.detalles.map((detalle, detalleIndex) => {
        if (detalleIndex !== index) return detalle;

        if (name === "itemAlmacenId") {
          const item = itemsAlmacen.find(
            (actual) => String(getRecordId(actual)) === String(value)
          );

          return {
            ...detalle,
            itemAlmacenId: value,
            descripcion: item ? item.nombre || detalle.descripcion : detalle.descripcion,
            unidadMedida: item ? item.unidadMedida || "UND" : detalle.unidadMedida,
            tipoDetalle:
              item?.tipo === "INSUMO" ? "CAMBIO_FLUIDO" : detalle.tipoDetalle,
          };
        }

        return { ...detalle, [name]: value };
      });

      return { ...prev, detalles };
    });
  };

  const eliminarDetalle = (index) => {
    setForm((prev) => ({
      ...prev,
      detalles: prev.detalles.filter((_, detalleIndex) => detalleIndex !== index),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isView || loading) return;

    if (form.tipoEquipo === "UNIDAD" && !form.unidadId) {
      notify.error("Selecciona la unidad");
      return;
    }

    if (form.tipoEquipo === "MAQUINARIA" && !form.maquinariaId) {
      notify.error("Selecciona la maquinaria");
      return;
    }

    if (!form.tipoMantenimiento || !form.estado) {
      notify.error("Selecciona tipo y estado de mantenimiento");
      return;
    }

    const numericFields = [
      "kilometraje",
      "horometro",
      "proximoKilometraje",
      "proximoHorometro",
      "costoManoObra",
      "costoTotal",
    ];

    for (const field of numericFields) {
      if (form[field] !== "" && Number(form[field]) < 0) {
        notify.error("Los valores numéricos no pueden ser negativos");
        return;
      }
    }

    const data = {
      ...form,
      unidadId: form.tipoEquipo === "UNIDAD" ? form.unidadId : "",
      maquinariaId: form.tipoEquipo === "MAQUINARIA" ? form.maquinariaId : "",
      responsable: form.responsable.trim().toUpperCase(),
      descripcion: form.descripcion.trim(),
      diagnostico: form.diagnostico.trim(),
      trabajoRealizado: form.trabajoRealizado.trim(),
      observaciones: form.observaciones.trim(),
      kilometraje: form.kilometraje || null,
      horometro: form.horometro || null,
      proximoKilometraje: form.proximoKilometraje || null,
      proximoHorometro: form.proximoHorometro || null,
      costoManoObra: form.costoManoObra || "0",
      costoTotal: form.costoTotal || "0",
      detalles: form.detalles.map((detalle) => ({
        ...detalle,
        descripcion: detalle.descripcion.trim(),
        responsable: detalle.responsable.trim().toUpperCase(),
        observaciones: detalle.observaciones.trim(),
        itemAlmacenId: detalle.itemAlmacenId || null,
        cantidad: detalle.cantidad || "0",
        fechaCambio: detalle.fechaCambio || null,
        kilometraje: detalle.kilometraje || null,
        horometro: detalle.horometro || null,
        proximoCambioFecha: detalle.proximoCambioFecha || null,
        proximoCambioKilometraje: detalle.proximoCambioKilometraje || null,
        proximoCambioHorometro: detalle.proximoCambioHorometro || null,
      })),
    };

    try {
      setLoading(true);
      await onSubmit(data);
    } finally {
      setLoading(false);
    }
  };

  const titulo = {
    create: "Nueva orden de mantenimiento",
    edit: "Editar mantenimiento",
    view: "Detalle de mantenimiento",
  }[mode];

  return (
    <div className="modal-backdrop">
      <div className="modal-panel max-w-5xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">{titulo}</h2>
            <p className="text-muted text-sm">
              Registra mantenimiento preventivo, correctivo, inspecciones y cambios.
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

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="text-muted mb-1 block text-sm">Tipo de equipo</label>
            <select
              name="tipoEquipo"
              value={form.tipoEquipo}
              onChange={handleChange}
              disabled={isView || loading}
              className="input p-3"
            >
              <option value="UNIDAD">UNIDAD</option>
              <option value="MAQUINARIA">MAQUINARIA</option>
            </select>
          </div>

          <div>
            <label className="text-muted mb-1 block text-sm">Equipo</label>
            {form.tipoEquipo === "UNIDAD" ? (
              <select
                name="unidadId"
                value={form.unidadId}
                onChange={handleChange}
                disabled={isView || loading}
                className="input p-3"
              >
                <option value="">Seleccione unidad</option>
                {unidades.map((unidad) => (
                  <option key={getRecordId(unidad)} value={getRecordId(unidad)}>
                    {unidad.placa} - {unidad.tipoUnidad}
                  </option>
                ))}
              </select>
            ) : (
              <select
                name="maquinariaId"
                value={form.maquinariaId}
                onChange={handleChange}
                disabled={isView || loading}
                className="input p-3"
              >
                <option value="">Seleccione maquinaria</option>
                {maquinarias.map((maquinaria) => (
                  <option key={getRecordId(maquinaria)} value={getRecordId(maquinaria)}>
                    {maquinaria.codigo} - {maquinaria.nombre}
                  </option>
                ))}
              </select>
            )}
          </div>

          {equipoSeleccionado && (
            <div className="rounded-lg border border-[var(--app-border)] p-3 text-sm md:col-span-2">
              <p className="text-faint text-xs">Lectura actual del equipo</p>
              <p className="text-main mt-1 font-semibold">
                {form.tipoEquipo === "UNIDAD"
                  ? `${equipoSeleccionado.placa} - ${equipoSeleccionado.estadoOperativo || "OPERATIVA"}`
                  : `${equipoSeleccionado.codigo} - ${equipoSeleccionado.estado || "OPERATIVA"}`}
              </p>
              <p className="text-muted mt-1">
                Km: {equipoSeleccionado.kilometrajeActual ?? 0} / Horómetro: {equipoSeleccionado.horometroActual ?? 0}
              </p>
            </div>
          )}

          <div>
            <label className="text-muted mb-1 block text-sm">Tipo mantenimiento</label>
            <select
              name="tipoMantenimiento"
              value={form.tipoMantenimiento}
              onChange={handleChange}
              disabled={isView || loading}
              className="input p-3"
            >
              <option value="PREVENTIVO">PREVENTIVO</option>
              <option value="CORRECTIVO">CORRECTIVO</option>
              <option value="INSPECCION">INSPECCION</option>
              <option value="CAMBIO_FLUIDO">CAMBIO FLUIDO</option>
              <option value="CAMBIO_PIEZA">CAMBIO PIEZA</option>
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
              <option value="PROGRAMADO">PROGRAMADO</option>
              <option value="EN_PROCESO">EN PROCESO</option>
              <option value="FINALIZADO">FINALIZADO</option>
              <option value="CANCELADO">CANCELADO</option>
            </select>
          </div>

          {[
            ["fechaProgramada", "Fecha programada"],
            ["fechaInicio", "Fecha inicio"],
            ["fechaFinalizacion", "Fecha finalización"],
          ].map(([name, label]) => (
            <div key={name}>
              <label className="text-muted mb-1 block text-sm">{label}</label>
              <input
                name={name}
                value={form[name]}
                onChange={handleChange}
                disabled={isView || loading}
                type="date"
                className="input p-3"
              />
            </div>
          ))}

          <div>
            <label className="text-muted mb-1 block text-sm">Responsable</label>
            <input
              name="responsable"
              value={form.responsable}
              onChange={handleChange}
              disabled={isView || loading}
              className="input p-3 uppercase"
            />
          </div>

          {[
            ["kilometraje", "Kilometraje"],
            ["horometro", "Horómetro"],
            ["proximoKilometraje", "Próximo km"],
            ["proximoHorometro", "Próximo horómetro"],
            ["costoManoObra", "Costo mano de obra"],
            ["costoTotal", "Costo total"],
          ].map(([name, label]) => (
            <div key={name}>
              <label className="text-muted mb-1 block text-sm">{label}</label>
              <input
                name={name}
                value={form[name]}
                onChange={handleChange}
                disabled={isView || loading}
                type="number"
                min="0"
                step="0.01"
                className="input p-3"
              />
            </div>
          ))}

          <div>
            <label className="text-muted mb-1 block text-sm">Próxima fecha</label>
            <input
              name="proximoFecha"
              value={form.proximoFecha}
              onChange={handleChange}
              disabled={isView || loading}
              type="date"
              className="input p-3"
            />
          </div>

          {[
            ["descripcion", "Descripción"],
            ["diagnostico", "Diagnóstico"],
            ["trabajoRealizado", "Trabajo realizado"],
            ["observaciones", "Observaciones"],
          ].map(([name, label]) => (
            <div key={name} className="md:col-span-2">
              <label className="text-muted mb-1 block text-sm">{label}</label>
              <textarea
                name={name}
                value={form[name]}
                onChange={handleChange}
                disabled={isView || loading}
                rows="3"
                className="input resize-none p-3"
              />
            </div>
          ))}

          <div className="md:col-span-2">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-main font-semibold">Cambios realizados</h3>
                <p className="text-muted text-sm">
                  Historial de piezas, fluidos o servicios aplicados al equipo.
                </p>
              </div>
              {!isView && (
                <button
                  type="button"
                  onClick={agregarDetalle}
                  className="btn-secondary px-3 py-2"
                >
                  Agregar cambio
                </button>
              )}
            </div>

            {form.detalles.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[var(--app-border)] p-4 text-sm text-muted">
                No hay cambios registrados en esta orden.
              </div>
            ) : (
              <div className="grid gap-4">
                {form.detalles.map((detalle, index) => (
                  <div
                    key={`${index}-${detalle.itemAlmacenId}`}
                    className="rounded-lg border border-[var(--app-border)] p-4"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-main font-semibold">Cambio {index + 1}</p>
                      {!isView && (
                        <button
                          type="button"
                          onClick={() => eliminarDetalle(index)}
                          className="btn-danger px-3 py-1.5"
                        >
                          Quitar
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <div>
                        <label className="text-muted mb-1 block text-sm">Tipo</label>
                        <select
                          value={detalle.tipoDetalle}
                          onChange={(event) =>
                            actualizarDetalle(index, "tipoDetalle", event.target.value)
                          }
                          disabled={isView || loading}
                          className="input p-3"
                        >
                          <option value="CAMBIO_PIEZA">CAMBIO PIEZA</option>
                          <option value="CAMBIO_FLUIDO">CAMBIO FLUIDO</option>
                          <option value="SERVICIO">SERVICIO</option>
                          <option value="INSPECCION">INSPECCION</option>
                          <option value="OTRO">OTRO</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-muted mb-1 block text-sm">
                          Artículo almacén
                        </label>
                        <select
                          value={detalle.itemAlmacenId}
                          onChange={(event) =>
                            actualizarDetalle(index, "itemAlmacenId", event.target.value)
                          }
                          disabled={isView || loading}
                          className="input p-3"
                        >
                          <option value="">Sin artículo</option>
                          {itemsAlmacen.map((item) => (
                            <option key={getRecordId(item)} value={getRecordId(item)}>
                              {item.codigo} - {item.nombre}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-muted mb-1 block text-sm">
                          Fecha cambio
                        </label>
                        <input
                          value={detalle.fechaCambio}
                          onChange={(event) =>
                            actualizarDetalle(index, "fechaCambio", event.target.value)
                          }
                          disabled={isView || loading}
                          type="date"
                          className="input p-3"
                        />
                      </div>

                      <div className="md:col-span-3">
                        <label className="text-muted mb-1 block text-sm">
                          Descripción
                        </label>
                        <input
                          value={detalle.descripcion}
                          onChange={(event) =>
                            actualizarDetalle(index, "descripcion", event.target.value)
                          }
                          disabled={isView || loading}
                          className="input p-3 uppercase"
                        />
                      </div>

                      {[
                        ["cantidad", "Cantidad"],
                        ["unidadMedida", "Unidad medida"],
                        ["kilometraje", "Kilometraje"],
                        ["horometro", "Horómetro"],
                        ["responsable", "Responsable"],
                        ["proximoCambioFecha", "Próxima fecha", "date"],
                        ["proximoCambioKilometraje", "Próximo km"],
                        ["proximoCambioHorometro", "Próximo horómetro"],
                      ].map(([name, label, type]) => (
                        <div key={name}>
                          <label className="text-muted mb-1 block text-sm">
                            {label}
                          </label>
                          <input
                            value={detalle[name]}
                            onChange={(event) =>
                              actualizarDetalle(index, name, event.target.value)
                            }
                            disabled={isView || loading}
                            type={
                              type ||
                              ([
                                "cantidad",
                                "kilometraje",
                                "horometro",
                                "proximoCambioKilometraje",
                                "proximoCambioHorometro",
                              ].includes(name)
                                ? "number"
                                : "text")
                            }
                            min={
                              [
                                "cantidad",
                                "kilometraje",
                                "horometro",
                                "proximoCambioKilometraje",
                                "proximoCambioHorometro",
                              ].includes(name)
                                ? "0"
                                : undefined
                            }
                            step={
                              [
                                "cantidad",
                                "kilometraje",
                                "horometro",
                                "proximoCambioKilometraje",
                                "proximoCambioHorometro",
                              ].includes(name)
                                ? "0.01"
                                : undefined
                            }
                            className="input p-3 uppercase"
                          />
                        </div>
                      ))}

                      <div className="md:col-span-3">
                        <label className="text-muted mb-1 block text-sm">
                          Observaciones del cambio
                        </label>
                        <textarea
                          value={detalle.observaciones}
                          onChange={(event) =>
                            actualizarDetalle(index, "observaciones", event.target.value)
                          }
                          disabled={isView || loading}
                          rows="2"
                          className="input resize-none p-3"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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

export default MantenimientoModal;
