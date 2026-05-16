import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { FaTimes } from "react-icons/fa";
import { useOrdenesServicio } from "../../context/OrdenServicioContext";
import { useClientes } from "../../context/ClienteContext";

const datosPersonaVacios = {
  tipoDocumento: "6",
  numeroDocumento: "",
  razonSocial: "",
  direccion: "",
};

const initialForm = {
  fechaProgramada: "",
  observaciones: "",
  estado: "PENDIENTE",

  clienteSolicitante: { ...datosPersonaVacios },
  clienteEs: "OTRO",

  remitente: { ...datosPersonaVacios },
  destinatario: { ...datosPersonaVacios },

  partida: {
    ubigeo: "",
    direccion: "",
    referencia: "",
  },

  llegada: {
    ubigeo: "",
    direccion: "",
    referencia: "",
  },

  transporte: {
    mtc: "",
  },
};

const getItemId = (item) => item?.id ?? item?._id;

const compararId = (a, b) => String(a) === String(b);

const OrdenServicioModal = ({
  isOpen,
  onClose,
  mode = "create",
  orden = null,
}) => {
  const { crearOrdenServicio, editarOrdenServicio } = useOrdenesServicio();

  const { clientes, getClientes, limpiarDatosRelacionados } = useClientes();

  const clientesActionsRef = useRef({
    getClientes,
    limpiarDatosRelacionados,
  });

  useEffect(() => {
    clientesActionsRef.current = {
      getClientes,
      limpiarDatosRelacionados,
    };
  }, [getClientes, limpiarDatosRelacionados]);

  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);

  const [clienteIdSeleccionado, setClienteIdSeleccionado] = useState("");
  const [remitenteIdSeleccionado, setRemitenteIdSeleccionado] = useState("");
  const [destinatarioIdSeleccionado, setDestinatarioIdSeleccionado] =
    useState("");

  const [remitentesDisponibles, setRemitentesDisponibles] = useState([]);
  const [destinatariosDisponibles, setDestinatariosDisponibles] = useState([]);

  const [direccionPartidaIdSeleccionada, setDireccionPartidaIdSeleccionada] =
    useState("");
  const [direccionLlegadaIdSeleccionada, setDireccionLlegadaIdSeleccionada] =
    useState("");

  const isCreateMode = mode === "create";
  const isEditMode = mode === "edit";
  const isViewMode = mode === "view";

  useEffect(() => {
    if (!isOpen) return;

    clientesActionsRef.current.getClientes?.();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    if ((isEditMode || isViewMode) && orden) {
      const clienteBase =
        orden.clienteSolicitante || orden.remitente || datosPersonaVacios;

      setForm({
        fechaProgramada: orden.fechaProgramada
          ? orden.fechaProgramada.slice(0, 10)
          : "",
        observaciones: orden.observaciones || "",
        estado: orden.estado || "PENDIENTE",

        clienteSolicitante: {
          tipoDocumento: clienteBase?.tipoDocumento || "6",
          numeroDocumento: clienteBase?.numeroDocumento || "",
          razonSocial: clienteBase?.razonSocial || "",
          direccion: clienteBase?.direccion || "",
        },

        clienteEs: orden.clienteEs || "OTRO",

        remitente: {
          tipoDocumento: orden.remitente?.tipoDocumento || "6",
          numeroDocumento: orden.remitente?.numeroDocumento || "",
          razonSocial: orden.remitente?.razonSocial || "",
          direccion: orden.remitente?.direccion || "",
        },

        destinatario: {
          tipoDocumento: orden.destinatario?.tipoDocumento || "6",
          numeroDocumento: orden.destinatario?.numeroDocumento || "",
          razonSocial: orden.destinatario?.razonSocial || "",
          direccion: orden.destinatario?.direccion || "",
        },

        partida: {
          ubigeo: orden.partida?.ubigeo || "",
          direccion: orden.partida?.direccion || "",
          referencia: orden.partida?.referencia || "",
        },

        llegada: {
          ubigeo: orden.llegada?.ubigeo || "",
          direccion: orden.llegada?.direccion || "",
          referencia: orden.llegada?.referencia || "",
        },

        transporte: {
          mtc: orden.transporte?.mtc || "",
        },
      });
    }

    if (isCreateMode) {
      setForm(initialForm);
      setClienteIdSeleccionado("");
      setRemitenteIdSeleccionado("");
      setDestinatarioIdSeleccionado("");
      setDireccionPartidaIdSeleccionada("");
      setDireccionLlegadaIdSeleccionada("");
      setRemitentesDisponibles([]);
      setDestinatariosDisponibles([]);
      clientesActionsRef.current.limpiarDatosRelacionados?.();
    }
  }, [isOpen, mode, orden, isCreateMode, isEditMode, isViewMode]);

  if (!isOpen) return null;

  const inputClass =
    "w-full rounded-xl border border-gray-700 bg-gray-950/70 px-3 py-2.5 text-sm text-gray-100 placeholder-gray-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-gray-900/60 disabled:text-gray-400 disabled:opacity-80";

  const labelClass = "mb-1.5 block text-xs font-semibold text-gray-300";

  const sectionClass =
    "rounded-2xl border border-gray-800 bg-gray-950/35 p-4 shadow-sm sm:p-5";

  const sectionTitleClass =
    "mb-4 flex items-center justify-between border-b border-gray-800 pb-3";

  const disabled = isViewMode || loading;

  const getTitulo = () => {
    if (isCreateMode) return "Nueva Orden de Servicio";
    if (isEditMode) return "Editar Orden de Servicio";
    return "Detalle de Orden de Servicio";
  };

  const getSubtitulo = () => {
    if (isCreateMode) {
      return "Completa los datos necesarios para registrar el servicio.";
    }

    return orden?.numeroOrden || "";
  };

  const resetForm = () => {
    setForm(initialForm);
    setClienteIdSeleccionado("");
    setRemitenteIdSeleccionado("");
    setDestinatarioIdSeleccionado("");
    setDireccionPartidaIdSeleccionada("");
    setDireccionLlegadaIdSeleccionada("");
    setRemitentesDisponibles([]);
    setDestinatariosDisponibles([]);
    limpiarDatosRelacionados();
  };

  const handleClose = () => {
    if (loading) return;
    resetForm();
    onClose();
  };

  const convertirClienteAPersona = (cliente) => ({
    tipoDocumento: cliente?.tipoDocumento || "6",
    numeroDocumento: cliente?.numeroDocumento || "",
    razonSocial: cliente?.razonSocial || "",
    direccion: cliente?.direccionFiscal || cliente?.direccion || "",
  });

  const convertirEntidadAPersona = (entidad, direccion = null) => ({
    tipoDocumento: entidad?.tipoDocumento || "6",
    numeroDocumento: entidad?.numeroDocumento || "",
    razonSocial: entidad?.razonSocial || "",
    direccion: direccion?.direccion || entidad?.direccion || "",
  });

  const obtenerEntidadesRelacionadas = (cliente) => {
    const entidades = cliente?.entidadesRelacionadas || [];

    const remitentes = entidades.filter(
      (entidad) => String(entidad.tipo).toUpperCase() === "REMITENTE"
    );

    const destinatarios = entidades.filter(
      (entidad) => String(entidad.tipo).toUpperCase() === "DESTINATARIO"
    );

    return {
      remitentes,
      destinatarios,
    };
  };

  const handleClientePrecargadoChange = (e) => {
    if (isViewMode) return;

    const clienteId = e.target.value;

    setClienteIdSeleccionado(clienteId);
    setRemitenteIdSeleccionado("");
    setDestinatarioIdSeleccionado("");
    setDireccionPartidaIdSeleccionada("");
    setDireccionLlegadaIdSeleccionada("");
    setRemitentesDisponibles([]);
    setDestinatariosDisponibles([]);

    if (!clienteId) {
      limpiarDatosRelacionados();

      setForm((prev) => ({
        ...prev,
        clienteSolicitante: { ...datosPersonaVacios },
        remitente: { ...datosPersonaVacios },
        destinatario: { ...datosPersonaVacios },
        partida: {
          ubigeo: "",
          direccion: "",
          referencia: "",
        },
        llegada: {
          ubigeo: "",
          direccion: "",
          referencia: "",
        },
      }));

      return;
    }

    const cliente = clientes.find((item) =>
      compararId(getItemId(item), clienteId)
    );

    if (!cliente) return;

    const { remitentes, destinatarios } = obtenerEntidadesRelacionadas(cliente);

    setRemitentesDisponibles(remitentes);
    setDestinatariosDisponibles(destinatarios);

    setForm((prev) => ({
      ...prev,
      clienteSolicitante: convertirClienteAPersona(cliente),
      clienteEs: "OTRO",
      remitente: { ...datosPersonaVacios },
      destinatario: { ...datosPersonaVacios },
      partida: {
        ubigeo: "",
        direccion: "",
        referencia: "",
      },
      llegada: {
        ubigeo: "",
        direccion: "",
        referencia: "",
      },
    }));
  };

  const handleRemitentePrecargadoChange = (e) => {
    if (isViewMode) return;

    const remitenteId = e.target.value;

    setRemitenteIdSeleccionado(remitenteId);
    setDireccionPartidaIdSeleccionada("");

    const remitente = remitentesDisponibles.find((item) =>
      compararId(getItemId(item), remitenteId)
    );

    if (!remitente) {
      setForm((prev) => ({
        ...prev,
        remitente: { ...datosPersonaVacios },
        partida: {
          ubigeo: "",
          direccion: "",
          referencia: "",
        },
      }));

      return;
    }

    setForm((prev) => ({
      ...prev,
      remitente: convertirEntidadAPersona(remitente),
      partida: {
        ubigeo: "",
        direccion: "",
        referencia: "",
      },
    }));
  };

  const handleDestinatarioPrecargadoChange = (e) => {
    if (isViewMode) return;

    const destinatarioId = e.target.value;

    setDestinatarioIdSeleccionado(destinatarioId);
    setDireccionLlegadaIdSeleccionada("");

    const destinatario = destinatariosDisponibles.find((item) =>
      compararId(getItemId(item), destinatarioId)
    );

    if (!destinatario) {
      setForm((prev) => ({
        ...prev,
        destinatario: { ...datosPersonaVacios },
        llegada: {
          ubigeo: "",
          direccion: "",
          referencia: "",
        },
      }));

      return;
    }

    setForm((prev) => ({
      ...prev,
      destinatario: convertirEntidadAPersona(destinatario),
      llegada: {
        ubigeo: "",
        direccion: "",
        referencia: "",
      },
    }));
  };

  const handleDireccionPartidaChange = (e) => {
    if (isViewMode) return;

    const direccionId = e.target.value;

    setDireccionPartidaIdSeleccionada(direccionId);

    const remitente = remitentesDisponibles.find((item) =>
      compararId(getItemId(item), remitenteIdSeleccionado)
    );

    const direccion = remitente?.direcciones?.find((item) =>
      compararId(getItemId(item), direccionId)
    );

    if (!direccion) {
      setForm((prev) => ({
        ...prev,
        remitente: {
          ...prev.remitente,
          direccion: "",
        },
        partida: {
          ubigeo: "",
          direccion: "",
          referencia: "",
        },
      }));

      return;
    }

    setForm((prev) => ({
      ...prev,
      remitente: {
        ...prev.remitente,
        direccion: direccion.direccion || "",
      },
      partida: {
        ubigeo: direccion.ubigeo || "",
        direccion: direccion.direccion || "",
        referencia: direccion.referencia || "",
      },
    }));
  };

  const handleDireccionLlegadaChange = (e) => {
    if (isViewMode) return;

    const direccionId = e.target.value;

    setDireccionLlegadaIdSeleccionada(direccionId);

    const destinatario = destinatariosDisponibles.find((item) =>
      compararId(getItemId(item), destinatarioIdSeleccionado)
    );

    const direccion = destinatario?.direcciones?.find((item) =>
      compararId(getItemId(item), direccionId)
    );

    if (!direccion) {
      setForm((prev) => ({
        ...prev,
        destinatario: {
          ...prev.destinatario,
          direccion: "",
        },
        llegada: {
          ubigeo: "",
          direccion: "",
          referencia: "",
        },
      }));

      return;
    }

    setForm((prev) => ({
      ...prev,
      destinatario: {
        ...prev.destinatario,
        direccion: direccion.direccion || "",
      },
      llegada: {
        ubigeo: direccion.ubigeo || "",
        direccion: direccion.direccion || "",
        referencia: direccion.referencia || "",
      },
    }));
  };

  const handleChange = (e) => {
    if (isViewMode) return;

    const { name, value } = e.target;
    const keys = name.split(".");

    if (name === "clienteEs") {
      setForm((prev) => ({
        ...prev,
        clienteEs: value,
      }));

      return;
    }

    if (keys.length === 1) {
      setForm((prev) => ({
        ...prev,
        [name]: value,
      }));
      return;
    }

    const [section, field] = keys;

    setForm((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const validarFormulario = () => {
    if (!form.fechaProgramada) {
      toast.error("La fecha programada es obligatoria");
      return false;
    }

    if (!form.clienteSolicitante.numeroDocumento.trim()) {
      toast.error("Ingresa el número de documento del cliente");
      return false;
    }

    if (!form.clienteSolicitante.razonSocial.trim()) {
      toast.error("Ingresa la razón social del cliente");
      return false;
    }

    if (!form.clienteSolicitante.direccion.trim()) {
      toast.error("Ingresa la dirección del cliente");
      return false;
    }

    if (!form.remitente.numeroDocumento.trim()) {
      toast.error("Selecciona o ingresa el remitente");
      return false;
    }

    if (!form.remitente.razonSocial.trim()) {
      toast.error("Ingresa la razón social del remitente");
      return false;
    }

    if (!form.destinatario.numeroDocumento.trim()) {
      toast.error("Selecciona o ingresa el destinatario");
      return false;
    }

    if (!form.destinatario.razonSocial.trim()) {
      toast.error("Ingresa la razón social del destinatario");
      return false;
    }

    if (!form.partida.ubigeo.trim()) {
      toast.error("Ingresa el ubigeo de partida");
      return false;
    }

    if (form.partida.ubigeo.trim().length !== 6) {
      toast.error("El ubigeo de partida debe tener 6 dígitos");
      return false;
    }

    if (!form.partida.direccion.trim()) {
      toast.error("Ingresa la dirección de partida");
      return false;
    }

    if (!form.llegada.ubigeo.trim()) {
      toast.error("Ingresa el ubigeo de llegada");
      return false;
    }

    if (form.llegada.ubigeo.trim().length !== 6) {
      toast.error("El ubigeo de llegada debe tener 6 dígitos");
      return false;
    }

    if (!form.llegada.direccion.trim()) {
      toast.error("Ingresa la dirección de llegada");
      return false;
    }

    return true;
  };

  const limpiarPayloadOrden = () => {
    const data = {
      ...form,
      observaciones: form.observaciones.trim().toUpperCase(),

      clienteSolicitante: {
        tipoDocumento: form.clienteSolicitante.tipoDocumento,
        numeroDocumento: form.clienteSolicitante.numeroDocumento.trim(),
        razonSocial: form.clienteSolicitante.razonSocial.trim().toUpperCase(),
        direccion: form.clienteSolicitante.direccion.trim().toUpperCase(),
      },

      remitente: {
        tipoDocumento: form.remitente.tipoDocumento,
        numeroDocumento: form.remitente.numeroDocumento.trim(),
        razonSocial: form.remitente.razonSocial.trim().toUpperCase(),
        direccion: form.remitente.direccion.trim().toUpperCase(),
      },

      destinatario: {
        tipoDocumento: form.destinatario.tipoDocumento,
        numeroDocumento: form.destinatario.numeroDocumento.trim(),
        razonSocial: form.destinatario.razonSocial.trim().toUpperCase(),
        direccion: form.destinatario.direccion.trim().toUpperCase(),
      },

      partida: {
        ubigeo: form.partida.ubigeo.trim(),
        direccion: form.partida.direccion.trim().toUpperCase(),
        referencia: form.partida.referencia.trim().toUpperCase(),
      },

      llegada: {
        ubigeo: form.llegada.ubigeo.trim(),
        direccion: form.llegada.direccion.trim().toUpperCase(),
        referencia: form.llegada.referencia.trim().toUpperCase(),
      },

      transporte: {
        mtc: form.transporte.mtc.trim().toUpperCase(),
      },
    };

    delete data.detalleCarga;

    return data;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isViewMode) return;

    if (!validarFormulario()) return;

    try {
      setLoading(true);

      const data = limpiarPayloadOrden();

      if (isCreateMode) {
        await crearOrdenServicio(data);
        toast.success("Orden de servicio creada correctamente");
      }

      if (isEditMode) {
        const ordenId = getItemId(orden);

        if (!ordenId) {
          toast.error("No se encontró el ID de la orden");
          return;
        }

        await editarOrdenServicio(ordenId, data);
        toast.success("Orden de servicio actualizada correctamente");
      }

    resetForm();
      onClose();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Error al guardar la orden de servicio"
      );
    } finally {
      setLoading(false);
    }
  };

  const renderPersonaFields = (prefix, mostrarDireccion = true) => (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
      <div className="md:col-span-2">
        <label className={labelClass}>Tipo doc.</label>
        <select
          name={`${prefix}.tipoDocumento`}
          value={form[prefix].tipoDocumento}
          onChange={handleChange}
          disabled={disabled}
          className={inputClass}
        >
          <option value="6">RUC</option>
          <option value="1">DNI</option>
          <option value="4">Carnet de extranjería</option>
          <option value="7">Pasaporte</option>
          <option value="A">Cédula diplomática</option>
          <option value="0">No domiciliado</option>
        </select>
      </div>

      <div className="md:col-span-3">
        <label className={labelClass}>N° documento</label>
        <input
          type="text"
          name={`${prefix}.numeroDocumento`}
          value={form[prefix].numeroDocumento}
          onChange={handleChange}
          disabled={disabled}
          placeholder="Ej: 20600695771"
          className={inputClass}
        />
      </div>

      <div className="md:col-span-7">
        <label className={labelClass}>Razón social / nombre</label>
        <input
          type="text"
          name={`${prefix}.razonSocial`}
          value={form[prefix].razonSocial}
          onChange={handleChange}
          disabled={disabled}
          placeholder="Ej: SAN FERNANDO S.A."
          className={inputClass}
        />
      </div>

      {mostrarDireccion && (
        <div className="md:col-span-12">
          <label className={labelClass}>Dirección</label>
          <input
            type="text"
            name={`${prefix}.direccion`}
            value={form[prefix].direccion}
            onChange={handleChange}
            disabled={disabled}
            placeholder="Dirección"
            className={inputClass}
          />
        </div>
      )}
    </div>
  );

  const remitenteSeleccionado = remitentesDisponibles.find((item) =>
    compararId(getItemId(item), remitenteIdSeleccionado)
  );

  const destinatarioSeleccionado = destinatariosDisponibles.find((item) =>
    compararId(getItemId(item), destinatarioIdSeleccionado)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-3 py-4 sm:px-4">
      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-gray-800 bg-gray-900 shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-gray-800 bg-gray-900 px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-xl font-bold text-white">{getTitulo()}</h2>
            <p className="text-sm text-gray-400">{getSubtitulo()}</p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="text-2xl text-gray-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            title="Cerrar"
          >
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-6 overflow-y-auto p-4 sm:p-6">
            <section className={sectionClass}>
              <div className={sectionTitleClass}>
                <div>
                  <h3 className="text-base font-bold text-gray-100">
                    Datos generales
                  </h3>
                  <p className="text-xs text-gray-500">
                    Información principal del servicio.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                <div className="md:col-span-3">
                  <label className={labelClass}>Fecha programada</label>
                  <input
                    type="date"
                    name="fechaProgramada"
                    value={form.fechaProgramada}
                    onChange={handleChange}
                    disabled={disabled}
                    className={inputClass}
                  />
                </div>

                {(isEditMode || isViewMode) && (
                  <div className="md:col-span-3">
                    <label className={labelClass}>Estado</label>
                    <select
                      name="estado"
                      value={form.estado}
                      onChange={handleChange}
                      disabled={disabled}
                      className={inputClass}
                    >
                      <option value="PENDIENTE">PENDIENTE</option>
                      <option value="PROGRAMADA">PROGRAMADA</option>
                      <option value="EN_PROCESO">EN PROCESO</option>
                      <option value="FINALIZADA">FINALIZADA</option>
                      <option value="ANULADA">ANULADA</option>
                    </select>
                  </div>
                )}

                <div
                  className={isCreateMode ? "md:col-span-9" : "md:col-span-6"}
                >
                  <label className={labelClass}>Observaciones</label>
                  <input
                    type="text"
                    name="observaciones"
                    value={form.observaciones}
                    onChange={handleChange}
                    disabled={disabled}
                    placeholder="Ej: Coordinar ingreso con vigilancia"
                    className={inputClass}
                  />
                </div>
              </div>
            </section>

            <section className={sectionClass}>
              <div className={sectionTitleClass}>
                <div>
                  <h3 className="text-base font-bold text-gray-100">
                    Cliente solicitante
                  </h3>
                  <p className="text-xs text-gray-500">
                    Empresa que solicita el servicio.
                  </p>
                </div>
              </div>

              {!isViewMode && (
                <div className="mb-4">
                  <label className={labelClass}>Cliente precargado</label>
                  <select
                    value={clienteIdSeleccionado}
                    onChange={handleClientePrecargadoChange}
                    disabled={disabled}
                    className={inputClass}
                  >
                    <option value="">Seleccione un cliente</option>
                    {clientes.map((cliente) => {
                      const clienteId = getItemId(cliente);

                      return (
                        <option key={clienteId} value={clienteId}>
                          {cliente.alias || cliente.razonSocial} -{" "}
                          {cliente.numeroDocumento}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {renderPersonaFields("clienteSolicitante", true)}
            </section>

            <section className={sectionClass}>
              <div className={sectionTitleClass}>
                <div>
                  <h3 className="text-base font-bold text-gray-100">
                    Remitente
                  </h3>
                  <p className="text-xs text-gray-500">
                    Empresa desde donde inicia el traslado.
                  </p>
                </div>
              </div>

              {!isViewMode && (
                <div className="mb-4">
                  <label className={labelClass}>Remitente precargado</label>
                  <select
                    value={remitenteIdSeleccionado}
                    onChange={handleRemitentePrecargadoChange}
                    disabled={disabled || !clienteIdSeleccionado}
                    className={inputClass}
                  >
                    <option value="">Seleccione un remitente</option>
                    {remitentesDisponibles.map((remitente) => {
                      const remitenteId = getItemId(remitente);

                      return (
                        <option key={remitenteId} value={remitenteId}>
                          {remitente.alias || remitente.razonSocial} -{" "}
                          {remitente.numeroDocumento}
                        </option>
                      );
                    })}
                  </select>

                  {clienteIdSeleccionado && remitentesDisponibles.length === 0 && (
                    <p className="mt-2 text-xs text-yellow-400">
                      Este cliente no tiene remitentes registrados.
                    </p>
                  )}
                </div>
              )}

              {renderPersonaFields("remitente", false)}
            </section>

            <section className={sectionClass}>
              <div className={sectionTitleClass}>
                <div>
                  <h3 className="text-base font-bold text-gray-100">
                    Destinatario
                  </h3>
                  <p className="text-xs text-gray-500">
                    Empresa donde finaliza el traslado.
                  </p>
                </div>
              </div>

              {!isViewMode && (
                <div className="mb-4">
                  <label className={labelClass}>Destinatario precargado</label>
                  <select
                    value={destinatarioIdSeleccionado}
                    onChange={handleDestinatarioPrecargadoChange}
                    disabled={disabled || !clienteIdSeleccionado}
                    className={inputClass}
                  >
                    <option value="">Seleccione un destinatario</option>
                    {destinatariosDisponibles.map((destinatario) => {
                      const destinatarioId = getItemId(destinatario);

                      return (
                        <option key={destinatarioId} value={destinatarioId}>
                          {destinatario.alias || destinatario.razonSocial} -{" "}
                          {destinatario.numeroDocumento}
                        </option>
                      );
                    })}
                  </select>

                  {clienteIdSeleccionado &&
                    destinatariosDisponibles.length === 0 && (
                      <p className="mt-2 text-xs text-yellow-400">
                        Este cliente no tiene destinatarios registrados.
                      </p>
                    )}
                </div>
              )}

              {renderPersonaFields("destinatario", false)}
            </section>

            <section className={sectionClass}>
              <div className={sectionTitleClass}>
                <div>
                  <h3 className="text-base font-bold text-gray-100">
                    Ruta del servicio
                  </h3>
                  <p className="text-xs text-gray-500">
                    Dirección de partida y llegada.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <div className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.03] p-4">
                  <h4 className="mb-4 text-sm font-bold text-blue-300">
                    Punto de partida
                  </h4>

                  <div className="space-y-4">
                    {!isViewMode && (
                      <div>
                        <label className={labelClass}>
                          Dirección precargada
                        </label>
                        <select
                          value={direccionPartidaIdSeleccionada}
                          onChange={handleDireccionPartidaChange}
                          disabled={disabled || !remitenteIdSeleccionado}
                          className={inputClass}
                        >
                          <option value="">Seleccione una dirección</option>
                          {remitenteSeleccionado?.direcciones?.map(
                            (direccion) => {
                              const direccionId = getItemId(direccion);

                              return (
                                <option key={direccionId} value={direccionId}>
                                  {direccion.nombre || "Dirección"} -{" "}
                                  {direccion.direccion}
                                </option>
                              );
                            }
                          )}
                        </select>
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                      <div>
                        <label className={labelClass}>Ubigeo</label>
                        <input
                          type="text"
                          name="partida.ubigeo"
                          value={form.partida.ubigeo}
                          onChange={handleChange}
                          disabled={disabled}
                          placeholder="150101"
                          maxLength={6}
                          className={inputClass}
                        />
                      </div>

                      <div className="md:col-span-3">
                        <label className={labelClass}>Dirección</label>
                        <input
                          type="text"
                          name="partida.direccion"
                          value={form.partida.direccion}
                          onChange={handleChange}
                          disabled={disabled}
                          placeholder="Dirección exacta de partida"
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>Referencia</label>
                      <input
                        type="text"
                        name="partida.referencia"
                        value={form.partida.referencia}
                        onChange={handleChange}
                        disabled={disabled}
                        placeholder="Ej: Puerta 3"
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-green-500/20 bg-green-500/[0.03] p-4">
                  <h4 className="mb-4 text-sm font-bold text-green-300">
                    Punto de llegada
                  </h4>

                  <div className="space-y-4">
                    {!isViewMode && (
                      <div>
                        <label className={labelClass}>
                          Dirección precargada
                        </label>
                        <select
                          value={direccionLlegadaIdSeleccionada}
                          onChange={handleDireccionLlegadaChange}
                          disabled={disabled || !destinatarioIdSeleccionado}
                          className={inputClass}
                        >
                          <option value="">Seleccione una dirección</option>
                          {destinatarioSeleccionado?.direcciones?.map(
                            (direccion) => {
                              const direccionId = getItemId(direccion);

                              return (
                                <option key={direccionId} value={direccionId}>
                                  {direccion.nombre || "Dirección"} -{" "}
                                  {direccion.direccion}
                                </option>
                              );
                            }
                          )}
                        </select>
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                      <div>
                        <label className={labelClass}>Ubigeo</label>
                        <input
                          type="text"
                          name="llegada.ubigeo"
                          value={form.llegada.ubigeo}
                          onChange={handleChange}
                          disabled={disabled}
                          placeholder="150130"
                          maxLength={6}
                          className={inputClass}
                        />
                      </div>

                      <div className="md:col-span-3">
                        <label className={labelClass}>Dirección</label>
                        <input
                          type="text"
                          name="llegada.direccion"
                          value={form.llegada.direccion}
                          onChange={handleChange}
                          disabled={disabled}
                          placeholder="Dirección exacta de llegada"
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>Referencia</label>
                      <input
                        type="text"
                        name="llegada.referencia"
                        value={form.llegada.referencia}
                        onChange={handleChange}
                        disabled={disabled}
                        placeholder="Ej: Almacén principal"
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className={sectionClass}>
              <div className={sectionTitleClass}>
                <div>
                  <h3 className="text-base font-bold text-gray-100">
                    Transporte / MTC
                  </h3>
                  <p className="text-xs text-gray-500">
                    Datos complementarios del transporte.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                <div className="md:col-span-4">
                  <label className={labelClass}>MTC</label>
                  <input
                    type="text"
                    name="transporte.mtc"
                    value={form.transporte.mtc}
                    onChange={handleChange}
                    disabled={disabled}
                    placeholder="Opcional"
                    className={inputClass}
                  />
                </div>
              </div>
            </section>
          </div>

          <div className="border-t border-gray-800 bg-gray-900 px-5 py-4 sm:px-6">
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="rounded-lg bg-gray-700 px-5 py-2 text-white hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isViewMode ? "Cerrar" : "Cancelar"}
              </button>

              {!isViewMode && (
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-900"
                >
                  {loading
                    ? isEditMode
                      ? "Actualizando..."
                      : "Guardando..."
                    : isEditMode
                    ? "Actualizar orden"
                    : "Guardar orden"}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrdenServicioModal;
