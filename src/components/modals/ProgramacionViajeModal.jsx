import { useEffect, useMemo, useState } from "react";
import { useUnidades } from "../../context/UnidadContext";
import { useConductores } from "../../context/ConductorContext";
import { useProgramacionViaje } from "../../context/ProgramacionViajeContext";
import { getTodayInputDate } from "../../utils/date";

const APP_TIME_ZONE = "America/Lima";

const normalizar = (valor) =>
  String(valor || "")
    .trim()
    .toUpperCase();

const getId = (item) => item?.id ?? item?._id ?? "";

const createInitialForm = () => ({
  ordenServicioId: "",
  vehiculoPrincipalId: "",
  vehiculoSecundarioId: "",
  conductorId: "",
  fechaInicioTraslado: getTodayInputDate(),
  horaCita: "",
  numeroContenedor: "",
  observaciones: "",
});

function ProgramacionViajeModal({
  isOpen,
  open,
  onClose,
  mode = "create",
  data = null,
}) {
  const modalOpen = isOpen ?? open;

  const { unidades = [] } = useUnidades();

  const { conductores = [] } = useConductores();

  const {
    crearProgramacionViaje,
    createProgramacionViaje,
    actualizarProgramacionViaje,
    obtenerProgramacionesViaje,
    getProgramacionesViaje,
    ordenesDisponibles: ordenesDisponiblesContext = [],
    getOrdenesDisponibles,
  } = useProgramacionViaje();

  const [form, setForm] = useState(createInitialForm);
  const [error, setError] = useState("");

  const isView = mode === "view";
  const isEdit = mode === "edit";
  const isReadOnly = isView;
  const requiresRouteEditReason = isEdit && data?.estado === "EN_RUTA";

  const formatearFechaInput = (fecha) => {
    if (!fecha) return "";

    const fechaObj = new Date(fecha);

    if (Number.isNaN(fechaObj.getTime())) return "";

    return fechaObj.toISOString().slice(0, 10);
  };

  const formatearFechaHora = (fecha) => {
    if (!fecha) return "-";

    const fechaObj = new Date(fecha);

    if (Number.isNaN(fechaObj.getTime())) return "-";

    return fechaObj.toLocaleString("es-PE", {
      timeZone: APP_TIME_ZONE,
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatearStandby = (minutos) => {
    if (minutos === null || minutos === undefined) return "-";
    return `${minutos} min (${(minutos / 60).toFixed(2)} h)`;
  };

  useEffect(() => {
    if (!modalOpen) return;

    if (!isView && !isEdit) {
      getOrdenesDisponibles?.();
    }

    setError("");

    if ((isView || isEdit) && data) {
      setForm({
        ordenServicioId:
          data.ordenServicioId ||
          data.ordenServicio?.id ||
          data.ordenServicio?._id ||
          "",

        vehiculoPrincipalId:
          data.vehiculoPrincipalId ||
          data.vehiculoPrincipal?.id ||
          data.vehiculoPrincipal?._id ||
          data.unidad?.id ||
          data.unidad?._id ||
          "",

        vehiculoSecundarioId:
          data.vehiculoSecundarioId ||
          data.vehiculoSecundario?.id ||
          data.vehiculoSecundario?._id ||
          "",

        conductorId:
          data.conductorId || data.conductor?.id || data.conductor?._id || "",

        fechaInicioTraslado: formatearFechaInput(data.fechaInicioTraslado),
        horaCita: data.horaCita || "",

        numeroContenedor: data.numeroContenedor || "",
        observaciones: data.observaciones || "",
        motivoEdicionEnRuta: "",
      });
    } else {
      setForm(createInitialForm());
    }
  }, [modalOpen, isView, isEdit, data, getOrdenesDisponibles]);

  const listaConductores = Array.isArray(conductores) ? conductores : [];

  const tractos = useMemo(
    () => {
      if (!modalOpen) return [];

      return (Array.isArray(unidades) ? unidades : []).filter((unidad) => {
        const tipo = normalizar(unidad.tipoUnidad);
        const estado = normalizar(unidad.estado);

        return tipo === "TRACTO" && estado === "ACTIVO";
      });
    },
    [modalOpen, unidades]
  );

  const carretas = useMemo(
    () => {
      if (!modalOpen) return [];

      return (Array.isArray(unidades) ? unidades : []).filter((unidad) => {
        const tipo = normalizar(unidad.tipoUnidad);
        const estado = normalizar(unidad.estado);

        return tipo === "CARRETA" && estado === "ACTIVO";
      });
    },
    [modalOpen, unidades]
  );

  const ordenesDisponibles = useMemo(() => {
    if (!modalOpen) return [];

    const disponibles = Array.isArray(ordenesDisponiblesContext)
      ? ordenesDisponiblesContext
      : [];
    const ordenActual = data?.ordenServicio;

    if (
      !ordenActual ||
      disponibles.some((orden) => getId(orden) === getId(ordenActual))
    ) {
      return disponibles;
    }

    return [ordenActual, ...disponibles];
  }, [data?.ordenServicio, modalOpen, ordenesDisponiblesContext]);

  if (!modalOpen) return null;

  const obtenerRazonSocialCliente = (orden) => {
    return (
      orden?.clienteSolicitanteRazonSocial ||
      orden?.clienteSolicitante?.razonSocial ||
      orden?.cliente?.razonSocial ||
      "Cliente sin nombre"
    );
  };

  const formatearResumenCarga = (orden) => {
    const tipo = orden?.tipoCarga
      ? orden.tipoCarga.replace("_", " ")
      : "Carga sin tipo";
    const clasificacion = orden?.clasificacionCarga || "GENERAL";
    const dimension =
      ["CONTENEDOR", "EXPORTACION"].includes(orden?.tipoCarga) &&
      orden?.dimensionCarga
        ? ` ${orden.dimensionCarga} pies`
        : "";

    return `${tipo} ${clasificacion}${dimension}`;
  };

  const formatearCupoViajes = (orden) => {
    const cantidadViajes = orden?.cantidadViajes || 1;
    const viajesProgramados = orden?.viajesProgramados || 0;

    return `${viajesProgramados}/${cantidadViajes} viajes`;
  };

  const obtenerPlaca = (unidad) => {
    return unidad?.placa || unidad?.numeroPlaca || unidad?.placaUnidad || "";
  };

  const obtenerPermisosTexto = (item) => {
    const permisos = [
      item?.permisoIMO ? "IMO" : null,
      item?.permisoIQBF ? "IQBF" : null,
    ].filter(Boolean);

    return permisos.length ? permisos.join("/") : "GENERAL";
  };

  const validarPermisoPorClasificacion = (item, clasificacion) => {
    if (clasificacion === "IMO") return Boolean(item?.permisoIMO);
    if (clasificacion === "IQBF") return Boolean(item?.permisoIQBF);
    return true;
  };

  const handleChange = (e) => {
    setError("");

    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const cerrarModal = () => {
    setForm(createInitialForm());
    setError("");
    onClose?.();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isReadOnly) return;

    try {
      setError("");

      if (!form.ordenServicioId) {
        setError("Debes seleccionar una orden de servicio");
        return;
      }

      if (!form.vehiculoPrincipalId) {
        setError("Debes seleccionar un tracto");
        return;
      }

      if (!form.conductorId) {
        setError("Debes seleccionar un conductor");
        return;
      }

      if (!form.fechaInicioTraslado) {
        setError("Debes seleccionar la fecha de inicio de traslado");
        return;
      }

      if (!form.horaCita) {
        setError("Debes seleccionar la hora de cita");
        return;
      }

      if (
        requiresRouteEditReason &&
        String(form.motivoEdicionEnRuta || "").trim().length < 8
      ) {
        setError("Debes ingresar un motivo de edición en ruta de al menos 8 caracteres");
        return;
      }

      const unidadSeleccionada = tractos.find(
        (unidad) => String(getId(unidad)) === String(form.vehiculoPrincipalId)
      );
      const carretaSeleccionada = carretas.find(
        (unidad) => String(getId(unidad)) === String(form.vehiculoSecundarioId)
      );
      const conductorSeleccionado = listaConductores.find(
        (conductor) => String(getId(conductor)) === String(form.conductorId)
      );
      const ordenSeleccionada = ordenesDisponibles.find(
        (orden) => String(getId(orden)) === String(form.ordenServicioId)
      );
      const clasificacionCarga =
        ordenSeleccionada?.clasificacionCarga || "GENERAL";

      if (!unidadSeleccionada) {
        setError("El vehículo principal debe ser un TRACTO activo");
        return;
      }

      if (
        form.vehiculoSecundarioId &&
        String(form.vehiculoPrincipalId) === String(form.vehiculoSecundarioId)
      ) {
        setError("El tracto y la carreta no pueden ser la misma unidad");
        return;
      }

      if (
        !validarPermisoPorClasificacion(
          unidadSeleccionada,
          clasificacionCarga
        )
      ) {
        setError(
          `No se puede asignar: el tracto no tiene permiso ${clasificacionCarga}`
        );
        return;
      }

      if (
        carretaSeleccionada &&
        !validarPermisoPorClasificacion(
          carretaSeleccionada,
          clasificacionCarga
        )
      ) {
        setError(
          `No se puede asignar: la carreta no tiene permiso ${clasificacionCarga}`
        );
        return;
      }

      if (
        !validarPermisoPorClasificacion(
          conductorSeleccionado,
          clasificacionCarga
        )
      ) {
        setError(
          `No se puede asignar: el conductor no tiene permiso ${clasificacionCarga}`
        );
        return;
      }

      const dataEnviar = {
        ordenServicioId: Number(form.ordenServicioId),
        vehiculoPrincipalId: Number(form.vehiculoPrincipalId),
        vehiculoSecundarioId: form.vehiculoSecundarioId
          ? Number(form.vehiculoSecundarioId)
          : null,
        conductorId: Number(form.conductorId),
        fechaInicioTraslado: form.fechaInicioTraslado,
        horaCita: form.horaCita,
        numeroContenedor: form.numeroContenedor,
        observaciones: form.observaciones,
        motivoEdicionEnRuta: form.motivoEdicionEnRuta || "",
      };

      if (isEdit && data) {
        await actualizarProgramacionViaje(getId(data), dataEnviar);
      } else if (crearProgramacionViaje) {
        await crearProgramacionViaje(dataEnviar);
      } else {
        await createProgramacionViaje(dataEnviar);
      }

      if (obtenerProgramacionesViaje) {
        await obtenerProgramacionesViaje();
      } else {
        await getProgramacionesViaje?.();
      }

      cerrarModal();
    } catch (error) {
      setError(
        error?.response?.data?.message ||
          error?.message ||
          "Error al guardar la programación de viaje"
      );
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-panel max-w-3xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">
              {isView
                ? "Detalle de programación"
                : isEdit
                ? "Editar programación de viaje"
                : "Nueva programación de viaje"}
            </h2>

            <p className="text-muted text-sm">
              {(isView || isEdit) && data
                ? `${data.numeroProgramacion || `PV-${String(getId(data)).padStart(6, "0")}`} · Orden ${data.ordenServicio?.numeroOrden || "-"}`
                : "Asigna orden, tracto, carreta y conductor."}
            </p>
          </div>

          <button
            type="button"
            onClick={cerrarModal}
            className="text-muted text-2xl hover:text-blue-500"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {(isView || isEdit) && data && (
          <div className="mb-4 grid gap-3 rounded-lg border border-[var(--app-border)] p-3 text-sm md:grid-cols-2">
            <div>
              <p className="text-faint text-xs">Llegada cliente</p>
              <p className="text-main font-semibold">
                {formatearFechaHora(data.fechaHoraLlegadaCliente)}
              </p>
            </div>
            <div>
              <p className="text-faint text-xs">Entrega</p>
              <p className="text-main font-semibold">
                {formatearFechaHora(data.fechaHoraEntrega)}
              </p>
            </div>
            <div>
              <p className="text-faint text-xs">Standby</p>
              <p className="text-main font-semibold">
                {formatearStandby(data.standbyMinutos)}
              </p>
            </div>
            <div>
              <p className="text-faint text-xs">Historial</p>
              <p className="text-main font-semibold">
                {Array.isArray(data.historialEstados)
                  ? `${data.historialEstados.length} cambio(s)`
                  : "0 cambio(s)"}
              </p>
            </div>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          <div className="md:col-span-2">
            <label className="text-muted mb-1 block text-sm">
              Orden de servicio
            </label>

            <select
              name="ordenServicioId"
              value={form.ordenServicioId}
              onChange={handleChange}
              disabled={isReadOnly || isEdit}
              className="input p-3"
              required
            >
              <option value="">Seleccionar orden de servicio</option>

              {(isView || isEdit) && data?.ordenServicio && (
                <option value={form.ordenServicioId}>
                  {data.ordenServicio?.numeroOrden || "Orden seleccionada"} -{" "}
                  {obtenerRazonSocialCliente(data.ordenServicio)} -{" "}
                  {formatearResumenCarga(data.ordenServicio)} -{" "}
                  {formatearCupoViajes(data.ordenServicio)}
                </option>
              )}

              {!isView && !isEdit &&
                ordenesDisponibles.map((orden) => (
                  <option key={getId(orden)} value={getId(orden)}>
                    {orden.numeroOrden || "SIN N°"} -{" "}
                    {obtenerRazonSocialCliente(orden)} -{" "}
                    {formatearResumenCarga(orden)} - {formatearCupoViajes(orden)}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="text-muted mb-1 block text-sm">
              Vehículo principal / Tracto
            </label>

            <select
              name="vehiculoPrincipalId"
              value={form.vehiculoPrincipalId}
              onChange={handleChange}
              disabled={isReadOnly}
              className="input p-3"
              required
            >
              <option value="">Seleccionar TRACTO</option>

              {tractos.map((unidad) => (
                <option key={getId(unidad)} value={getId(unidad)}>
                  {obtenerPlaca(unidad) || "SIN PLACA"}
                  {unidad.marca ? ` - ${unidad.marca}` : ""}
                  {` - ${obtenerPermisosTexto(unidad)}`}
                </option>
              ))}
            </select>

            {!isView && tractos.length === 0 && (
              <p className="mt-1 text-xs text-yellow-400">
                No hay tractos activos registrados.
              </p>
            )}
          </div>

          <div>
            <label className="text-muted mb-1 block text-sm">
              Vehículo secundario / Carreta
            </label>

            <select
              name="vehiculoSecundarioId"
              value={form.vehiculoSecundarioId}
              onChange={handleChange}
              disabled={isReadOnly}
              className="input p-3"
            >
              <option value="">Seleccionar CARRETA</option>

              {carretas.map((unidad) => (
                <option key={getId(unidad)} value={getId(unidad)}>
                  {obtenerPlaca(unidad) || "SIN PLACA"}
                  {unidad.marca ? ` - ${unidad.marca}` : ""}
                  {` - ${obtenerPermisosTexto(unidad)}`}
                </option>
              ))}
            </select>

            {!isView && carretas.length === 0 && (
              <p className="mt-1 text-xs text-yellow-400">
                No hay carretas activas registradas.
              </p>
            )}
          </div>

          <div>
            <label className="text-muted mb-1 block text-sm">
              Conductor
            </label>

            <select
              name="conductorId"
              value={form.conductorId}
              onChange={handleChange}
              disabled={isReadOnly}
              className="input p-3"
              required
            >
              <option value="">Seleccionar conductor</option>

              {listaConductores.map((conductor) => (
                <option key={getId(conductor)} value={getId(conductor)}>
                  {conductor.nombres} {conductor.apellidos} -{" "}
                  {obtenerPermisosTexto(conductor)}
                </option>
              ))}
            </select>

            {!isView && listaConductores.length === 0 && (
              <p className="mt-1 text-xs text-yellow-400">
                No hay conductores registrados.
              </p>
            )}
          </div>

          <div>
            <label className="text-muted mb-1 block text-sm">
              Fecha inicio traslado
            </label>

            <input
              type="date"
              name="fechaInicioTraslado"
              value={form.fechaInicioTraslado}
              onChange={handleChange}
              disabled={isReadOnly}
              className="input p-3"
              required
            />
          </div>

          <div>
            <label className="text-muted mb-1 block text-sm">
              Hora de cita
            </label>

            <input
              type="time"
              name="horaCita"
              value={form.horaCita}
              onChange={handleChange}
              disabled={isReadOnly}
              className="input p-3"
              required
            />
          </div>

          <div>
            <label className="text-muted mb-1 block text-sm">
              N° contenedor
            </label>

            <input
              type="text"
              name="numeroContenedor"
              value={form.numeroContenedor}
              onChange={handleChange}
              disabled={isReadOnly}
              placeholder="Opcional"
              className="input p-3"
            />
          </div>

          <div>
            <label className="text-muted mb-1 block text-sm">
              Observaciones
            </label>

            <textarea
              name="observaciones"
              value={form.observaciones}
              onChange={handleChange}
              disabled={isReadOnly}
              placeholder="Indique una observación para la programación"
              className="input resize-none p-3"
              rows="3"
            />
          </div>

          {requiresRouteEditReason && (
            <div className="md:col-span-2">
              <label className="text-muted mb-1 block text-sm">
                Motivo de edición en ruta
              </label>

              <textarea
                name="motivoEdicionEnRuta"
                value={form.motivoEdicionEnRuta || ""}
                onChange={handleChange}
                placeholder="Ejemplo: cambio de tracto por falla mecánica"
                className="input resize-none p-3"
                rows="2"
                required
              />

              <p className="text-faint mt-1 text-xs">
                Este motivo quedará registrado en el historial de la programación.
              </p>
            </div>
          )}

          <div className="mt-4 flex justify-end gap-3 md:col-span-2">
            <button
              type="button"
              onClick={cerrarModal}
              className="btn-secondary px-3 py-1.5"
            >
              {isView ? "Cerrar" : "Cancelar"}
            </button>

            {!isView && (
              <button
                type="submit"
                className="btn-primary px-3 py-1.5"
              >
                {isEdit ? "Guardar cambios" : "Guardar programación"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProgramacionViajeModal;
