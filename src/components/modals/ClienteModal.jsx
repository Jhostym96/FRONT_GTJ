import { useEffect, useMemo, useState } from "react";
import { notify } from "../../utils/notify";

const initialForm = {
  tipoDocumento: "6",
  numeroDocumento: "",
  razonSocial: "",
  direccionFiscal: "",
  diasCredito: "0",
  remitentes: [],
  destinatarios: [],
};

const initialEntidad = {
  tipo: "REMITENTE",
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

const styles = {
  input:
    "input px-3 py-2 placeholder:text-gray-500",
  inputSoft:
    "input px-3 py-2 placeholder:text-gray-500",
  label: "text-muted mb-1 block text-sm font-medium",
  section: "panel p-5",
  card: "mobile-card p-4",
  smallCard: "info-tile border p-3 text-sm",
};

function normalizarMayuscula(valor) {
  if (typeof valor !== "string") return "";
  return valor.trim().toUpperCase();
}

function normalizarTexto(valor) {
  if (typeof valor !== "string") return "";
  return valor.trim();
}

function validarUbigeo(ubigeo) {
  return /^\d{6}$/.test(String(ubigeo || ""));
}

function validarCodigoSunat(codigo) {
  return /^\d{4}$/.test(String(codigo || ""));
}

function normalizarDireccion(direccion) {
  return {
    id: direccion?.id,
    nombre: normalizarMayuscula(direccion?.nombre),
    ubigeo: normalizarTexto(direccion?.ubigeo),
    direccion: normalizarMayuscula(direccion?.direccion),
    referencia: normalizarMayuscula(direccion?.referencia),
    codigoEstablecimientoSunat:
      normalizarTexto(direccion?.codigoEstablecimientoSunat) || "0000",
  };
}

function normalizarEntidad(entidad, tipo) {
  const direcciones = Array.isArray(entidad?.direcciones)
    ? entidad.direcciones.map(normalizarDireccion)
    : [];

  return {
    id: entidad?.id,
    tipo,
    tipoDocumento: entidad?.tipoDocumento || "6",
    numeroDocumento: normalizarTexto(entidad?.numeroDocumento),
    razonSocial: normalizarMayuscula(entidad?.razonSocial),
    direccionFiscal:
      normalizarMayuscula(entidad?.direccionFiscal) || direcciones?.[0]?.direccion || "",
    direcciones,
  };
}

function obtenerEntidadesPorTipo(cliente, tipo) {
  if (!cliente) return [];

  const desdeEntidadesRelacionadas = Array.isArray(cliente.entidadesRelacionadas)
    ? cliente.entidadesRelacionadas.filter((entidad) => entidad.tipo === tipo)
    : [];

  const desdeCampoDirecto =
    tipo === "REMITENTE"
      ? Array.isArray(cliente.remitentes)
        ? cliente.remitentes
        : []
      : Array.isArray(cliente.destinatarios)
      ? cliente.destinatarios
      : [];

  const origen =
    desdeEntidadesRelacionadas.length > 0
      ? desdeEntidadesRelacionadas
      : desdeCampoDirecto;

  return origen.map((entidad) => normalizarEntidad(entidad, tipo));
}

function TipoDocumentoSelect({ value, onChange, disabled = false, inputClass }) {
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

function EmptyState({ text }) {
  return (
    <div className="empty-panel p-5">
      <p className="text-muted text-sm">{text}</p>
    </div>
  );
}

function DireccionCard({ direccion, onRemove, isView }) {
  return (
    <div className={styles.smallCard}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-main font-semibold">{direccion.nombre}</p>
          <p className="text-muted mt-1 break-words">{direccion.direccion}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            <span className="info-tile rounded-full px-2 py-1 text-muted">
              Ubigeo: {direccion.ubigeo}
            </span>
            <span className="info-tile rounded-full px-2 py-1 text-muted">
              SUNAT: {direccion.codigoEstablecimientoSunat || "0000"}
            </span>
          </div>
          {direccion.referencia && (
            <p className="text-faint mt-2 break-words">
              Ref: {direccion.referencia}
            </p>
          )}
        </div>

        {!isView && onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="shrink-0 text-sm text-red-400 hover:text-red-300"
          >
            Quitar
          </button>
        )}
      </div>
    </div>
  );
}

function EntidadesResumen({ tipo, entidades, onAdd, onEdit, onRemove, isView }) {
  const titulo = tipo === "REMITENTE" ? "Remitentes" : "Destinatarios";
  const emptyText =
    tipo === "REMITENTE"
      ? "Aún no hay remitentes registrados para este cliente."
      : "Aún no hay destinatarios registrados para este cliente.";

  return (
    <section className={styles.section}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-main text-lg font-semibold">{titulo}</h3>
          <p className="text-muted text-sm">
            Se usarán en órdenes de servicio y guías de transportista.
          </p>
        </div>

        {!isView && (
          <button
            type="button"
            onClick={onAdd}
            className="btn-primary px-3 py-1.5 text-sm"
          >
            + Agregar {tipo === "REMITENTE" ? "remitente" : "destinatario"}
          </button>
        )}
      </div>

      {!entidades || entidades.length === 0 ? (
        <EmptyState text={emptyText} />
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {entidades.map((entidad, index) => (
            <div key={entidad.id || `${tipo}-${index}`} className={styles.card}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-emerald-900/60 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                      {tipo}
                    </span>
                    <span className="info-tile rounded-full px-2.5 py-1 text-xs text-muted">
                      {entidad.tipoDocumento === "6" ? "RUC" : "DOC"}: {entidad.numeroDocumento}
                    </span>
                  </div>

                  <p className="text-main break-words font-semibold">
                    {entidad.razonSocial}
                  </p>

                  <p className="text-muted mt-1 text-sm">
                    {entidad.direcciones?.length || 0} dirección(es) registrada(s)
                  </p>
                </div>

                {!isView && (
                  <div className="flex shrink-0 gap-3 text-sm">
                    <button
                      type="button"
                      onClick={() => onEdit(index)}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemove(index)}
                      className="text-red-400 hover:text-red-300"
                    >
                      Eliminar
                    </button>
                  </div>
                )}
              </div>

              {entidad.direcciones?.length > 0 && (
                <div className="mt-4 grid grid-cols-1 gap-3">
                  {entidad.direcciones.map((direccion, i) => (
                    <DireccionCard
                      key={direccion.id || `${tipo}-dir-${index}-${i}`}
                      direccion={direccion}
                      isView
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function EntidadRelacionadaModal({
  isOpen,
  tipo,
  entidadInicial,
  editIndex,
  entidadesExistentes,
  onClose,
  onSave,
}) {
  const [entidad, setEntidad] = useState({ ...initialEntidad, tipo });
  const [direccionTemp, setDireccionTemp] = useState(initialDireccion);

  const esEdicion = editIndex !== null && editIndex !== undefined;

  const titulo = useMemo(() => {
    const nombre = tipo === "REMITENTE" ? "remitente" : "destinatario";
    return esEdicion ? `Editar ${nombre}` : `Nuevo ${nombre}`;
  }, [tipo, esEdicion]);

  useEffect(() => {
    if (!isOpen) return;

    if (entidadInicial) {
      setEntidad({
        ...initialEntidad,
        ...entidadInicial,
        tipo,
        direcciones: Array.isArray(entidadInicial.direcciones)
          ? entidadInicial.direcciones
          : [],
      });
    } else {
      setEntidad({ ...initialEntidad, tipo });
    }

    setDireccionTemp(initialDireccion);
  }, [isOpen, entidadInicial, tipo]);

  if (!isOpen) return null;

  const handleEntidadChange = (e) => {
    const { name, value } = e.target;
    setEntidad((prev) => ({ ...prev, [name]: value }));
  };

  const handleDireccionChange = (e) => {
    const { name, value } = e.target;
    setDireccionTemp((prev) => ({ ...prev, [name]: value }));
  };

  const agregarDireccion = () => {
    const direccionNormalizada = normalizarDireccion(direccionTemp);

    if (
      !direccionNormalizada.nombre ||
      !direccionNormalizada.ubigeo ||
      !direccionNormalizada.direccion
    ) {
      notify.error("Completa nombre, ubigeo y dirección");
      return;
    }

    if (!validarUbigeo(direccionNormalizada.ubigeo)) {
      notify.error("El ubigeo debe tener 6 dígitos numéricos");
      return;
    }

    if (!validarCodigoSunat(direccionNormalizada.codigoEstablecimientoSunat)) {
      notify.error("El código SUNAT debe tener 4 dígitos numéricos");
      return;
    }

    setEntidad((prev) => ({
      ...prev,
      direcciones: [...prev.direcciones, direccionNormalizada],
    }));

    setDireccionTemp(initialDireccion);
  };

  const eliminarDireccion = (index) => {
    setEntidad((prev) => ({
      ...prev,
      direcciones: prev.direcciones.filter((_, i) => i !== index),
    }));
  };

  const guardarEntidad = () => {
    const entidadNormalizada = normalizarEntidad(entidad, tipo);

    if (!entidadNormalizada.numeroDocumento || !entidadNormalizada.razonSocial) {
      notify.error("Completa el documento y la razón social");
      return;
    }

    if (entidadNormalizada.direcciones.length === 0) {
      notify.error("Agrega al menos una dirección");
      return;
    }

    const existe = entidadesExistentes.some((item, index) => {
      if (esEdicion && index === editIndex) return false;
      return normalizarTexto(item.numeroDocumento) === entidadNormalizada.numeroDocumento;
    });

    if (existe) {
      notify.error(
        tipo === "REMITENTE"
          ? "Este remitente ya fue agregado"
          : "Este destinatario ya fue agregado"
      );
      return;
    }

    onSave(entidadNormalizada, editIndex);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-3 py-4 sm:px-4">
      <div className="panel flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden">
        <div className="flex items-start justify-between gap-4 border-b px-5 py-4 sm:px-6">
          <div>
            <h3 className="text-main text-xl font-bold">{titulo}</h3>
            <p className="text-muted text-sm">
              Registra la entidad y sus direcciones frecuentes.
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

        <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
          <section className={styles.section}>
            <h4 className="text-main mb-4 font-semibold">Datos principales</h4>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
              <div className="md:col-span-2">
                <label className={styles.label}>Tipo doc.</label>
                <TipoDocumentoSelect
                  value={entidad.tipoDocumento}
                  onChange={handleEntidadChange}
                  inputClass={styles.input}
                />
              </div>

              <div className="md:col-span-3">
                <label className={styles.label}>N° documento</label>
                <input
                  type="text"
                  name="numeroDocumento"
                  value={entidad.numeroDocumento}
                  onChange={handleEntidadChange}
                  className={styles.input}
                  placeholder="Ingrese el número de documento"
                />
              </div>

              <div className="md:col-span-7">
                <label className={styles.label}>Razón social</label>
                <input
                  type="text"
                  name="razonSocial"
                  value={entidad.razonSocial}
                  onChange={handleEntidadChange}
                  className={`${styles.input} uppercase`}
                  placeholder={
                    tipo === "REMITENTE"
                      ? "Ingrese la razón social del remitente"
                      : "Ingrese la razón social del destinatario"
                  }
                />
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <div className="mb-4">
              <h4 className="text-main font-semibold">Agregar dirección</h4>
              <p className="text-muted text-sm">
                El ubigeo debe tener 6 dígitos y el código SUNAT 4 dígitos.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
              <div className="md:col-span-2">
                <label className={styles.label}>Nombre</label>
                <input
                  type="text"
                  name="nombre"
                  value={direccionTemp.nombre}
                  onChange={handleDireccionChange}
                  className={`${styles.inputSoft} uppercase`}
                  placeholder="Nombre corto de la dirección"
                />
              </div>

              <div className="md:col-span-2">
                <label className={styles.label}>Ubigeo</label>
                <input
                  type="text"
                  name="ubigeo"
                  value={direccionTemp.ubigeo}
                  onChange={handleDireccionChange}
                  maxLength={6}
                  className={styles.inputSoft}
                  placeholder="Ingrese el ubigeo de 6 dígitos"
                />
              </div>

              <div className="md:col-span-4">
                <label className={styles.label}>Dirección</label>
                <input
                  type="text"
                  name="direccion"
                  value={direccionTemp.direccion}
                  onChange={handleDireccionChange}
                  className={`${styles.inputSoft} uppercase`}
                  placeholder="Ingrese la dirección completa"
                />
              </div>

              <div className="md:col-span-2">
                <label className={styles.label}>Cód. SUNAT</label>
                <input
                  type="text"
                  name="codigoEstablecimientoSunat"
                  value={direccionTemp.codigoEstablecimientoSunat}
                  onChange={handleDireccionChange}
                  maxLength={4}
                  className={styles.inputSoft}
                  placeholder="Ingrese el código SUNAT"
                />
              </div>

              <div className="md:col-span-2 md:self-end">
                <button
                  type="button"
                  onClick={agregarDireccion}
                  className="btn-success w-full px-3 py-1.5"
                >
                  Agregar
                </button>
              </div>

              <div className="md:col-span-12">
                <label className={styles.label}>Referencia</label>
                <input
                  type="text"
                  name="referencia"
                  value={direccionTemp.referencia}
                  onChange={handleDireccionChange}
                  className={`${styles.inputSoft} uppercase`}
                  placeholder="Ingrese una referencia opcional"
                />
              </div>
            </div>

            <div className="mt-4">
              {entidad.direcciones.length === 0 ? (
                <EmptyState text="Aún no agregaste direcciones." />
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {entidad.direcciones.map((direccion, index) => (
                    <DireccionCard
                      key={direccion.id || `dir-temp-${index}`}
                      direccion={direccion}
                      onRemove={() => eliminarDireccion(index)}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="border-t px-5 py-4 sm:px-6">
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary px-3 py-1.5"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={guardarEntidad}
              className="btn-primary px-3 py-1.5"
            >
              {esEdicion ? "Guardar cambios" : "Agregar al cliente"}
            </button>
          </div>
        </div>
      </div>
    </div>
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
  const [submodal, setSubmodal] = useState({
    open: false,
    tipo: "REMITENTE",
    editIndex: null,
    entidad: null,
  });

  const isView = mode === "view";
  const isEdit = mode === "edit";
  const isCreate = mode === "create";

  useEffect(() => {
    if (!isOpen) return;

    if (clienteSeleccionado && (isEdit || isView)) {
      setForm({
        tipoDocumento: clienteSeleccionado.tipoDocumento || "6",
        numeroDocumento: clienteSeleccionado.numeroDocumento || "",
        razonSocial: clienteSeleccionado.razonSocial || "",
        direccionFiscal: clienteSeleccionado.direccionFiscal || "",
        diasCredito: String(clienteSeleccionado.diasCredito ?? 0),
        remitentes: obtenerEntidadesPorTipo(clienteSeleccionado, "REMITENTE"),
        destinatarios: obtenerEntidadesPorTipo(clienteSeleccionado, "DESTINATARIO"),
      });
    } else if (isCreate) {
      setForm(initialForm);
    }

    setSubmodal({
      open: false,
      tipo: "REMITENTE",
      editIndex: null,
      entidad: null,
    });
  }, [isOpen, clienteSeleccionado, mode, isCreate, isEdit, isView]);

  if (!isOpen) return null;

  const titulo = {
    create: "Nuevo cliente",
    edit: "Editar cliente",
    view: "Detalle del cliente",
  }[mode];

  const handleClienteChange = (e) => {
    if (isView) return;
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const abrirNuevo = (tipo) => {
    setSubmodal({
      open: true,
      tipo,
      editIndex: null,
      entidad: null,
    });
  };

  const abrirEditar = (tipo, index) => {
    const lista = tipo === "REMITENTE" ? form.remitentes : form.destinatarios;
    setSubmodal({
      open: true,
      tipo,
      editIndex: index,
      entidad: lista[index],
    });
  };

  const cerrarSubmodal = () => {
    setSubmodal((prev) => ({ ...prev, open: false }));
  };

  const guardarEntidadRelacionada = (entidad, editIndex) => {
    const campo = entidad.tipo === "REMITENTE" ? "remitentes" : "destinatarios";

    setForm((prev) => {
      const listaActual = Array.isArray(prev[campo]) ? prev[campo] : [];

      if (editIndex !== null && editIndex !== undefined) {
        return {
          ...prev,
          [campo]: listaActual.map((item, index) =>
            index === editIndex ? entidad : item
          ),
        };
      }

      return {
        ...prev,
        [campo]: [...listaActual, entidad],
      };
    });

    cerrarSubmodal();
  };

  const eliminarEntidad = (tipo, index) => {
    const campo = tipo === "REMITENTE" ? "remitentes" : "destinatarios";

    setForm((prev) => ({
      ...prev,
      [campo]: prev[campo].filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isView) return;

    const data = {
      id: clienteSeleccionado?.id,
      tipoDocumento: form.tipoDocumento || "6",
      numeroDocumento: normalizarTexto(form.numeroDocumento),
      razonSocial: normalizarMayuscula(form.razonSocial),
      direccionFiscal: normalizarMayuscula(form.direccionFiscal),
      diasCredito: Number(form.diasCredito || 0),
      entidadesRelacionadas: [
        ...form.remitentes.map((item) => normalizarEntidad(item, "REMITENTE")),
        ...form.destinatarios.map((item) => normalizarEntidad(item, "DESTINATARIO")),
      ],
    };

    if (!data.numeroDocumento || !data.razonSocial || !data.direccionFiscal) {
      notify.error("Completa los datos principales del cliente");
      return;
    }

    await onSubmit(data);
  };

  return (
    <>
      <div className="modal-backdrop">
        <div className="panel flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden">
          <div className="flex items-start justify-between gap-4 border-b px-5 py-4 sm:px-6">
            <div>
              <h2 className="text-main text-xl font-bold">{titulo}</h2>
              <p className="text-muted text-sm">
                Cliente, remitentes, destinatarios y direcciones frecuentes.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="text-muted text-2xl hover:text-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 space-y-6 overflow-y-auto p-4 sm:p-6">
              <section className={styles.section}>
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-main text-lg font-semibold">
                      Datos del cliente
                    </h3>
                    <p className="text-muted text-sm">
                      Información principal de la empresa solicitante.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="info-tile rounded-full px-3 py-1 text-muted">
                      {form.remitentes.length} remitente(s)
                    </span>
                    <span className="info-tile rounded-full px-3 py-1 text-muted">
                      {form.destinatarios.length} destinatario(s)
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                  <div className="md:col-span-2">
                    <label className={styles.label}>Tipo doc.</label>
                    <TipoDocumentoSelect
                      value={form.tipoDocumento}
                      onChange={handleClienteChange}
                      disabled={isView}
                      inputClass={styles.input}
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className={styles.label}>N° documento</label>
                    <input
                      type="text"
                      name="numeroDocumento"
                      value={form.numeroDocumento}
                      onChange={handleClienteChange}
                      disabled={isView}
                      className={styles.input}
                      placeholder="Ingrese el número de documento"
                    />
                  </div>

                  <div className="md:col-span-7">
                    <label className={styles.label}>Razón social</label>
                    <input
                      type="text"
                      name="razonSocial"
                      value={form.razonSocial}
                      onChange={handleClienteChange}
                      disabled={isView}
                      className={`${styles.input} uppercase`}
                      placeholder="Ingrese la razón social del cliente"
                    />
                  </div>

                  <div className="md:col-span-12">
                    <label className={styles.label}>Dirección fiscal</label>
                    <input
                      type="text"
                      name="direccionFiscal"
                      value={form.direccionFiscal}
                      onChange={handleClienteChange}
                      disabled={isView}
                      className={`${styles.input} uppercase`}
                      placeholder="Ingrese la dirección fiscal del cliente"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className={styles.label}>Días de crédito</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      name="diasCredito"
                      value={form.diasCredito}
                      onChange={handleClienteChange}
                      disabled={isView}
                      className={styles.input}
                      placeholder="0"
                    />
                  </div>
                </div>
              </section>

              <EntidadesResumen
                tipo="REMITENTE"
                entidades={form.remitentes}
                onAdd={() => abrirNuevo("REMITENTE")}
                onEdit={(index) => abrirEditar("REMITENTE", index)}
                onRemove={(index) => eliminarEntidad("REMITENTE", index)}
                isView={isView}
              />

              <EntidadesResumen
                tipo="DESTINATARIO"
                entidades={form.destinatarios}
                onAdd={() => abrirNuevo("DESTINATARIO")}
                onEdit={(index) => abrirEditar("DESTINATARIO", index)}
                onRemove={(index) => eliminarEntidad("DESTINATARIO", index)}
                isView={isView}
              />
            </div>

            <div className="border-t px-5 py-4 sm:px-6">
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
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
                    className="btn-primary px-3 py-1.5"
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

      <EntidadRelacionadaModal
        isOpen={submodal.open}
        tipo={submodal.tipo}
        entidadInicial={submodal.entidad}
        editIndex={submodal.editIndex}
        entidadesExistentes={
          submodal.tipo === "REMITENTE" ? form.remitentes : form.destinatarios
        }
        onClose={cerrarSubmodal}
        onSave={guardarEntidadRelacionada}
      />
    </>
  );
}

export default ClienteModal;
