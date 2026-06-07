import { useEffect, useMemo, useRef, useState } from "react";
import { notify } from "../../utils/notify";
import { useGuiaTransportista } from "../../context/GuiaTransportistaContext";
import { useProgramacionViaje } from "../../context/ProgramacionViajeContext";
import { useEmpresaConfig } from "../../context/EmpresaConfigContext";
import { getRecordId } from "../../utils/apiData";
import { obtenerMensajesErrorApi } from "../../utils/apiErrorMessages";
import { getTodayInputDate } from "../../utils/date";

const convertirFechaInputADdmmyyyy = (fecha) => {
  if (!fecha) return "";

  if (fecha.includes("-") && fecha.length === 10) {
    const [anio, mes, dia] = fecha.split("-");
    return `${dia}-${mes}-${anio}`;
  }

  return fecha;
};

const convertirFechaDdmmyyyyAInput = (fecha) => {
  if (!fecha) return "";

  if (fecha.includes("-") && fecha.length === 10) {
    const partes = fecha.split("-");

    if (partes[0].length === 2) {
      const [dia, mes, anio] = partes;
      return `${anio}-${mes}-${dia}`;
    }
  }

  return fecha;
};

const DOCUMENTOS_RELACIONADOS_OPTIONS = [
  { value: "01", label: "01 - Factura" },
  { value: "03", label: "03 - Boleta de venta" },
  { value: "09", label: "09 - Guía de remisión remitente" },
  { value: "31", label: "31 - Guía de remisión transportista" },
];

const mostrarErroresApi = (error, fallback) => {
  const mensajes = obtenerMensajesErrorApi(error, fallback);

  notify.error(
    mensajes.length === 1 ? (
      mensajes[0]
    ) : (
      <div>
        <p className="mb-1 font-semibold">Corrige estos datos:</p>
        <ul className="list-disc space-y-1 pl-4">
          {mensajes.map((mensaje) => (
            <li key={mensaje}>{mensaje}</li>
          ))}
        </ul>
      </div>
    ),
    { duration: 9000 }
  );
};

