import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const initialForm = {
  tipoDocumento: "6",
  numeroDocumento: "",
  razonSocial: "",
  direccionFiscal: "",
  remitentes: [],
  destinatarios: [],
};

const initialEntidad = {
  tipoDocumento: "6",
  numeroDocumento: "",
  razonSocial: "",
  direccionFiscal: "",
  direcciones: [],
};

const initialDireccion = {
  nombre: "",
  ubigeo: "",
  direccion: "",
  referencia: "",
  codigoEstablecimientoSunat: "0000",
};

function TipoDocumentoSelect({
  value,
  onChange,
  disabled = false,
  inputClass,
}) {
  return (
    <select
      name="tipoDocumento"
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={inputClass}
    >
      <option value="6">RUC</option>
      <option value="1">DNI</option>
      <option value="4">Carnet extranjería</option>
      <option value="7">Pasaporte</option>
      <option value="A">Cédula diplomática</option>
      <option value="0">Doc. no domiciliado</option>
    </select>
  );
}

function DireccionesTemporales({
  direcciones,
  onRemove,
  isView,
  smallCardClass,
}) {
  if (!direcciones || direcciones.length === 0) return null;

  return (
    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
      {direcciones.map((dir, index) => (
        <div key={dir.id || index} className={smallCardClass}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-white">{dir.nombre}</p>
              <p className="mt-1 text-gray-300">{dir.direccion}</p>
              <p className="text-gray-500">Ubigeo: {dir.ubigeo}</p>

              {dir.referencia && (
                <p className="text-gray-500">Ref: {dir.referencia}</p>
              )}

              {dir.codigoEstablecimientoSunat && (
                <p className="text-gray-500">
                  Cod. SUNAT: {dir.codigoEstablecimientoSunat}
                </p>
              )}
            </div>

            {!isView && (
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="text-sm text-red-400 hover:text-red-300"
              >
                Quitar
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function FormDireccion({
  titulo,
  direccion,
  onChange,
  onAdd,
  direcciones,
  onRemove,
  placeholderNombre,
  inputDarkClass,
  subSectionClass,
  smallCardClass,
  isView,
}) {
  return (
    <div className={subSectionClass}>
      <h4 className="mb-3 font-semibold text-white">{titulo}</h4>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
        <div className="md:col-span-2">
          <input
            type="text"
            name="nombre"
            value={direccion.nombre}
            onChange={onChange}
            disabled={isView}
            className={`${inputDarkClass} uppercase`}
            placeholder={placeholderNombre}
          />
        </div>

        <div className="md:col-span-2">
          <input
            type="text"
            name="ubigeo"
            value={direccion.ubigeo}
            onChange={onChange}
            disabled={isView}
            maxLength={6}
            className={inputDarkClass}
            placeholder="Ubigeo"
          />
        </div>

        <div className="md:col-span-4">
          <input
            type="text"
            name="direccion"
            value={direccion.direccion}
            onChange={onChange}
            disabled={isView}
            className={`${inputDarkClass} uppercase`}
            placeholder="Dirección"
          />
        </div>

        <div className="md:col-span-2">
          <input
            type="text"
            name="codigoEstablecimientoSunat"
            value={direccion.codigoEstablecimientoSunat}
            onChange={onChange}
            disabled={isView}
            maxLength={4}
            className={inputDarkClass}
            placeholder="0000"
          />
        </div>

        {!isView && (
          <div className="md:col-span-2">
            <button
              type="button"
              onClick={onAdd}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Agregar
            </button>
          </div>
        )}

        <div className={isView ? "md:col-span-12" : "md:col-span-10"}>
          <input
            type="text"
            name="referencia"
            value={direccion.referencia}
            onChange={onChange}
            disabled={isView}
            className={`${inputDarkClass} uppercase`}
            placeholder="Referencia"
          />
        </div>
      </div>

      <DireccionesTemporales
        direcciones={direcciones}
        onRemove={onRemove}
        isView={isView}
        smallCardClass={smallCardClass}
      />
    </div>
  );
}

function EntidadForm({
  tipo,
  entidad,
  direccion,
  onEntidadChange,
  onDireccionChange,
  onAddDireccion,
  onRemoveDireccion,
  onAddEntidad,
  placeholderRazonSocial,
  placeholderDireccion,
  inputClass,
  inputDarkClass,
  labelClass,
  sectionClass,
  subSectionClass,
  smallCardClass,
  isView,
}) {
  return (
    <section className={sectionClass}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white">Agregar {tipo}</h3>
        <p className="text-sm text-gray-400">
          Registra los datos del {tipo} y sus direcciones frecuentes.
        </p>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-12">
        <div className="md:col-span-2">
          <label className={labelClass}>Tipo doc.</label>
          <TipoDocumentoSelect
            value={entidad.tipoDocumento}
            onChange={onEntidadChange}
            disabled={isView}
            inputClass={inputClass}
          />
        </div>

        <div className="md:col-span-3">
          <label className={labelClass}>N° documento</label>
          <input
            type="text"
            name="numeroDocumento"
            value={entidad.numeroDocumento}
            onChange={onEntidadChange}
            disabled={isView}
            className={inputClass}
            placeholder={`RUC ${tipo}`}
          />
        </div>

        <div className="md:col-span-7">
          <label className={labelClass}>Razón social</label>
          <input
            type="text"
            name="razonSocial"
            value={entidad.razonSocial}
            onChange={onEntidadChange}
            disabled={isView}
            className={`${inputClass} uppercase`}
            placeholder={placeholderRazonSocial}
          />
        </div>
      </div>

      <FormDireccion
        titulo={`Dirección del ${tipo}`}
        direccion={direccion}
        onChange={onDireccionChange}
        onAdd={onAddDireccion}
        direcciones={entidad.direcciones}
        onRemove={onRemoveDireccion}
        placeholderNombre={placeholderDireccion}
        inputDarkClass={inputDarkClass}
        subSectionClass={subSectionClass}
        smallCardClass={smallCardClass}
        isView={isView}
      />

      {!isView && (
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onAddEntidad}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
          >
            Agregar {tipo} al cliente
          </button>
        </div>
      )}
    </section>
  );
}

function ListaEntidades({
  titulo,
  emptyText,
  entidades,
  onRemove,
  isView,
  sectionClass,
  cardClass,
  smallCardClass,
}) {
  return (
    <section className={sectionClass}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white">{titulo}</h3>
        <p className="text-sm text-gray-400">
          Direcciones disponibles para órdenes de servicio y guías.
        </p>
      </div>

      {!entidades || entidades.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-700 bg-gray-900 p-4 text-center">
          <p className="text-sm text-gray-400">{emptyText}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {entidades.map((entidad, index) => (
            <div key={entidad.id || index} className={cardClass}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-semibold text-white">
                    {entidad.razonSocial}
                  </p>
                  <p className="text-sm text-gray-400">
                    {entidad.numeroDocumento} - {entidad.razonSocial}
                  </p>
                </div>

                {!isView && (
                  <button
                    type="button"
                    onClick={() => onRemove(index)}
                    className="text-sm text-red-400 hover:text-red-300"
                  >
                    Eliminar
                  </button>
                )}
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                {entidad.direcciones?.map((dir, i) => (
                  <div key={dir.id || i} className={smallCardClass}>
                    <p className="font-medium text-white">{dir.nombre}</p>
                    <p className="text-gray-300">{dir.direccion}</p>
                    <p className="text-gray-500">Ubigeo: {dir.ubigeo}</p>

                    {dir.referencia && (
                      <p className="text-gray-500">Ref: {dir.referencia}</p>
                    )}

                    {dir.codigoEstablecimientoSunat && (
                      <p className="text-gray-500">
                        Cod. SUNAT: {dir.codigoEstablecimientoSunat}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function ClienteModal({
  isOpen,
  mode = "create",
  clienteSeleccionado = null,
  onClose,
  onSubmit,
  loading = false,
}) {
  const [form, setForm] = useState(initialForm);
  const [remitenteTemp, setRemitenteTemp] = useState(initialEntidad);
  const [destinatarioTemp, setDestinatarioTemp] = useState(initialEntidad);
  const [direccionRemitenteTemp, setDireccionRemitenteTemp] =
    useState(initialDireccion);
  const [direccionDestinatarioTemp, setDireccionDestinatarioTemp] =
    useState(initialDireccion);

  const isView = mode === "view";
  const isEdit = mode === "edit";
  const isCreate = mode === "create";

  const normalizarMayuscula = (valor) => {
    if (typeof valor !== "string") return "";
    return valor.trim().toUpperCase();
  };

  const normalizarTexto = (valor) => {
    if (typeof valor !== "string") return "";
    return valor.trim();
  };

  const obtenerEntidadesPorTipo = (cliente, tipo) => {
    const entidades =
      cliente?.entidadesRelacionadas ||
      cliente?.remitentes ||
      cliente?.destinatarios ||
      [];

    if (!Array.isArray(entidades)) return [];

    return entidades
      .filter((entidad) => entidad.tipo === tipo)
      .map((entidad) => ({
        id: entidad.id,
        tipo: entidad.tipo,
        tipoDocumento: entidad.tipoDocumento || "6",
        numeroDocumento: entidad.numeroDocumento || "",
        razonSocial: entidad.razonSocial || "",
        direccionFiscal: entidad.direccionFiscal || "",
        direcciones: entidad.direcciones || [],
      }));
  };

  useEffect(() => {
    if (!isOpen) return;

    if (clienteSeleccionado && (isEdit || isView)) {
      const remitentes =
        clienteSeleccionado.remitentes ||
        obtenerEntidadesPorTipo(clienteSeleccionado, "REMITENTE");

      const destinatarios =
        clienteSeleccionado.destinatarios ||
        obtenerEntidadesPorTipo(clienteSeleccionado, "DESTINATARIO");

      setForm({
        tipoDocumento: clienteSeleccionado.tipoDocumento || "6",
        numeroDocumento: clienteSeleccionado.numeroDocumento || "",
        razonSocial: clienteSeleccionado.razonSocial || "",
        direccionFiscal: clienteSeleccionado.direccionFiscal || "",
        remitentes,
        destinatarios,
      });
    } else if (isCreate) {
      setForm(initialForm);
    }

    setRemitenteTemp(initialEntidad);
    setDestinatarioTemp(initialEntidad);
    setDireccionRemitenteTemp(initialDireccion);
    setDireccionDestinatarioTemp(initialDireccion);
  }, [isOpen, clienteSeleccionado, mode, isCreate, isEdit, isView]);

  if (!isOpen) return null;

  const titulo = {
    create: "Nuevo cliente",
    edit: "Editar cliente",
    view: "Detalle del cliente",
  }[mode];

  const inputClass =
    "w-full mt-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white disabled:opacity-70 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500/40";

  const inputDarkClass =
    "w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-white disabled:opacity-70 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500/40";

  const labelClass = "text-sm text-gray-300";
  const sectionClass = "bg-gray-950 border border-gray-800 rounded-xl p-5";
  const subSectionClass = "bg-gray-900 border border-gray-800 rounded-xl p-4";
  const cardClass = "bg-gray-900 border border-gray-800 rounded-xl p-4";
  const smallCardClass =
    "bg-gray-950 border border-gray-800 rounded-lg p-3 text-sm";

  const validarUbigeo = (ubigeo) => {
    return /^\d{6}$/.test(ubigeo);
  };

  const validarCodigoSunat = (codigo) => {
    return /^\d{4}$/.test(codigo);
  };

  const handleClienteChange = (e) => {
    if (isView) return;

    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRemitenteChange = (e) => {
    if (isView) return;

    const { name, value } = e.target;

    setRemitenteTemp((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDestinatarioChange = (e) => {
    if (isView) return;

    const { name, value } = e.target;

    setDestinatarioTemp((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDireccionRemitenteChange = (e) => {
    if (isView) return;

    const { name, value } = e.target;

    setDireccionRemitenteTemp((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDireccionDestinatarioChange = (e) => {
    if (isView) return;

    const { name, value } = e.target;

    setDireccionDestinatarioTemp((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const normalizarDireccion = (direccion) => ({
    nombre: normalizarMayuscula(direccion.nombre),
    ubigeo: normalizarTexto(direccion.ubigeo),
    direccion: normalizarMayuscula(direccion.direccion),
    referencia: normalizarMayuscula(direccion.referencia),
    codigoEstablecimientoSunat:
      normalizarTexto(direccion.codigoEstablecimientoSunat) || "0000",
  });

  const agregarDireccionRemitenteTemp = () => {
    if (isView) return;

    const direccionNormalizada = normalizarDireccion(direccionRemitenteTemp);

    if (
      !direccionNormalizada.nombre ||
      !direccionNormalizada.ubigeo ||
      !direccionNormalizada.direccion
    ) {
      toast.error("Completa nombre, ubigeo y dirección del remitente");
      return;
    }

    if (!validarUbigeo(direccionNormalizada.ubigeo)) {
      toast.error("El ubigeo debe tener 6 dígitos numéricos");
      return;
    }

    if (!validarCodigoSunat(direccionNormalizada.codigoEstablecimientoSunat)) {
      toast.error("El código de establecimiento SUNAT debe tener 4 dígitos numéricos");
      return;
    }

    setRemitenteTemp((prev) => ({
      ...prev,
      direcciones: [...prev.direcciones, direccionNormalizada],
    }));

    setDireccionRemitenteTemp(initialDireccion);
  };

  const agregarDireccionDestinatarioTemp = () => {
    if (isView) return;

    const direccionNormalizada = normalizarDireccion(direccionDestinatarioTemp);

    if (
      !direccionNormalizada.nombre ||
      !direccionNormalizada.ubigeo ||
      !direccionNormalizada.direccion
    ) {
      toast.error("Completa nombre, ubigeo y dirección del destinatario");
      return;
    }

    if (!validarUbigeo(direccionNormalizada.ubigeo)) {
      toast.error("El ubigeo debe tener 6 dígitos numéricos");
      return;
    }

    if (!validarCodigoSunat(direccionNormalizada.codigoEstablecimientoSunat)) {
      toast.error("El código de establecimiento SUNAT debe tener 4 dígitos numéricos");
      return;
    }

    setDestinatarioTemp((prev) => ({
      ...prev,
      direcciones: [...prev.direcciones, direccionNormalizada],
    }));

    setDireccionDestinatarioTemp(initialDireccion);
  };

  const eliminarDireccionRemitenteTemp = (index) => {
    if (isView) return;

    setRemitenteTemp((prev) => ({
      ...prev,
      direcciones: prev.direcciones.filter((_, i) => i !== index),
    }));
  };

  const eliminarDireccionDestinatarioTemp = (index) => {
    if (isView) return;

    setDestinatarioTemp((prev) => ({
      ...prev,
      direcciones: prev.direcciones.filter((_, i) => i !== index),
    }));
  };

  const agregarRemitente = () => {
    if (isView) return;

    const primeraDireccion = remitenteTemp.direcciones?.[0];

    const remitenteNormalizado = {
      tipo: "REMITENTE",
      tipoDocumento: remitenteTemp.tipoDocumento || "6",
      numeroDocumento: normalizarTexto(remitenteTemp.numeroDocumento),
      razonSocial: normalizarMayuscula(remitenteTemp.razonSocial),
      direccionFiscal: primeraDireccion?.direccion || "",
      direcciones: remitenteTemp.direcciones || [],
    };

    if (
      !remitenteNormalizado.numeroDocumento ||
      !remitenteNormalizado.razonSocial
    ) {
      toast.error("Completa los datos del remitente");
      return;
    }

    if (remitenteNormalizado.direcciones.length === 0) {
      toast.error("Agrega al menos una dirección para el remitente");
      return;
    }

    const existe = form.remitentes.some(
      (item) =>
        normalizarTexto(item.numeroDocumento) ===
        remitenteNormalizado.numeroDocumento
    );

    if (existe) {
      toast.error("Este remitente ya fue agregado");
      return;
    }

    setForm((prev) => ({
      ...prev,
      remitentes: [...prev.remitentes, remitenteNormalizado],
    }));

    setRemitenteTemp(initialEntidad);
    setDireccionRemitenteTemp(initialDireccion);
  };

  const agregarDestinatario = () => {
    if (isView) return;

    const primeraDireccion = destinatarioTemp.direcciones?.[0];

    const destinatarioNormalizado = {
      tipo: "DESTINATARIO",
      tipoDocumento: destinatarioTemp.tipoDocumento || "6",
      numeroDocumento: normalizarTexto(destinatarioTemp.numeroDocumento),
      razonSocial: normalizarMayuscula(destinatarioTemp.razonSocial),
      direccionFiscal: primeraDireccion?.direccion || "",
      direcciones: destinatarioTemp.direcciones || [],
    };

    if (
      !destinatarioNormalizado.numeroDocumento ||
      !destinatarioNormalizado.razonSocial
    ) {
      toast.error("Completa los datos del destinatario");
      return;
    }

    if (destinatarioNormalizado.direcciones.length === 0) {
      toast.error("Agrega al menos una dirección para el destinatario");
      return;
    }

    const existe = form.destinatarios.some(
      (item) =>
        normalizarTexto(item.numeroDocumento) ===
        destinatarioNormalizado.numeroDocumento
    );

    if (existe) {
      toast.error("Este destinatario ya fue agregado");
      return;
    }

    setForm((prev) => ({
      ...prev,
      destinatarios: [...prev.destinatarios, destinatarioNormalizado],
    }));

    setDestinatarioTemp(initialEntidad);
    setDireccionDestinatarioTemp(initialDireccion);
  };

  const eliminarRemitente = (index) => {
    if (isView) return;

    setForm((prev) => ({
      ...prev,
      remitentes: prev.remitentes.filter((_, i) => i !== index),
    }));
  };

  const eliminarDestinatario = (index) => {
    if (isView) return;

    setForm((prev) => ({
      ...prev,
      destinatarios: prev.destinatarios.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isView) return;

    const data = {
      tipoDocumento: form.tipoDocumento || "6",
      numeroDocumento: normalizarTexto(form.numeroDocumento),
      razonSocial: normalizarMayuscula(form.razonSocial),
      direccionFiscal: normalizarMayuscula(form.direccionFiscal),
      entidadesRelacionadas: [...form.remitentes, ...form.destinatarios],
    };

    if (!data.numeroDocumento || !data.razonSocial || !data.direccionFiscal) {
      toast.error("Completa los datos principales del cliente");
      return;
    }

    await onSubmit(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-3 py-4 sm:px-4">
      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-gray-800 bg-gray-900 shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-gray-800 bg-gray-900 px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-xl font-bold text-white">{titulo}</h2>
            <p className="text-sm text-gray-400">
              Cliente, remitentes, destinatarios y direcciones frecuentes.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="text-2xl text-gray-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-6 overflow-y-auto p-4 sm:p-6">
            <section className={sectionClass}>
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-white">
                  Datos del cliente
                </h3>
                <p className="text-sm text-gray-400">
                  Información principal de la empresa solicitante.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                <div className="md:col-span-2">
                  <label className={labelClass}>Tipo doc.</label>
                  <TipoDocumentoSelect
                    value={form.tipoDocumento}
                    onChange={handleClienteChange}
                    disabled={isView}
                    inputClass={inputClass}
                  />
                </div>

                <div className="md:col-span-3">
                  <label className={labelClass}>N° documento</label>
                  <input
                    type="text"
                    name="numeroDocumento"
                    value={form.numeroDocumento}
                    onChange={handleClienteChange}
                    disabled={isView}
                    className={inputClass}
                    placeholder="20600000000"
                  />
                </div>

                <div className="md:col-span-7">
                  <label className={labelClass}>Razón social</label>
                  <input
                    type="text"
                    name="razonSocial"
                    value={form.razonSocial}
                    onChange={handleClienteChange}
                    disabled={isView}
                    className={`${inputClass} uppercase`}
                    placeholder="TRANSPORTES J EIRL"
                  />
                </div>

                <div className="md:col-span-12">
                  <label className={labelClass}>Dirección fiscal</label>
                  <input
                    type="text"
                    name="direccionFiscal"
                    value={form.direccionFiscal}
                    onChange={handleClienteChange}
                    disabled={isView}
                    className={`${inputClass} uppercase`}
                    placeholder="Dirección fiscal"
                  />
                </div>
              </div>
            </section>

            {!isView && (
              <EntidadForm
                tipo="remitente"
                entidad={remitenteTemp}
                direccion={direccionRemitenteTemp}
                onEntidadChange={handleRemitenteChange}
                onDireccionChange={handleDireccionRemitenteChange}
                onAddDireccion={agregarDireccionRemitenteTemp}
                onRemoveDireccion={eliminarDireccionRemitenteTemp}
                onAddEntidad={agregarRemitente}
                placeholderRazonSocial="AGENCIA DE ADUANAS SLI"
                placeholderDireccion="CALLAO"
                inputClass={inputClass}
                inputDarkClass={inputDarkClass}
                labelClass={labelClass}
                sectionClass={sectionClass}
                subSectionClass={subSectionClass}
                smallCardClass={smallCardClass}
                isView={isView}
              />
            )}

            <ListaEntidades
              titulo="Remitentes registrados"
              emptyText="No hay remitentes registrados."
              entidades={form.remitentes}
              onRemove={eliminarRemitente}
              isView={isView}
              sectionClass={sectionClass}
              cardClass={cardClass}
              smallCardClass={smallCardClass}
            />

            {!isView && (
              <EntidadForm
                tipo="destinatario"
                entidad={destinatarioTemp}
                direccion={direccionDestinatarioTemp}
                onEntidadChange={handleDestinatarioChange}
                onDireccionChange={handleDireccionDestinatarioChange}
                onAddDireccion={agregarDireccionDestinatarioTemp}
                onRemoveDireccion={eliminarDireccionDestinatarioTemp}
                onAddEntidad={agregarDestinatario}
                placeholderRazonSocial="MANUCHAR"
                placeholderDireccion="LURÍN"
                inputClass={inputClass}
                inputDarkClass={inputDarkClass}
                labelClass={labelClass}
                sectionClass={sectionClass}
                subSectionClass={subSectionClass}
                smallCardClass={smallCardClass}
                isView={isView}
              />
            )}

            <ListaEntidades
              titulo="Destinatarios registrados"
              emptyText="No hay destinatarios registrados."
              entidades={form.destinatarios}
              onRemove={eliminarDestinatario}
              isView={isView}
              sectionClass={sectionClass}
              cardClass={cardClass}
              smallCardClass={smallCardClass}
            />
          </div>

          <div className="border-t border-gray-800 bg-gray-900 px-5 py-4 sm:px-6">
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="rounded-lg bg-gray-700 px-5 py-2 text-white hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isView ? "Cerrar" : "Cancelar"}
              </button>

              {!isView && (
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-900"
                >
                  {loading
                    ? "Guardando..."
                    : isCreate
                    ? "Guardar cliente"
                    : "Actualizar cliente"}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ClienteModal;
