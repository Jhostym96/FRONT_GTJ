import { useEffect, useRef, useState } from "react";
import { notify } from "../../utils/notify";
import { FaTimes } from "react-icons/fa";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  MapPinned,
  Package,
  Route,
  Users,
} from "lucide-react";
import { useOrdenesServicio } from "../../context/OrdenServicioContext";
import { useClientes } from "../../context/ClienteContext";
import { getTodayInputDate } from "../../utils/date";

const datosPersonaVacios = {
  tipoDocumento: "6",
  numeroDocumento: "",
  razonSocial: "",
  direccion: "",
};

const TIPOS_CARGA = [
  { value: "CONTENEDOR", label: "CONTENEDOR" },
  { value: "CARGA_SUELTA", label: "CARGA SUELTA" },
  { value: "TOLVA", label: "TOLVA" },
  { value: "EXPORTACION", label: "EXPORTACION" },
];

const CLASIFICACIONES_CARGA = [
  { value: "GENERAL", label: "GENERAL" },
  { value: "IMO", label: "IMO" },
  { value: "IQBF", label: "IQBF" },
];

const DIMENSIONES_CARGA = [
  { value: "20", label: "20 pies" },
  { value: "40", label: "40 pies" },
];

const requiereDimensionContenedor = (tipoCarga) =>
  ["CONTENEDOR", "EXPORTACION"].includes(tipoCarga);

const FORM_STEPS = [
  {
    id: "servicio",
    label: "Servicio y cliente",
    shortLabel: "Servicio",
    description: "Datos generales y solicitante",
    icon: Package,
  },
  {
    id: "participantes",
    label: "Participantes",
    shortLabel: "Participantes",
    description: "Remitente y destinatario",
    icon: Users,
  },
  {
    id: "ruta",
    label: "Ruta",
    shortLabel: "Ruta",
    description: "Puntos de partida y llegada",
    icon: MapPinned,
  },
  {
    id: "revision",
    label: "Revisión",
    shortLabel: "Revisión",
    description: "Confirmación del servicio",
    icon: ClipboardCheck,
  },
];

const createInitialForm = () => ({
  fechaProgramada: getTodayInputDate(),
  estado: "PENDIENTE",
  cantidadViajes: "1",
  tipoCarga: "CARGA_SUELTA",
  clasificacionCarga: "GENERAL",
  dimensionCarga: "",

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

});

const getItemId = (item) => item?.id ?? item?._id;

const compararId = (a, b) => String(a) === String(b);

const normalizarComparacion = (valor) =>
  valor?.toString().trim().toUpperCase() || "";

const obtenerEntidadesPorTipo = (cliente) => {
  const entidades = cliente?.entidadesRelacionadas || [];

  return {
    remitentes: entidades.filter(
      (entidad) => normalizarComparacion(entidad.tipo) === "REMITENTE"
    ),
    destinatarios: entidades.filter(
      (entidad) => normalizarComparacion(entidad.tipo) === "DESTINATARIO"
    ),
  };
};

const buscarPorNumeroDocumento = (items = [], numeroDocumento = "") => {
  const documento = normalizarComparacion(numeroDocumento);

  if (!documento) return null;

  return (
    items.find(
      (item) => normalizarComparacion(item?.numeroDocumento) === documento
    ) || null
  );
};

const buscarDireccion = (direcciones = [], punto = {}) => {
  const ubigeo = normalizarComparacion(punto?.ubigeo);
  const direccion = normalizarComparacion(punto?.direccion);

  if (!ubigeo && !direccion) return null;

  return (
    direcciones.find((item) => {
      const mismoUbigeo = ubigeo
        ? normalizarComparacion(item?.ubigeo) === ubigeo
        : true;
      const mismaDireccion = direccion
        ? normalizarComparacion(item?.direccion) === direccion
        : true;

      return mismoUbigeo && mismaDireccion;
    }) || null
  );
};