const GuiaTransportistaModal = ({ isOpen, onClose, mode = "create", guia }) => {
  const isView = mode === "view";
  const isEdit = mode === "edit";

  const {
    crearGuiaTransportista,
    actualizarGuiaTransportista,
    validarGuiaTransportista,
    obtenerGuiasTransportista,
    loadingGuia,
  } = useGuiaTransportista();

  const {
    programaciones,
    getProgramacionesDisponiblesParaGuia,
  } = useProgramacionViaje();
  const { config: empresaConfig, obtenerConfig: obtenerEmpresaConfig } =
    useEmpresaConfig();

  const cargarProgramacionesRef = useRef({
    getProgramacionesDisponiblesParaGuia,
  });

  useEffect(() => {
    cargarProgramacionesRef.current = {
      getProgramacionesDisponiblesParaGuia,
    };
  }, [getProgramacionesDisponiblesParaGuia]);

  const initialForm = useMemo(
    () => ({
      programacionViaje: "",
      fecha_de_emision: getTodayInputDate(),
      observaciones: "",
      peso_bruto_total: "",
      peso_bruto_unidad_de_medida: "KGM",

      mtc: "",
      sunat_envio_indicador: "01",

      subcontratador_documento_tipo: "6",
      subcontratador_documento_numero: "",
      subcontratador_denominacion: "",

      pagador_servicio_documento_tipo_identidad: "6",
      pagador_servicio_documento_numero_identidad: "",
      pagador_servicio_denominacion: "",

      enviar_automaticamente_al_cliente: "false",
      formato_de_pdf: "TICKET",

      items: [
        {
          unidad_de_medida: "NIU",
          codigo: "001",
          descripcion: "",
          cantidad: "1",
          codigo_dam: "",
        },
      ],

      documento_relacionado: [],
      conductores_secundarios: [],
    }),
    []
  );

  const [form, setForm] = useState(initialForm);
  const [subcontratadorClienteId, setSubcontratadorClienteId] = useState("");
  const [pagadorTerceroClienteId, setPagadorTerceroClienteId] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    if (!empresaConfig) {
      obtenerEmpresaConfig?.().catch(() => {});
    }

    if (mode === "create") {
      cargarProgramacionesRef.current.getProgramacionesDisponiblesParaGuia?.();
    }
  }, [empresaConfig, isOpen, mode, obtenerEmpresaConfig]);

  useEffect(() => {
    if (guia && (isEdit || isView)) {
      setForm({
        programacionViaje:
          guia.programacionViajeId ||
          guia.programacionViaje?.id ||
          "",

        fecha_de_emision: convertirFechaDdmmyyyyAInput(
          guia.fecha_de_emision || ""
        ),

        observaciones: guia.observaciones || "",
        peso_bruto_total: guia.peso_bruto_total || "",
        peso_bruto_unidad_de_medida: guia.peso_bruto_unidad_de_medida || "KGM",

        mtc: guia.mtc || "",
        sunat_envio_indicador: guia.sunat_envio_indicador || "01",

        subcontratador_documento_tipo:
          guia.subcontratador_documento_tipo || "6",
        subcontratador_documento_numero:
          guia.subcontratador_documento_numero || "",
        subcontratador_denominacion: guia.subcontratador_denominacion || "",

        pagador_servicio_documento_tipo_identidad:
          guia.pagador_servicio_documento_tipo_identidad || "6",
        pagador_servicio_documento_numero_identidad:
          guia.pagador_servicio_documento_numero_identidad || "",
        pagador_servicio_denominacion:
          guia.pagador_servicio_denominacion || "",

        enviar_automaticamente_al_cliente:
          guia.enviar_automaticamente_al_cliente === true ? "true" : "false",

        formato_de_pdf: guia.formato_de_pdf || "TICKET",

        items:
          Array.isArray(guia.items) && guia.items.length > 0
            ? guia.items
            : [
                {
                  unidad_de_medida: "NIU",
                  codigo: "001",
                  descripcion: "",
                  cantidad: "1",
                  codigo_dam: "",
                },
              ],

        documento_relacionado: Array.isArray(guia.documento_relacionado)
          ? guia.documento_relacionado
          : [],

        conductores_secundarios: Array.isArray(guia.conductores_secundarios)
          ? guia.conductores_secundarios
          : [],
      });
      setSubcontratadorClienteId("");
      setPagadorTerceroClienteId("");
    }

    if (!guia && mode === "create") {
      setForm(initialForm);
      setSubcontratadorClienteId("");
      setPagadorTerceroClienteId("");
    }
  }, [guia, mode, isOpen, isEdit, isView, initialForm]);

  const listaProgramaciones = useMemo(
    () => (Array.isArray(programaciones) ? programaciones : []),
    [programaciones]
  );

  const programacionSeleccionada = useMemo(() => {
    return listaProgramaciones.find(
      (p) => String(getRecordId(p)) === String(form.programacionViaje)
    );
  }, [listaProgramaciones, form.programacionViaje]);

  const orden =
    programacionSeleccionada?.ordenServicio ||
    guia?.ordenServicio ||
    guia?.programacionViaje?.ordenServicio;

  const clienteSolicitante = useMemo(() => {
    const cliente = orden?.clienteSolicitante || orden?.cliente || guia?.clienteSolicitante || guia?.cliente;

    const tipoDocumento =
      cliente?.tipoDocumento ||
      orden?.clienteSolicitanteTipoDocumento ||
      guia?.cliente_tipo_de_documento ||
      "6";
    const numeroDocumento =
      cliente?.numeroDocumento ||
      orden?.clienteSolicitanteNumeroDocumento ||
      guia?.cliente_numero_de_documento ||
      "";
    const razonSocial =
      cliente?.razonSocial ||
      cliente?.denominacion ||
      cliente?.nombre ||
      orden?.clienteSolicitanteRazonSocial ||
      guia?.cliente_denominacion ||
      "";

    if (!numeroDocumento && !razonSocial) return null;

    return {
      id: getRecordId(cliente) || "cliente-solicitante",
      tipoDocumento,
      numeroDocumento,
      razonSocial,
    };
  }, [orden, guia]);

  const clienteSolicitanteOptions = useMemo(
    () => [
      {
        value: "",
        label: clienteSolicitante
          ? "Seleccione el cliente solicitante"
          : "Seleccione una programación con cliente",
      },
      ...(clienteSolicitante
        ? [
            {
              value: clienteSolicitante.id,
              label: `${clienteSolicitante.razonSocial || "Cliente solicitante"} - ${
                clienteSolicitante.numeroDocumento || "Sin documento"
              }`,
            },
          ]
        : []),
    ],
    [clienteSolicitante]
  );

  if (!isOpen) return null;

  const vehiculoPrincipal =
    programacionSeleccionada?.vehiculoPrincipal ||
    guia?.programacionViaje?.vehiculoPrincipal;

  const vehiculoSecundario =
    programacionSeleccionada?.vehiculoSecundario ||
    guia?.programacionViaje?.vehiculoSecundario;

  const conductor =
    programacionSeleccionada?.conductor ||
    guia?.programacionViaje?.conductor;

  const serieEmpresa =
    empresaConfig?.serieGuiaTransportista || guia?.serie || "VVV1";
  const mtcEmpresa = empresaConfig?.mtc || guia?.mtc || "";
  const serieVisible = isView ? guia?.serie || serieEmpresa : serieEmpresa;
  const mtcVisible = isView ? guia?.mtc || mtcEmpresa : mtcEmpresa;
  const numeroVisible = guia?.numero || "Automático";

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const completarDatosDesdeCliente = (cliente) => ({
    tipoDocumento: cliente?.tipoDocumento || "6",
    numeroDocumento: cliente?.numeroDocumento || "",
    razonSocial: cliente?.razonSocial || "",
  });

  const handleSubcontratadorClienteChange = (e) => {
    if (isView) return;

    const clienteId = e.target.value;
    setSubcontratadorClienteId(clienteId);

    const cliente =
      clienteSolicitante && String(clienteSolicitante.id) === String(clienteId)
        ? clienteSolicitante
        : null;

    if (!cliente) {
      setForm((prev) => ({
        ...prev,
        subcontratador_documento_tipo: "6",
        subcontratador_documento_numero: "",
        subcontratador_denominacion: "",
      }));
      return;
    }

    const datosCliente = completarDatosDesdeCliente(cliente);

    setForm((prev) => ({
      ...prev,
      subcontratador_documento_tipo: "6",
      subcontratador_documento_numero: datosCliente.numeroDocumento,
      subcontratador_denominacion: datosCliente.razonSocial,
    }));
  };

  const handlePagadorTerceroClienteChange = (e) => {
    if (isView) return;

    const clienteId = e.target.value;
    setPagadorTerceroClienteId(clienteId);

    const cliente =
      clienteSolicitante && String(clienteSolicitante.id) === String(clienteId)
        ? clienteSolicitante
        : null;

    if (!cliente) {
      setForm((prev) => ({
        ...prev,
        pagador_servicio_documento_tipo_identidad: "6",
        pagador_servicio_documento_numero_identidad: "",
        pagador_servicio_denominacion: "",
      }));
      return;
    }

    const datosCliente = completarDatosDesdeCliente(cliente);

    setForm((prev) => ({
      ...prev,
      pagador_servicio_documento_tipo_identidad: datosCliente.tipoDocumento,
      pagador_servicio_documento_numero_identidad: datosCliente.numeroDocumento,
      pagador_servicio_denominacion: datosCliente.razonSocial,
    }));
  };

  const handleItemChange = (index, e) => {
    const nuevosItems = [...form.items];

    nuevosItems[index] = {
      ...nuevosItems[index],
      [e.target.name]: e.target.value,
    };

    setForm((prev) => ({
      ...prev,
      items: nuevosItems,
    }));
  };

  const agregarItem = () => {
    setForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          unidad_de_medida: "NIU",
          codigo: String(prev.items.length + 1).padStart(3, "0"),
          descripcion: "",
          cantidad: "1",
          codigo_dam: "",
        },
      ],
    }));
  };

  const eliminarItem = (index) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleDocumentoChange = (index, e) => {
    const nuevosDocumentos = [...form.documento_relacionado];

    nuevosDocumentos[index] = {
      ...nuevosDocumentos[index],
      [e.target.name]: e.target.value,
    };

    setForm((prev) => ({
      ...prev,
      documento_relacionado: nuevosDocumentos,
    }));
  };

  const agregarDocumento = () => {
    setForm((prev) => ({
      ...prev,
      documento_relacionado: [
        ...prev.documento_relacionado,
        {
          tipo: "01",
          serie: "",
          numero: "",
        },
      ],
    }));
  };

  const eliminarDocumento = (index) => {
    setForm((prev) => ({
      ...prev,
      documento_relacionado: prev.documento_relacionado.filter(
        (_, i) => i !== index
      ),
    }));
  };

  const limpiarPayloadGuia = () => {
    const data = {
      ...form,
      programacionViajeId: Number(form.programacionViaje),
      fecha_de_emision: convertirFechaInputADdmmyyyy(form.fecha_de_emision),
      enviar_automaticamente_al_cliente:
        form.enviar_automaticamente_al_cliente === "true",
      formato_de_pdf: form.formato_de_pdf || "TICKET",
      peso_bruto_unidad_de_medida:
        form.peso_bruto_unidad_de_medida || "KGM",
    };

    delete data.programacionViaje;

    delete data.serie;
    delete data.numero;
    delete data.tipo_de_comprobante;
    delete data.serie_visible;
    delete data.numero_visible;
    delete data.mtc;

    delete data.motivo_de_traslado;
    delete data.numero_de_bultos;
    delete data.tipo_de_transporte;

    if (data.sunat_envio_indicador !== "02") {
      data.subcontratador_documento_tipo = "";
      data.subcontratador_documento_numero = "";
      data.subcontratador_denominacion = "";
    }

    if (data.sunat_envio_indicador !== "03") {
      data.pagador_servicio_documento_tipo_identidad = "";
      data.pagador_servicio_documento_numero_identidad = "";
      data.pagador_servicio_denominacion = "";
    }

    if (data.sunat_envio_indicador === "02") {
      data.subcontratador_documento_tipo = "6";
    }

    return data;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isView) return;

    try {
      const data = limpiarPayloadGuia();

      if (isEdit) {
        await actualizarGuiaTransportista(getRecordId(guia), data);
        notify.success("Guía actualizada correctamente");
      } else {
        await crearGuiaTransportista(data);
        notify.success("Guía guardada. Pendiente de envío a Nubefact");
      }

      await obtenerGuiasTransportista();
      onClose();
    } catch (error) {
      mostrarErroresApi(error, "Error al guardar la guía");
    }
  };

  const handleValidar = async () => {
    try {
      const data = limpiarPayloadGuia();
      await validarGuiaTransportista(data);
      notify.success("La guía está lista para emitir");
    } catch (error) {
      mostrarErroresApi(error, "La guía tiene datos por corregir");
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="panel max-h-[95vh] w-full max-w-6xl overflow-y-auto">
        <div className="sticky top-0 z-10 border-b px-5 py-4" style={{ background: "var(--app-surface)" }}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-400">
                Guía de transportista
              </p>

              <h2 className="text-main text-xl font-bold">
                {isView ? "Ver guía" : isEdit ? "Editar guía" : "Nueva guía"}
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="btn-secondary px-3 py-2 text-sm"
            >
              X
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-5">
          <section className="panel p-4">
            <h3 className="text-muted mb-4 text-sm font-bold uppercase tracking-wide">
              Programación de viaje
            </h3>

            <select
              name="programacionViaje"
              value={form.programacionViaje}
              onChange={handleChange}
              disabled={isView || isEdit}
              className="input px-4 py-3"
              required
            >
              <option value="">
                {mode === "create"
                  ? "Seleccione una programación pendiente de guía"
                  : "Seleccione una programación"}
              </option>

              {listaProgramaciones.map((p) => (
                <option key={getRecordId(p)} value={getRecordId(p)}>
                  {p.numeroProgramacion || `PV-${String(getRecordId(p)).padStart(6, "0")}`} -{" "}
                  Orden {p.ordenServicio?.numeroOrden || "sin número"} -{" "}
                  {p.vehiculoPrincipal?.placa || "Sin placa"} -{" "}
                  {p.conductor
                    ? `${p.conductor.nombres || ""} ${
                        p.conductor.apellidos || ""
                      }`
                    : "Sin conductor"}
                </option>
              ))}
            </select>

            {mode === "create" && programaciones?.length === 0 && (
              <p className="mt-3 rounded-xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
                No hay programaciones pendientes de guía.
              </p>
            )}

            {orden && (
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <Info
                  label="Cliente solicitante"
                  value={orden.clienteSolicitanteRazonSocial}
                />

                <Info
                  label="RUC cliente"
                  value={orden.clienteSolicitanteNumeroDocumento}
                />

                <Info label="Orden" value={orden.numeroOrden} />

                <Info
                  label="Remitente guía"
                  value={orden.remitenteRazonSocial}
                />

                <Info
                  label="RUC remitente"
                  value={orden.remitenteNumeroDocumento}
                />

                <Info
                  label="Destinatario guía"
                  value={orden.destinatarioRazonSocial}
                />

                <Info
                  label="RUC destinatario"
                  value={orden.destinatarioNumeroDocumento}
                />

                <Info
                  label="Vehículo principal"
                  value={vehiculoPrincipal?.placa}
                />

                <Info
                  label="TUC/TUCE tracto"
                  value={vehiculoPrincipal?.numeroTUCE_CHV}
                />

                <Info
                  label="Vehículo secundario"
                  value={vehiculoSecundario?.placa}
                />

                <Info
                  label="TUC/TUCE carreta"
                  value={vehiculoSecundario?.numeroTUCE_CHV}
                />

                <Info
                  label="Conductor"
                  value={
                    conductor
                      ? `${conductor.nombres || ""} ${
                          conductor.apellidos || ""
                        }`
                      : ""
                  }
                />

                <Info label="Licencia" value={conductor?.numeroLicencia} />
              </div>
            )}
          </section>

          <section className="panel p-4">
            <h3 className="text-muted mb-4 text-sm font-bold uppercase tracking-wide">
              Datos de emisión
            </h3>

            <div className="mb-4 grid gap-4 md:grid-cols-2">
              <Input
                label="Serie"
                name="serie_visible"
                value={serieVisible}
                disabled={true}
              />

              <Input
                label="Número"
                name="numero_visible"
                value={numeroVisible}
                disabled={true}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Input
                type="date"
                label="Fecha de emisión"
                name="fecha_de_emision"
                value={form.fecha_de_emision}
                onChange={handleChange}
                disabled={isView}
                required
              />

              <Input
                label="Peso bruto"
                name="peso_bruto_total"
                value={form.peso_bruto_total}
                onChange={handleChange}
                disabled={isView}
                required
              />

              <Select
                label="Unidad peso"
                name="peso_bruto_unidad_de_medida"
                value={form.peso_bruto_unidad_de_medida}
                onChange={handleChange}
                disabled={isView}
                options={[
                  { value: "KGM", label: "KGM - Kilogramos" },
                  { value: "TNE", label: "TNE - Toneladas" },
                ]}
              />
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Input
                label="MTC"
                name="mtc"
                value={mtcVisible}
                disabled={true}
                required
              />

              <Select
                label="Indicador SUNAT"
                name="sunat_envio_indicador"
                value={form.sunat_envio_indicador}
                onChange={handleChange}
                disabled={isView}
                options={[
                  {
                    value: "01",
                    label: "01 - Pagador flete: Remitente",
                  },
                  {
                    value: "02",
                    label: "02 - Pagador flete: Subcontratador",
                  },
                  {
                    value: "03",
                    label: "03 - Pagador flete: Tercero",
                  },
                  {
                    value: "04",
                    label: "04 - Flete por cobrar",
                  },
                  {
                    value: "05",
                    label: "05 - Flete por pagar",
                  },
                ]}
              />
            </div>

            {form.sunat_envio_indicador === "02" && (
              <div className="mt-4 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
                <h4 className="mb-3 text-sm font-bold text-blue-300">
                  Datos del subcontratador
                </h4>

                <div className="grid gap-4 md:grid-cols-3">
                  <Select
                    label="Cliente"
                    name="subcontratador_cliente"
                    value={subcontratadorClienteId}
                    onChange={handleSubcontratadorClienteChange}
                    disabled={isView || !clienteSolicitante}
                    options={clienteSolicitanteOptions}
                  />

                  <Input
                    label="Tipo doc."
                    name="subcontratador_documento_tipo"
                    value="6"
                    disabled={true}
                  />

                  <Input
                    label="RUC subcontratador"
                    name="subcontratador_documento_numero"
                    value={form.subcontratador_documento_numero}
                    onChange={handleChange}
                    disabled={isView}
                    required
                  />

                  <Input
                    label="Razón social"
                    name="subcontratador_denominacion"
                    value={form.subcontratador_denominacion}
                    onChange={handleChange}
                    disabled={isView}
                    required
                  />
                </div>
              </div>
            )}

            {form.sunat_envio_indicador === "03" && (
              <div className="mt-4 rounded-xl border border-purple-500/20 bg-purple-500/5 p-4">
                <h4 className="mb-3 text-sm font-bold text-purple-300">
                  Datos del pagador tercero
                </h4>

                <div className="grid gap-4 md:grid-cols-3">
                  <Select
                    label="Cliente"
                    name="pagador_tercero_cliente"
                    value={pagadorTerceroClienteId}
                    onChange={handlePagadorTerceroClienteChange}
                    disabled={isView || !clienteSolicitante}
                    options={clienteSolicitanteOptions}
                  />

                  <Select
                    label="Tipo doc."
                    name="pagador_servicio_documento_tipo_identidad"
                    value={form.pagador_servicio_documento_tipo_identidad}
                    onChange={handleChange}
                    disabled={isView}
                    options={[
                      { value: "6", label: "6 - RUC" },
                      { value: "1", label: "1 - DNI" },
                      { value: "4", label: "4 - Carnet extranjería" },
                      { value: "7", label: "7 - Pasaporte" },
                      { value: "A", label: "A - Cédula diplomática" },
                      { value: "0", label: "0 - No domiciliado" },
                    ]}
                  />

                  <Input
                    label="N° documento"
                    name="pagador_servicio_documento_numero_identidad"
                    value={form.pagador_servicio_documento_numero_identidad}
                    onChange={handleChange}
                    disabled={isView}
                    required
                  />

                  <Input
                    label="Denominación"
                    name="pagador_servicio_denominacion"
                    value={form.pagador_servicio_denominacion}
                    onChange={handleChange}
                    disabled={isView}
                    required
                  />
                </div>
              </div>
            )}

            <div className="mt-4">
              <label className="text-muted mb-1 block text-xs font-semibold">
                Observaciones
              </label>

              <textarea
                name="observaciones"
                value={form.observaciones}
                onChange={handleChange}
                disabled={isView}
                rows="3"
                className="input resize-none px-4 py-3"
              />
            </div>
          </section>

          <section className="panel p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-muted text-sm font-bold uppercase tracking-wide">
                Items
              </h3>

              {!isView && (
                <button
                  type="button"
                  onClick={agregarItem}
                  className="btn-primary px-3 py-2 text-xs"
                >
                  Agregar item
                </button>
              )}
            </div>

            <div className="space-y-3">
              {form.items.map((item, index) => (
                <div
                  key={index}
                  className="info-tile grid gap-3 border p-3 md:grid-cols-12"
                >
                  <div className="md:col-span-2">
                    <Select
                      label="Unidad"
                      name="unidad_de_medida"
                      value={item.unidad_de_medida}
                      onChange={(e) => handleItemChange(index, e)}
                      disabled={isView}
                      options={[
                        { value: "NIU", label: "NIU" },
                        { value: "ZZ", label: "ZZ" },
                        { value: "KGM", label: "KGM" },
                      ]}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Input
                      label="Código"
                      name="codigo"
                      value={item.codigo}
                      onChange={(e) => handleItemChange(index, e)}
                      disabled={isView}
                    />
                  </div>

                  <div className="md:col-span-4">
                    <Input
                      label="Descripción"
                      name="descripcion"
                      value={item.descripcion}
                      onChange={(e) => handleItemChange(index, e)}
                      disabled={isView}
                      required
                    />
                  </div>

                  <div className="md:col-span-1">
                    <Input
                      label="Cant."
                      name="cantidad"
                      value={item.cantidad}
                      onChange={(e) => handleItemChange(index, e)}
                      disabled={isView}
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Input
                      label="Código DAM/DS"
                      name="codigo_dam"
                      value={item.codigo_dam || ""}
                      onChange={(e) => handleItemChange(index, e)}
                      disabled={isView}
                    />
                  </div>

                  <div className="flex items-end md:col-span-1">
                    {!isView && form.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => eliminarItem(index)}
                        className="btn-danger w-full px-3 py-2 text-xs"
                      >
                        X
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="panel p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-muted text-sm font-bold uppercase tracking-wide">
                Documentos relacionados
              </h3>

              {!isView && (
                <button
                  type="button"
                  onClick={agregarDocumento}
                  className="btn-secondary px-3 py-2 text-xs"
                >
                  Agregar documento
                </button>
              )}
            </div>

            {form.documento_relacionado.length === 0 ? (
              <p className="text-faint text-sm">
                No hay documentos relacionados.
              </p>
            ) : (
              <div className="space-y-3">
                {form.documento_relacionado.map((doc, index) => (
                  <div
                    key={index}
                    className="info-tile grid gap-3 border p-3 md:grid-cols-12"
                  >
                    <div className="md:col-span-3">
                      <Select
                        label="Tipo"
                        name="tipo"
                        value={doc.tipo}
                        onChange={(e) => handleDocumentoChange(index, e)}
                        disabled={isView}
                        options={DOCUMENTOS_RELACIONADOS_OPTIONS}
                      />
                    </div>

                    <div className="md:col-span-4">
                      <Input
                        label="Serie"
                        name="serie"
                        value={doc.serie}
                        onChange={(e) => handleDocumentoChange(index, e)}
                        disabled={isView}
                      />
                    </div>

                    <div className="md:col-span-4">
                      <Input
                        label="Número"
                        name="numero"
                        value={doc.numero}
                        onChange={(e) => handleDocumentoChange(index, e)}
                        disabled={isView}
                      />
                    </div>

                    <div className="flex items-end md:col-span-1">
                      {!isView && (
                        <button
                          type="button"
                          onClick={() => eliminarDocumento(index)}
                          className="btn-danger w-full px-3 py-2 text-xs"
                        >
                          X
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="sticky bottom-0 flex flex-col gap-3 border-t py-4 sm:flex-row sm:justify-end" style={{ background: "var(--app-surface)" }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary px-3 py-2 text-sm"
            >
              {isView ? "Cerrar" : "Cancelar"}
            </button>

            {!isView && (
              <>
                {!isEdit && (
                  <button
                    type="button"
                    onClick={handleValidar}
                    disabled={loadingGuia}
                    className="btn-success px-3 py-2 text-sm disabled:bg-neutral-700"
                  >
                    Validar
                  </button>
                )}

                <button
                  type="submit"
                  disabled={loadingGuia}
                  className="btn-primary px-3 py-2 text-sm"
                >
                  {loadingGuia
                    ? "Guardando..."
                    : isEdit
                    ? "Actualizar guía"
                    : "Crear"}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

const Input = ({
  type = "text",
  label,
  name,
  value,
  onChange,
  disabled,
  required,
  placeholder = "",
}) => (
  <div>
    <label className="text-muted mb-1 block text-xs font-semibold">
      {label}
    </label>

    <input
      type={type}
      name={name}
      value={value || ""}
      onChange={onChange}
      disabled={disabled}
      required={required}
      placeholder={placeholder || (disabled ? "" : `Ingrese ${label.toLowerCase()}`)}
      className="input px-4 py-3"
    />
  </div>
);

const Select = ({ label, name, value, onChange, disabled, options = [] }) => (
  <div>
    <label className="text-muted mb-1 block text-xs font-semibold">
      {label}
    </label>

    <select
      name={name}
      value={value || ""}
      onChange={onChange}
      disabled={disabled}
      className="input px-4 py-3"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

const Info = ({ label, value }) => (
  <div className="info-tile border p-3">
    <p className="text-faint text-xs">{label}</p>

    <p className="text-main truncate text-sm font-semibold">
      {value || "-"}
    </p>
  </div>
);

export default GuiaTransportistaModal;
