import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clipboard,
  FileJson,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";
import { useGuiaTransportista } from "../context/GuiaTransportistaContext";
import { getRecordId } from "../utils/apiData";
import { notify } from "../utils/notify";

const REQUIRED_FIELDS = [
  { path: "operacion", label: "Operación", expected: "generar_guia" },
  { path: "tipo_de_comprobante", label: "Tipo de comprobante", expected: "8" },
  { path: "serie", label: "Serie" },
  { path: "numero", label: "Número" },
  { path: "cliente_tipo_de_documento", label: "Tipo doc. remitente" },
  { path: "cliente_numero_de_documento", label: "Documento remitente" },
  { path: "cliente_denominacion", label: "Razón social remitente" },
  { path: "cliente_direccion", label: "Dirección remitente" },
  { path: "fecha_de_emision", label: "Fecha emisión" },
  { path: "peso_bruto_total", label: "Peso bruto total" },
  { path: "peso_bruto_unidad_de_medida", label: "Unidad peso" },
  { path: "fecha_de_inicio_de_traslado", label: "Inicio traslado" },
  { path: "transportista_placa_numero", label: "Placa principal" },
  { path: "conductor_documento_tipo", label: "Tipo doc. conductor" },
  { path: "conductor_documento_numero", label: "Documento conductor" },
  { path: "conductor_nombre", label: "Nombre conductor" },
  { path: "conductor_apellidos", label: "Apellidos conductor" },
  { path: "conductor_numero_licencia", label: "Licencia conductor" },
  { path: "mtc", label: "MTC" },
  { path: "sunat_envio_indicador", label: "Indicador SUNAT" },
  { path: "destinatario_documento_tipo", label: "Tipo doc. destinatario" },
  { path: "destinatario_documento_numero", label: "Documento destinatario" },
  { path: "destinatario_denominacion", label: "Razón social destinatario" },
  { path: "punto_de_partida_ubigeo", label: "Ubigeo partida" },
  { path: "punto_de_partida_direccion", label: "Dirección partida" },
  { path: "punto_de_llegada_ubigeo", label: "Ubigeo llegada" },
  { path: "punto_de_llegada_direccion", label: "Dirección llegada" },
  { path: "formato_de_pdf", label: "Formato PDF" },
  { path: "items", label: "Items" },
];

const FORMAT_RULES = [
  {
    key: "serie",
    label: "Serie de guía",
    test: (json) => /^V[A-Z0-9]{3}$/.test(String(json?.serie || "")),
    detail: "Debe iniciar con V y tener 4 caracteres.",
  },
  {
    key: "numero",
    label: "Número correlativo",
    test: (json) => /^\d{1,8}$/.test(String(json?.numero || "")),
    detail: "Debe ser numérico y tener máximo 8 dígitos.",
  },
  {
    key: "peso_bruto_total",
    label: "Peso bruto",
    test: (json) => Number(json?.peso_bruto_total) > 0,
    detail: "Debe ser mayor a cero.",
  },
  {
    key: "placa",
    label: "Placa principal",
    test: (json) => /^[A-Z0-9]{6,8}$/.test(String(json?.transportista_placa_numero || "")),
    detail: "Debe tener entre 6 y 8 caracteres sin guiones.",
  },
  {
    key: "licencia",
    label: "Licencia conductor",
    test: (json) => /^.{9,10}$/.test(String(json?.conductor_numero_licencia || "")),
    detail: "Debe tener entre 9 y 10 caracteres.",
  },
  {
    key: "ubigeos",
    label: "Ubigeos",
    test: (json) =>
      /^\d{6}$/.test(String(json?.punto_de_partida_ubigeo || "")) &&
      /^\d{6}$/.test(String(json?.punto_de_llegada_ubigeo || "")),
    detail: "Partida y llegada deben tener 6 dígitos.",
  },
  {
    key: "items",
    label: "Detalle de items",
    test: (json) =>
      Array.isArray(json?.items) &&
      json.items.length > 0 &&
      json.items.every(
        (item) =>
          item?.unidad_de_medida &&
          item?.descripcion &&
          Number(item?.cantidad) > 0
      ),
    detail: "Debe tener al menos un item con unidad, descripción y cantidad.",
  },
];

const getValue = (obj, path) =>
  path.split(".").reduce((current, key) => current?.[key], obj);