const OrdenServicioModal = ({
  isOpen,
  onClose,
  mode = "create",
  orden = null,
}) => {
  const { crearOrdenServicio, editarOrdenServicio } = useOrdenesServicio();

  const { clientes, getClientes, getTodosClientes, limpiarDatosRelacionados } =
    useClientes();

  const clientesActionsRef = useRef({
    getClientes,
    getTodosClientes,
    limpiarDatosRelacionados,
  });

  useEffect(() => {
    clientesActionsRef.current = {
      getClientes,
      getTodosClientes,
      limpiarDatosRelacionados,
    };
  }, [getClientes, getTodosClientes, limpiarDatosRelacionados]);

  const [form, setForm] = useState(createInitialForm);
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [fieldErrors, setFieldErrors] = useState({});

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
    if (!isViewMode) {
      if (clientesActionsRef.current.getTodosClientes) {
        clientesActionsRef.current.getTodosClientes({ page: 1, limit: 100 });
      } else {
        clientesActionsRef.current.getClientes?.({ page: 1, limit: 100 });
      }
    }
  }, [isOpen, isViewMode]);

  useEffect(() => {
    if (!isOpen) return;
    setActiveStep(0);
    setFieldErrors({});

    if ((isEditMode || isViewMode) && orden) {
      const clienteBase =
        orden.clienteSolicitante || orden.remitente || datosPersonaVacios;

      setForm({
        fechaProgramada: orden.fechaProgramada
          ? orden.fechaProgramada.slice(0, 10)
          : "",
        estado: orden.estado || "PENDIENTE",
        cantidadViajes: String(orden.cantidadViajes || 1),
        tipoCarga: orden.tipoCarga || "CARGA_SUELTA",
        clasificacionCarga: orden.clasificacionCarga || "GENERAL",
        dimensionCarga: orden.dimensionCarga || "",

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

      });
    }

    if (isCreateMode) {
      setForm(createInitialForm());
      setActiveStep(0);
      setFieldErrors({});
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

  useEffect(() => {
    if (!isOpen || !(isEditMode || isViewMode) || !orden || clientes.length === 0) {
      return;
    }

    const cliente = buscarPorNumeroDocumento(
      clientes,
      orden.clienteSolicitante?.numeroDocumento
    );

    if (!cliente) return;

    const { remitentes, destinatarios } = obtenerEntidadesPorTipo(cliente);
    const remitente = buscarPorNumeroDocumento(
      remitentes,
      orden.remitente?.numeroDocumento
    );
    const destinatario = buscarPorNumeroDocumento(
      destinatarios,
      orden.destinatario?.numeroDocumento
    );
    const direccionPartida = buscarDireccion(
      remitente?.direcciones,
      orden.partida
    );
    const direccionLlegada = buscarDireccion(
      destinatario?.direcciones,
      orden.llegada
    );

    setClienteIdSeleccionado(String(getItemId(cliente) || ""));
    setRemitentesDisponibles(remitentes);
    setDestinatariosDisponibles(destinatarios);
    setRemitenteIdSeleccionado(
      remitente ? String(getItemId(remitente) || "") : ""
    );
    setDestinatarioIdSeleccionado(
      destinatario ? String(getItemId(destinatario) || "") : ""
    );
    setDireccionPartidaIdSeleccionada(
      direccionPartida ? String(getItemId(direccionPartida) || "") : ""
    );
    setDireccionLlegadaIdSeleccionada(
      direccionLlegada ? String(getItemId(direccionLlegada) || "") : ""
    );
  }, [clientes, isEditMode, isOpen, isViewMode, orden]);

  if (!isOpen) return null;

  const inputClass = "input px-3 py-2.5 placeholder:text-gray-500";

  const labelClass = "text-muted mb-1.5 block text-xs font-semibold";

  const sectionClass = "panel p-4 sm:p-5";

  const sectionTitleClass =
    "mb-4 flex items-center justify-between border-b pb-3";

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
    setForm(createInitialForm());
    setActiveStep(0);
    setFieldErrors({});
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
    return obtenerEntidadesPorTipo(cliente);
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
    setFieldErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });

    if (name === "clienteEs") {
      setForm((prev) => ({
        ...prev,
        clienteEs: value,
      }));

      return;
    }

    if (name === "tipoCarga") {
      setForm((prev) => ({
        ...prev,
        tipoCarga: value,
        dimensionCarga: requiereDimensionContenedor(value)
          ? prev.dimensionCarga
          : "",
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

  const obtenerErroresFormulario = () => {
    const errors = {};

    if (!form.fechaProgramada) {
      errors.fechaProgramada = "La fecha programada es obligatoria";
    }

    const cantidadViajes = Number(form.cantidadViajes);

    if (!Number.isInteger(cantidadViajes) || cantidadViajes < 1) {
      errors.cantidadViajes = "Debe ser un número entero mayor a 0";
    }

    if (!form.clienteSolicitante.numeroDocumento.trim()) {
      errors["clienteSolicitante.numeroDocumento"] = "Ingresa el número de documento";
    }

    if (!form.clienteSolicitante.razonSocial.trim()) {
      errors["clienteSolicitante.razonSocial"] = "Ingresa la razón social o nombre";
    }

    if (!form.clienteSolicitante.direccion.trim()) {
      errors["clienteSolicitante.direccion"] = "Ingresa la dirección principal";
    }

    if (!form.remitente.numeroDocumento.trim()) {
      errors["remitente.numeroDocumento"] = "Selecciona o ingresa el remitente";
    }

    if (!form.remitente.razonSocial.trim()) {
      errors["remitente.razonSocial"] = "Ingresa la razón social del remitente";
    }

    if (!form.destinatario.numeroDocumento.trim()) {
      errors["destinatario.numeroDocumento"] = "Selecciona o ingresa el destinatario";
    }

    if (!form.destinatario.razonSocial.trim()) {
      errors["destinatario.razonSocial"] = "Ingresa la razón social del destinatario";
    }

    if (!form.partida.ubigeo.trim()) {
      errors["partida.ubigeo"] = "Ingresa el ubigeo de partida";
    } else if (!/^\d{6}$/.test(form.partida.ubigeo.trim())) {
      errors["partida.ubigeo"] = "Debe contener exactamente 6 dígitos";
    }

    if (!form.partida.direccion.trim()) {
      errors["partida.direccion"] = "Ingresa la dirección de partida";
    }

    if (!form.llegada.ubigeo.trim()) {
      errors["llegada.ubigeo"] = "Ingresa el ubigeo de llegada";
    } else if (!/^\d{6}$/.test(form.llegada.ubigeo.trim())) {
      errors["llegada.ubigeo"] = "Debe contener exactamente 6 dígitos";
    }

    if (!form.llegada.direccion.trim()) {
      errors["llegada.direccion"] = "Ingresa la dirección de llegada";
    }

    if (!form.clasificacionCarga) {
      errors.clasificacionCarga = "Selecciona la clasificación";
    }

    if (requiereDimensionContenedor(form.tipoCarga) && !form.dimensionCarga) {
      errors.dimensionCarga = "Selecciona la dimensión del contenedor";
    }

    return errors;
  };

  const getStepForField = (field) => {
    if (
      field.startsWith("remitente.") ||
      field.startsWith("destinatario.")
    ) {
      return 1;
    }
    if (field.startsWith("partida.") || field.startsWith("llegada.")) return 2;
    return 0;
  };

  const validateAndGoToStep = (targetStep) => {
    if (isViewMode || targetStep <= activeStep) {
      setActiveStep(targetStep);
      return;
    }

    const errors = obtenerErroresFormulario();
    setFieldErrors(errors);
    const currentStepErrors = Object.keys(errors).filter(
      (field) => getStepForField(field) === activeStep
    );

    if (targetStep > activeStep && currentStepErrors.length > 0) {
      notify.error("Completa los campos obligatorios antes de continuar");
      return;
    }

    setActiveStep(targetStep);
  };

  const limpiarPayloadOrden = () => {
    const data = {
      ...form,
      cantidadViajes: Number(form.cantidadViajes),
      tipoCarga: form.tipoCarga,
      clasificacionCarga: form.clasificacionCarga,
      dimensionCarga:
        requiereDimensionContenedor(form.tipoCarga) ? form.dimensionCarga : "",

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
        direccion: (
          form.remitente.direccion.trim() || form.partida.direccion.trim()
        ).toUpperCase(),
      },

      destinatario: {
        tipoDocumento: form.destinatario.tipoDocumento,
        numeroDocumento: form.destinatario.numeroDocumento.trim(),
        razonSocial: form.destinatario.razonSocial.trim().toUpperCase(),
        direccion: (
          form.destinatario.direccion.trim() || form.llegada.direccion.trim()
        ).toUpperCase(),
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

    };

    delete data.detalleCarga;

    if (isEditMode) {
      delete data.estado;
    }

    return data;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isViewMode) return;

    const errors = obtenerErroresFormulario();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setActiveStep(getStepForField(Object.keys(errors)[0]));
      notify.error("Revisa los campos obligatorios de la orden");
      return;
    }

    try {
      setLoading(true);

      const data = limpiarPayloadOrden();

      if (isCreateMode) {
        await crearOrdenServicio(data);
        notify.success("Orden de servicio creada correctamente");
      }

      if (isEditMode) {
        const ordenId = getItemId(orden);

        if (!ordenId) {
          notify.error("No se encontró el ID de la orden");
          return;
        }

        await editarOrdenServicio(ordenId, data);
        notify.success("Orden de servicio actualizada correctamente");
      }

    resetForm();
      onClose();
    } catch (error) {
      const erroresBackend = error.response?.data?.errors;
      const mensajeBackend = Array.isArray(erroresBackend)
        ? erroresBackend.join(". ")
        : error.response?.data?.message;

      notify.error(
        mensajeBackend || "Error al guardar la orden de servicio"
      );
    } finally {
      setLoading(false);
    }
  };

  const getFieldClass = (name) =>
    `${inputClass} ${
      fieldErrors[name]
        ? "border-red-500 focus:border-red-500 focus:ring-red-500/25"
        : ""
    }`;

  const FieldError = ({ name }) =>
    fieldErrors[name] ? (
      <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-300">
        {fieldErrors[name]}
      </p>
    ) : null;

  const renderPersonaFields = (prefix, mostrarDireccion = true) => (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
      <div className="md:col-span-2">
        <label className={labelClass}>Tipo doc.</label>
        <select
          name={`${prefix}.tipoDocumento`}
          value={form[prefix].tipoDocumento}
          onChange={handleChange}
          disabled={disabled}
          className={getFieldClass(`${prefix}.tipoDocumento`)}
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
          placeholder="Ingrese el número de documento"
          className={getFieldClass(`${prefix}.numeroDocumento`)}
        />
        <FieldError name={`${prefix}.numeroDocumento`} />
      </div>

      <div className="md:col-span-7">
        <label className={labelClass}>Razón social / nombre</label>
        <input
          type="text"
          name={`${prefix}.razonSocial`}
          value={form[prefix].razonSocial}
          onChange={handleChange}
          disabled={disabled}
          placeholder="Ingrese la razón social o nombre"
          className={getFieldClass(`${prefix}.razonSocial`)}
        />
        <FieldError name={`${prefix}.razonSocial`} />
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
            placeholder="Ingrese la dirección principal"
            className={getFieldClass(`${prefix}.direccion`)}
          />
          <FieldError name={`${prefix}.direccion`} />
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
    <div className="modal-backdrop">
      <div className="panel flex max-h-[94vh] w-full max-w-7xl flex-col overflow-hidden">
        <div className="flex items-start justify-between gap-4 border-b px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-main text-xl font-bold">{getTitulo()}</h2>
            <p className="text-muted text-sm">{getSubtitulo()}</p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="text-muted text-2xl hover:text-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            title="Cerrar"
          >
            <FaTimes />
          </button>
        </div>

        <div className="border-b px-4 py-3 sm:px-6">
          <div className="grid grid-cols-4 gap-1 sm:gap-2">
            {FORM_STEPS.map((step, index) => {
              const Icon = step.icon;
              const active = activeStep === index;
              const completed = activeStep > index;

              return (
                <button
                  type="button"
                  key={step.id}
                  onClick={() => validateAndGoToStep(index)}
                  className={`flex min-w-0 items-center gap-2 rounded-lg border px-2 py-2.5 text-left transition sm:px-3 ${
                    active
                      ? "border-[var(--app-primary)] bg-[var(--app-primary-soft)]"
                      : "border-transparent hover:bg-[var(--app-surface-muted)]"
                  }`}
                  aria-current={active ? "step" : undefined}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
                      active
                        ? "bg-[var(--app-primary)] text-white"
                        : completed
                        ? "bg-emerald-500/12 text-emerald-600 dark:text-emerald-300"
                        : "bg-[var(--app-surface-muted)] text-[var(--app-muted)]"
                    }`}
                  >
                    {completed ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </span>
                  <span className="hidden min-w-0 sm:block">
                    <span className="text-main block truncate text-xs font-bold">
                      {step.label}
                    </span>
                    <span className="text-faint hidden truncate text-[10px] lg:block">
                      {step.description}
                    </span>
                  </span>
                  <span className="text-main truncate text-[10px] font-bold sm:hidden">
                    {step.shortLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
              <div className="min-w-0 space-y-5">
            {activeStep === 0 && (
              <>
            <section className={sectionClass}>
              <div className={sectionTitleClass}>
                <div>
                  <h3 className="text-main text-base font-bold">
                    Datos generales
                  </h3>
                  <p className="text-faint text-xs">
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
                    className={getFieldClass("fechaProgramada")}
                  />
                  <FieldError name="fechaProgramada" />
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
                      <option value="PARCIALMENTE_PROGRAMADA">
                        PARCIALMENTE PROGRAMADA
                      </option>
                      <option value="PROGRAMADA">PROGRAMADA</option>
                      <option value="EN_PROCESO">EN PROCESO</option>
                      <option value="FINALIZADA">FINALIZADA</option>
                      <option value="ANULADA">ANULADA</option>
                    </select>
                  </div>
                )}

                <div className="md:col-span-3">
                  <label className={labelClass}>Cantidad de viajes</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    name="cantidadViajes"
                    value={form.cantidadViajes}
                    onChange={handleChange}
                    disabled={disabled}
                    className={getFieldClass("cantidadViajes")}
                  />
                  <FieldError name="cantidadViajes" />
                </div>

                <div className="md:col-span-3">
                  <label className={labelClass}>Tipo de carga</label>
                  <select
                    name="tipoCarga"
                    value={form.tipoCarga}
                    onChange={handleChange}
                    disabled={disabled}
                    className={getFieldClass("tipoCarga")}
                  >
                    {TIPOS_CARGA.map((tipo) => (
                      <option key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-3">
                  <label className={labelClass}>Clasificación</label>
                  <select
                    name="clasificacionCarga"
                    value={form.clasificacionCarga}
                    onChange={handleChange}
                    disabled={disabled}
                    className={getFieldClass("clasificacionCarga")}
                  >
                    {CLASIFICACIONES_CARGA.map((clasificacion) => (
                      <option
                        key={clasificacion.value}
                        value={clasificacion.value}
                      >
                        {clasificacion.label}
                      </option>
                    ))}
                  </select>
                  <FieldError name="clasificacionCarga" />
                </div>

                {requiereDimensionContenedor(form.tipoCarga) && (
                  <div className="md:col-span-3">
                    <label className={labelClass}>Dimensión</label>
                    <select
                      name="dimensionCarga"
                      value={form.dimensionCarga}
                      onChange={handleChange}
                      disabled={disabled}
                      className={getFieldClass("dimensionCarga")}
                    >
                      <option value="">Seleccione dimensión</option>
                      {DIMENSIONES_CARGA.map((dimension) => (
                        <option key={dimension.value} value={dimension.value}>
                          {dimension.label}
                        </option>
                      ))}
                    </select>
                    <FieldError name="dimensionCarga" />
                  </div>
                )}
              </div>
            </section>

            <section className={sectionClass}>
              <div className={sectionTitleClass}>
                <div>
                  <h3 className="text-main text-base font-bold">
                    Cliente solicitante
                  </h3>
                  <p className="text-faint text-xs">
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
              </>
            )}

            {activeStep === 1 && (
              <>
            <section className={sectionClass}>
              <div className={sectionTitleClass}>
                <div>
                  <h3 className="text-main text-base font-bold">
                    Remitente
                  </h3>
                  <p className="text-faint text-xs">
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
                  <h3 className="text-main text-base font-bold">
                    Destinatario
                  </h3>
                  <p className="text-faint text-xs">
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
              </>
            )}

            {activeStep === 2 && (
            <section className={sectionClass}>
              <div className={sectionTitleClass}>
                <div>
                  <h3 className="text-main text-base font-bold">
                    Ruta del servicio
                  </h3>
                  <p className="text-faint text-xs">
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
                          placeholder="Ingrese el ubigeo de partida"
                          maxLength={6}
                          inputMode="numeric"
                          className={getFieldClass("partida.ubigeo")}
                        />
                        <FieldError name="partida.ubigeo" />
                      </div>

                      <div className="md:col-span-3">
                        <label className={labelClass}>Dirección</label>
                        <input
                          type="text"
                          name="partida.direccion"
                          value={form.partida.direccion}
                          onChange={handleChange}
                          disabled={disabled}
                          placeholder="Ingrese la dirección de partida"
                          className={getFieldClass("partida.direccion")}
                        />
                        <FieldError name="partida.direccion" />
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
                        placeholder="Ingrese una referencia de partida"
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
                          placeholder="Ingrese el ubigeo de llegada"
                          maxLength={6}
                          inputMode="numeric"
                          className={getFieldClass("llegada.ubigeo")}
                        />
                        <FieldError name="llegada.ubigeo" />
                      </div>

                      <div className="md:col-span-3">
                        <label className={labelClass}>Dirección</label>
                        <input
                          type="text"
                          name="llegada.direccion"
                          value={form.llegada.direccion}
                          onChange={handleChange}
                          disabled={disabled}
                          placeholder="Ingrese la dirección de llegada"
                          className={getFieldClass("llegada.direccion")}
                        />
                        <FieldError name="llegada.direccion" />
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
                        placeholder="Ingrese una referencia de llegada"
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>
            )}

            {activeStep === 3 && (
              <section className={sectionClass}>
                <div className={sectionTitleClass}>
                  <div>
                    <h3 className="text-main text-base font-bold">Revisión final</h3>
                    <p className="text-faint text-xs">
                      Confirma la información antes de guardar la orden.
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="info-tile">
                    <div className="mb-2 flex items-center gap-2">
                      <Package className="h-4 w-4 text-[var(--app-primary)]" />
                      <p className="text-main text-sm font-bold">Servicio</p>
                    </div>
                    <p className="text-muted text-xs">
                      {form.fechaProgramada || "Sin fecha"} · {form.cantidadViajes || 0} viaje(s)
                    </p>
                    <p className="text-main mt-1 text-sm font-semibold">
                      {form.tipoCarga.replaceAll("_", " ")} · {form.clasificacionCarga}
                      {form.dimensionCarga ? ` · ${form.dimensionCarga} pies` : ""}
                    </p>
                  </div>

                  <div className="info-tile">
                    <div className="mb-2 flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-[var(--app-primary)]" />
                      <p className="text-main text-sm font-bold">Cliente</p>
                    </div>
                    <p className="text-main truncate text-sm font-semibold">
                      {form.clienteSolicitante.razonSocial || "Sin cliente"}
                    </p>
                    <p className="text-muted mt-1 truncate text-xs">
                      {form.clienteSolicitante.numeroDocumento || "Sin documento"}
                    </p>
                  </div>

                  <div className="info-tile">
                    <div className="mb-2 flex items-center gap-2">
                      <Users className="h-4 w-4 text-[var(--app-primary)]" />
                      <p className="text-main text-sm font-bold">Participantes</p>
                    </div>
                    <p className="text-muted text-xs">Remitente</p>
                    <p className="text-main truncate text-sm font-semibold">
                      {form.remitente.razonSocial || "Sin remitente"}
                    </p>
                    <p className="text-muted mt-2 text-xs">Destinatario</p>
                    <p className="text-main truncate text-sm font-semibold">
                      {form.destinatario.razonSocial || "Sin destinatario"}
                    </p>
                  </div>

                  <div className="info-tile">
                    <div className="mb-2 flex items-center gap-2">
                      <Route className="h-4 w-4 text-[var(--app-primary)]" />
                      <p className="text-main text-sm font-bold">Ruta</p>
                    </div>
                    <p className="text-muted text-xs">Partida</p>
                    <p className="text-main line-clamp-2 text-sm font-semibold">
                      {form.partida.direccion || "Sin dirección"}
                    </p>
                    <p className="text-muted mt-2 text-xs">Llegada</p>
                    <p className="text-main line-clamp-2 text-sm font-semibold">
                      {form.llegada.direccion || "Sin dirección"}
                    </p>
                  </div>
                </div>
              </section>
            )}
              </div>

              <aside className="h-fit rounded-lg border bg-[var(--app-surface-muted)] p-4 xl:sticky xl:top-0">
                <p className="text-faint text-[10px] font-extrabold uppercase tracking-[0.14em]">
                  Resumen de la orden
                </p>
                <h3 className="text-main mt-2 truncate text-base font-extrabold">
                  {form.clienteSolicitante.razonSocial || "Cliente por definir"}
                </h3>
                <p className="text-muted mt-1 text-xs">
                  {form.fechaProgramada || "Sin fecha"} · {form.cantidadViajes || 0} viaje(s)
                </p>

                <div className="mt-4 space-y-3 border-t pt-4">
                  <div>
                    <p className="text-faint text-[10px] font-bold uppercase">Carga</p>
                    <p className="text-main mt-0.5 text-xs font-semibold">
                      {form.tipoCarga.replaceAll("_", " ")}
                      {form.dimensionCarga ? ` · ${form.dimensionCarga} pies` : ""}
                    </p>
                  </div>
                  <div>
                    <p className="text-faint text-[10px] font-bold uppercase">Origen</p>
                    <p className="text-main mt-0.5 line-clamp-2 text-xs font-semibold">
                      {form.partida.direccion || "Pendiente"}
                    </p>
                  </div>
                  <div>
                    <p className="text-faint text-[10px] font-bold uppercase">Destino</p>
                    <p className="text-main mt-0.5 line-clamp-2 text-xs font-semibold">
                      {form.llegada.direccion || "Pendiente"}
                    </p>
                  </div>
                </div>

                {Object.keys(fieldErrors).length > 0 && (
                  <div className="mt-4 rounded-md border border-red-500/30 bg-red-500/10 p-3">
                    <p className="text-xs font-bold text-red-700 dark:text-red-300">
                      {Object.keys(fieldErrors).length} campo(s) pendiente(s)
                    </p>
                    <p className="text-muted mt-1 text-xs">
                      Revisa los pasos marcados antes de guardar.
                    </p>
                  </div>
                )}
              </aside>
            </div>
          </div>

          <div className="border-t px-5 py-4 sm:px-6">
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="btn-secondary px-3 py-1.5"
              >
                {isViewMode ? "Cerrar" : "Cancelar"}
              </button>

              <div className="flex gap-2">
                {activeStep > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveStep((current) => current - 1)}
                    className="btn-secondary"
                  >
                    <ArrowLeft />
                    Anterior
                  </button>
                )}

                {activeStep < FORM_STEPS.length - 1 && (
                  <button
                    type="button"
                    onClick={() => validateAndGoToStep(activeStep + 1)}
                    className="btn-primary"
                  >
                    Siguiente
                    <ArrowRight />
                  </button>
                )}

              {!isViewMode && activeStep === FORM_STEPS.length - 1 && (
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary px-3 py-1.5"
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
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrdenServicioModal;
