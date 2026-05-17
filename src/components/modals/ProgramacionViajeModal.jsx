import { useEffect, useRef, useState } from "react";
import { useOrdenServicio } from "../../context/OrdenServicioContext";
import { useUnidades } from "../../context/UnidadContext";
import { useConductores } from "../../context/ConductorContext";
import { useProgramacionViaje } from "../../context/ProgramacionViajeContext";
import { getTodayInputDate } from "../../utils/date";

const createInitialForm = () => ({
  ordenServicioId: "",
  vehiculoPrincipalId: "",
  vehiculoSecundarioId: "",
  conductorId: "",
  fechaInicioTraslado: getTodayInputDate(),
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

  const { ordenesServicio = [], obtenerOrdenesServicio } = useOrdenServicio();

  const { unidades = [], obtenerUnidades } = useUnidades();

  const { conductores = [], obtenerConductores, getConductores } =
    useConductores();

  const {
    crearProgramacionViaje,
    createProgramacionViaje,
    obtenerProgramacionesViaje,
    getProgramacionesViaje,
  } = useProgramacionViaje();

  const cargarDatosRef = useRef({
    obtenerOrdenesServicio,
    obtenerUnidades,
    obtenerConductores,
    getConductores,
  });

  useEffect(() => {
    cargarDatosRef.current = {
      obtenerOrdenesServicio,
      obtenerUnidades,
      obtenerConductores,
      getConductores,
    };
  }, [
    obtenerOrdenesServicio,
    obtenerUnidades,
    obtenerConductores,
    getConductores,
  ]);

  const [form, setForm] = useState(createInitialForm);
  const [error, setError] = useState("");

  const isView = mode === "view";

  const normalizar = (valor) =>
    String(valor || "")
      .trim()
      .toUpperCase();

  const getId = (item) => item?.id ?? item?._id ?? "";

  const formatearFechaInput = (fecha) => {
    if (!fecha) return "";

    const fechaObj = new Date(fecha);

    if (Number.isNaN(fechaObj.getTime())) return "";

    return fechaObj.toISOString().slice(0, 10);
  };

  useEffect(() => {
    if (!modalOpen) return;

    cargarDatosRef.current.obtenerOrdenesServicio?.();
    cargarDatosRef.current.obtenerUnidades?.();

    if (cargarDatosRef.current.obtenerConductores) {
      cargarDatosRef.current.obtenerConductores();
    } else {
      cargarDatosRef.current.getConductores?.();
    }

    setError("");

    if (isView && data) {
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

        observaciones: data.observaciones || "",
      });
    } else {
      setForm(createInitialForm());
    }
  }, [modalOpen, isView, data]);

  if (!modalOpen) return null;

  const listaUnidades = Array.isArray(unidades) ? unidades : [];
  const listaOrdenes = Array.isArray(ordenesServicio) ? ordenesServicio : [];
  const listaConductores = Array.isArray(conductores) ? conductores : [];

  const tractos = listaUnidades.filter((unidad) => {
    const tipo = normalizar(unidad.tipoUnidad);
    const estado = normalizar(unidad.estado);

    return tipo === "TRACTO" && estado === "ACTIVO";
  });

  const carretas = listaUnidades.filter((unidad) => {
    const tipo = normalizar(unidad.tipoUnidad);
    const estado = normalizar(unidad.estado);

    return tipo === "CARRETA" && estado === "ACTIVO";
  });

  const ordenesDisponibles = listaOrdenes.filter((orden) => {
    const estado = normalizar(orden.estado);

    return (
      !orden.viajeCreado &&
      estado !== "ANULADA" &&
      estado !== "FINALIZADA" &&
      estado !== "PROGRAMADA"
    );
  });

  const obtenerRazonSocialCliente = (orden) => {
    return (
      orden?.clienteSolicitanteRazonSocial ||
      orden?.clienteSolicitante?.razonSocial ||
      orden?.cliente?.razonSocial ||
      "Cliente sin nombre"
    );
  };

  const obtenerPlaca = (unidad) => {
    return unidad?.placa || unidad?.numeroPlaca || unidad?.placaUnidad || "";
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

    if (isView) return;

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

      const unidadSeleccionada = tractos.find(
        (unidad) => String(getId(unidad)) === String(form.vehiculoPrincipalId)
      );

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

      const dataEnviar = {
        ordenServicioId: Number(form.ordenServicioId),
        vehiculoPrincipalId: Number(form.vehiculoPrincipalId),
        vehiculoSecundarioId: form.vehiculoSecundarioId
          ? Number(form.vehiculoSecundarioId)
          : null,
        conductorId: Number(form.conductorId),
        fechaInicioTraslado: form.fechaInicioTraslado,
        observaciones: form.observaciones,
      };

      if (crearProgramacionViaje) {
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
          "Error al crear la programación de viaje"
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm">
      <div className="panel w-full max-w-3xl p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">
              {isView
                ? "Detalle de programación"
                : "Nueva programación de viaje"}
            </h2>

            <p className="text-muted text-sm">
              Asigna orden, tracto, carreta y conductor.
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
              disabled={isView}
              className="input p-3"
              required
            >
              <option value="">Seleccionar orden de servicio</option>

              {isView && data?.ordenServicio && (
                <option value={form.ordenServicioId}>
                  {data.ordenServicio?.numeroOrden || "Orden seleccionada"} -{" "}
                  {obtenerRazonSocialCliente(data.ordenServicio)}
                </option>
              )}

              {!isView &&
                ordenesDisponibles.map((orden) => (
                  <option key={getId(orden)} value={getId(orden)}>
                    {orden.numeroOrden || "SIN N°"} -{" "}
                    {obtenerRazonSocialCliente(orden)}
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
              disabled={isView}
              className="input p-3"
              required
            >
              <option value="">Seleccionar TRACTO</option>

              {tractos.map((unidad) => (
                <option key={getId(unidad)} value={getId(unidad)}>
                  {obtenerPlaca(unidad) || "SIN PLACA"}
                  {unidad.marca ? ` - ${unidad.marca}` : ""}
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
              disabled={isView}
              className="input p-3"
            >
              <option value="">Seleccionar CARRETA</option>

              {carretas.map((unidad) => (
                <option key={getId(unidad)} value={getId(unidad)}>
                  {obtenerPlaca(unidad) || "SIN PLACA"}
                  {unidad.marca ? ` - ${unidad.marca}` : ""}
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
              disabled={isView}
              className="input p-3"
              required
            >
              <option value="">Seleccionar conductor</option>

              {listaConductores.map((conductor) => (
                <option key={getId(conductor)} value={getId(conductor)}>
                  {conductor.nombres} {conductor.apellidos}
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
              disabled={isView}
              className="input p-3"
              required
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
              disabled={isView}
              placeholder="Indique una observación para la programación"
              className="input resize-none p-3"
              rows="3"
            />
          </div>

          <div className="mt-4 flex justify-end gap-3 md:col-span-2">
            <button
              type="button"
              onClick={cerrarModal}
              className="btn-secondary px-4 py-2"
            >
              {isView ? "Cerrar" : "Cancelar"}
            </button>

            {!isView && (
              <button
                type="submit"
                className="btn-primary px-4 py-2"
              >
                Guardar programación
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProgramacionViajeModal;