const hasValue = (value) => {
  if (Array.isArray(value)) return value.length > 0;
  if (value === 0 || value === false) return true;
  return value !== null && value !== undefined && String(value).trim() !== "";
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const stringifyJson = (value) => JSON.stringify(value || {}, null, 2);

const EstadoCheck = ({ ok }) =>
  ok ? (
    <CheckCircle2 className="h-4 w-4 text-green-500" />
  ) : (
    <XCircle className="h-4 w-4 text-red-500" />
  );

const NubefactPruebasPage = () => {
  const {
    guiasTransportista,
    loadingGuia,
    obtenerGuiasTransportista,
    obtenerGuiaTransportista,
    obtenerHistorialGuiaTransportista,
    generarJsonGuiaTransportista,
  } = useGuiaTransportista();

  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [guiaDetalle, setGuiaDetalle] = useState(null);
  const [historial, setHistorial] = useState(null);
  const [jsonGenerado, setJsonGenerado] = useState(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [jsonTab, setJsonTab] = useState("guardado");
  const obtenerGuiaTransportistaRef = useRef(obtenerGuiaTransportista);
  const obtenerHistorialGuiaTransportistaRef = useRef(
    obtenerHistorialGuiaTransportista
  );

  useEffect(() => {
    obtenerGuiaTransportistaRef.current = obtenerGuiaTransportista;
    obtenerHistorialGuiaTransportistaRef.current =
      obtenerHistorialGuiaTransportista;
  }, [obtenerGuiaTransportista, obtenerHistorialGuiaTransportista]);

  useEffect(() => {
    obtenerGuiasTransportista({ page: 1, limit: 50 });
  }, [obtenerGuiasTransportista]);

  useEffect(() => {
    if (!selectedId && guiasTransportista.length > 0) {
      setSelectedId(String(getRecordId(guiasTransportista[0])));
    }
  }, [guiasTransportista, selectedId]);

  const cargarDetalle = useCallback(async () => {
    if (!selectedId) return;

    try {
      setLoadingDetalle(true);
      setJsonGenerado(null);
      setJsonTab("guardado");

      const [guia, dataHistorial] = await Promise.all([
        obtenerGuiaTransportistaRef.current(selectedId),
        obtenerHistorialGuiaTransportistaRef.current(selectedId),
      ]);

      setGuiaDetalle(guia);
      setHistorial(dataHistorial);
    } catch (error) {
      notify.error("No se pudo cargar el diagnóstico de la guía");
    } finally {
      setLoadingDetalle(false);
    }
  }, [selectedId]);

  useEffect(() => {
    cargarDetalle();
  }, [cargarDetalle]);

  const guiasFiltradas = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return guiasTransportista;

    return guiasTransportista.filter((guia) => {
      const texto = [
        guia.serie,
        guia.numero,
        guia.cliente_denominacion,
        guia.cliente_numero_de_documento,
        guia.destinatario_denominacion,
        guia.transportista_placa_numero,
        guia.estado,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return texto.includes(query);
    });
  }, [guiasTransportista, search]);

  const jsonGuardado = guiaDetalle?.json_enviado || null;
  const jsonActivo = jsonTab === "generado" ? jsonGenerado : jsonGuardado;
  const intentos = historial?.intentosNubefact || [];

  const checklist = useMemo(
    () =>
      REQUIRED_FIELDS.map((field) => {
        const value = getValue(jsonActivo, field.path);
        const ok = hasValue(value);

        return {
          ...field,
          ok,
          value,
        };
      }),
    [jsonActivo]
  );

  const reglasFormato = useMemo(
    () =>
      FORMAT_RULES.map((rule) => ({
        ...rule,
        ok: Boolean(jsonActivo) && rule.test(jsonActivo),
      })),
    [jsonActivo]
  );

  const faltantes = checklist.filter((item) => !item.ok);
  const formatosInvalidos = reglasFormato.filter((item) => !item.ok);
  const totalOk = faltantes.length === 0 && formatosInvalidos.length === 0;

  const handleRegenerarJson = async () => {
    if (!selectedId) return;

    try {
      const json = await generarJsonGuiaTransportista(selectedId);
      setJsonGenerado(json);
      setJsonTab("generado");
      notify.success("JSON regenerado para revisión");
    } catch (error) {
      notify.error("No se pudo regenerar el JSON de la guía");
    }
  };

  const copiarJson = async () => {
    if (!jsonActivo) return;

    try {
      await navigator.clipboard.writeText(stringifyJson(jsonActivo));
      notify.success("JSON copiado");
    } catch {
      notify.error("No se pudo copiar el JSON");
    }
  };

  const selectedLabel = guiaDetalle
    ? `${guiaDetalle.serie || "-"}-${guiaDetalle.numero || "-"}`
    : "Sin guía seleccionada";

  return (
    <div className="page">
      <div className="page-wrap">
        <header className="page-hero">
          <div className="page-hero-content">
            <div>
              <div className="eyebrow">Diagnóstico Nubefact</div>
              <h1 className="page-title">Prueba de JSON de guías</h1>
              <p className="page-description">
                Revisa el JSON guardado, intentos de envío y campos exigidos
                antes de emitir o corregir una guía.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRegenerarJson}
              disabled={!selectedId || loadingGuia || loadingDetalle}
              className="btn-primary px-3 py-2"
            >
              <RefreshCw className="h-4 w-4" />
              Regenerar JSON
            </button>
          </div>
        </header>

        <section className="panel grid gap-3 p-4 lg:grid-cols-[1fr_320px]">
          <label className="relative">
            <Search className="text-faint pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="input w-full pl-9"
              placeholder="Buscar por serie, número, cliente, placa o estado"
            />
          </label>

          <select
            value={selectedId}
            onChange={(event) => setSelectedId(event.target.value)}
            className="input"
          >
            {guiasFiltradas.length === 0 ? (
              <option value="">No hay guías para mostrar</option>
            ) : (
              guiasFiltradas.map((guia) => {
                const id = getRecordId(guia);
                return (
                  <option key={id} value={id}>
                    {guia.serie || "-"}-{guia.numero || "-"} |{" "}
                    {guia.cliente_denominacion || "Sin cliente"}
                  </option>
                );
              })
            )}
          </select>
        </section>

        {loadingGuia || loadingDetalle ? (
          <div className="loading-panel">
            <div className="loading-spinner" />
            <p className="text-muted text-sm">Cargando diagnóstico...</p>
          </div>
        ) : !guiaDetalle ? (
          <div className="empty-panel">
            <h2 className="text-main text-lg font-semibold">
              No hay guía seleccionada
            </h2>
            <p className="text-muted mt-1 text-sm">
              Crea o selecciona una guía de transportista para revisar su JSON.
            </p>
          </div>
        ) : (
          <>
            <section className="grid gap-4 xl:grid-cols-4">
              <div className="panel p-4">
                <p className="text-faint text-xs font-bold uppercase">Guía</p>
                <h2 className="text-main mt-1 text-xl font-extrabold">
                  {selectedLabel}
                </h2>
                <p className="text-muted mt-1 text-sm">
                  Estado: {guiaDetalle.estado || "-"}
                </p>
              </div>

              <div className="panel p-4">
                <p className="text-faint text-xs font-bold uppercase">Cliente</p>
                <p className="text-main mt-1 truncate text-base font-bold">
                  {guiaDetalle.cliente_denominacion || "-"}
                </p>
                <p className="text-muted text-sm">
                  {guiaDetalle.cliente_numero_de_documento || "-"}
                </p>
              </div>

              <div className="panel p-4">
                <p className="text-faint text-xs font-bold uppercase">Unidad</p>
                <p className="text-main mt-1 text-base font-bold">
                  {guiaDetalle.transportista_placa_numero || "-"}
                </p>
                <p className="text-muted text-sm">
                  MTC: {guiaDetalle.mtc || "-"}
                </p>
              </div>

              <div className="panel p-4">
                <p className="text-faint text-xs font-bold uppercase">
                  Intentos Nubefact
                </p>
                <p className="text-main mt-1 text-2xl font-extrabold">
                  {intentos.length}
                </p>
                <p className="text-muted text-sm">
                  Último: {formatDateTime(intentos[0]?.createdAt)}
                </p>
              </div>
            </section>

            <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(460px,0.9fr)]">
              <div className="grid gap-4">
                <div className="panel p-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-main text-base font-bold">
                        Conformidad del JSON
                      </h2>
                      <p className="text-muted text-sm">
                        {totalOk
                          ? "No se detectaron faltantes en las reglas locales."
                          : `${faltantes.length} campos faltantes y ${formatosInvalidos.length} formatos por revisar.`}
                      </p>
                    </div>
                    {totalOk ? (
                      <CheckCircle2 className="h-7 w-7 text-green-500" />
                    ) : (
                      <AlertCircle className="h-7 w-7 text-amber-500" />
                    )}
                  </div>

                  <div className="data-table-wrap !block w-full">
                    <div className="table-scroll">
                      <table className="data-table w-full min-w-[760px] text-sm">
                        <thead>
                          <tr>
                            <th className="px-4 py-3 text-left">Campo</th>
                            <th className="px-4 py-3 text-left">Valor</th>
                            <th className="px-4 py-3 text-center">Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {checklist.map((item) => (
                            <tr key={item.path}>
                              <td className="px-4 py-3">
                                <p className="text-main font-semibold">
                                  {item.label}
                                </p>
                                <p className="text-faint text-xs">{item.path}</p>
                              </td>
                              <td className="text-muted max-w-[360px] truncate px-4 py-3">
                                {Array.isArray(item.value)
                                  ? `${item.value.length} registro(s)`
                                  : String(item.value ?? "") || "-"}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="inline-flex items-center justify-center">
                                  <EstadoCheck ok={item.ok} />
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="panel p-4">
                  <h2 className="text-main mb-3 text-base font-bold">
                    Reglas de formato
                  </h2>
                  <div className="grid gap-3 md:grid-cols-2">
                    {reglasFormato.map((rule) => (
                      <div
                        key={rule.key}
                        className="info-tile flex items-start gap-3"
                      >
                        <EstadoCheck ok={rule.ok} />
                        <div>
                          <p className="text-main text-sm font-bold">
                            {rule.label}
                          </p>
                          <p className="text-muted text-xs">{rule.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="panel p-4">
                  <h2 className="text-main mb-3 text-base font-bold">
                    Historial de intentos
                  </h2>
                  {intentos.length === 0 ? (
                    <p className="text-muted text-sm">
                      No hay intentos registrados para esta guía.
                    </p>
                  ) : (
                    <div className="grid gap-3">
                      {intentos.slice(0, 5).map((intento) => (
                        <div
                          key={intento.id}
                          className="info-tile grid gap-2 md:grid-cols-[160px_110px_1fr]"
                        >
                          <p className="text-muted text-sm">
                            {formatDateTime(intento.createdAt)}
                          </p>
                          <p
                            className={`text-sm font-bold ${
                              intento.estado === "OK"
                                ? "text-green-500"
                                : "text-red-500"
                            }`}
                          >
                            {intento.estado || "-"}
                          </p>
                          <p className="text-muted truncate text-sm">
                            {intento.operacion || "-"}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <aside className="panel flex min-h-[620px] flex-col overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
                  <div className="flex items-center gap-2">
                    <FileJson className="h-5 w-5 text-blue-500" />
                    <div>
                      <h2 className="text-main text-base font-bold">
                        JSON enviado
                      </h2>
                      <p className="text-muted text-xs">
                        {jsonTab === "guardado"
                          ? "Payload guardado en la guía"
                          : "Payload regenerado para comparar"}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={copiarJson}
                    disabled={!jsonActivo}
                    className="btn-secondary px-3 py-2"
                  >
                    <Clipboard className="h-4 w-4" />
                    Copiar
                  </button>
                </div>

                <div className="flex gap-2 border-b p-3">
                  <button
                    type="button"
                    onClick={() => setJsonTab("guardado")}
                    className={
                      jsonTab === "guardado"
                        ? "btn-primary px-3 py-1.5"
                        : "btn-secondary px-3 py-1.5"
                    }
                  >
                    Guardado
                  </button>
                  <button
                    type="button"
                    onClick={() => setJsonTab("generado")}
                    disabled={!jsonGenerado}
                    className={
                      jsonTab === "generado"
                        ? "btn-primary px-3 py-1.5"
                        : "btn-secondary px-3 py-1.5"
                    }
                  >
                    Regenerado
                  </button>
                </div>

                <pre className="min-h-0 flex-1 overflow-auto bg-slate-950 p-4 text-xs leading-5 text-slate-100">
                  {jsonActivo
                    ? stringifyJson(jsonActivo)
                    : "Esta guía aún no tiene json_enviado guardado."}
                </pre>
              </aside>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default NubefactPruebasPage;
