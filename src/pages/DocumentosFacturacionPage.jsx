import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ClipboardCheck,
  LoaderCircle,
  PackageCheck,
  Search,
  Send,
} from "lucide-react";
import TablePagination from "../components/TablePagination";
import {
  entregarDocumentoFacturacionRequest,
  obtenerDocumentosFacturacionRequest,
  recepcionarDocumentoFacturacionRequest,
} from "../api/documentosFacturacion";
import { notify } from "../utils/notify";
import { useAuth } from "../context/AuthContext";

const estados = [
  { value: "", label: "Todos" },
  { value: "PENDIENTE", label: "Pendiente" },
  { value: "ENTREGADO", label: "Entregado" },
  { value: "RECEPCIONADO", label: "Recepcionado" },
];

const estadoConfig = {
  PENDIENTE: {
    label: "Pendiente entrega",
    className: "border-slate-500/30 bg-slate-500/10 text-slate-400",
  },
  ENTREGADO: {
    label: "Entregado a facturación",
    className: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  },
  RECEPCIONADO: {
    label: "Recepcionado",
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  },
};

const getDocumentoKey = (documento) =>
  documento?.id || `guia-${documento?.guiaTransportistaId}`;

const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
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

const EstadoBadge = ({ estado }) => {
  const config = estadoConfig[estado] || estadoConfig.PENDIENTE;

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-bold ${config.className}`}
    >
      {config.label}
    </span>
  );
};

const DocumentosFacturacionPage = () => {
  const { user } = useAuth();
  const [documentos, setDocumentos] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(false);
  const [actualizando, setActualizando] = useState({});
  const [estado, setEstado] = useState("");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState(null);
  const [observacion, setObservacion] = useState("");
  const puedeEntregar = user?.role === "Coordinador";
  const puedeRecepcionar = user?.role === "Facturacion";

  const cargarDocumentos = async (page = pagination.page) => {
    try {
      setLoading(true);
      const res = await obtenerDocumentosFacturacionRequest({
        page,
        limit: pagination.limit,
        estado,
        search: query,
      });

      setDocumentos(res.data?.documentos || res.data?.data || []);
      setPagination((prev) => ({
        ...prev,
        ...(res.data?.pagination || {}),
      }));
    } catch (error) {
      notify.error(
        error.response?.data?.message ||
          "No se pudieron cargar los documentos de facturación"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDocumentos(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado, query]);

  const counts = useMemo(() => {
    return documentos.reduce((acc, item) => {
      acc[item.estado] = (acc[item.estado] || 0) + 1;
      return acc;
    }, {});
  }, [documentos]);

  const abrirModal = (tipo, documento) => {
    setModal({ tipo, documento });
    setObservacion("");
  };

  const cerrarModal = () => {
    setModal(null);
    setObservacion("");
  };

  const ejecutarAccion = async (tipo, documento, textoObservacion = "") => {
    const guiaId = documento?.guiaTransportistaId;
    if (!guiaId) return;

    const key = getDocumentoKey(documento);

    try {
      setActualizando((prev) => ({ ...prev, [key]: true }));

      if (tipo === "entregar") {
        await entregarDocumentoFacturacionRequest(guiaId, {
          observacionOperaciones: textoObservacion,
        });
        notify.success("Documento entregado a facturación");
      }

      if (tipo === "recepcionar") {
        await recepcionarDocumentoFacturacionRequest(guiaId, {
          observacionFacturacion: textoObservacion,
        });
        notify.success("Documento recepcionado");
      }

      cerrarModal();
      await cargarDocumentos();
    } catch (error) {
      notify.error(
        error.response?.data?.message ||
          "No se pudo actualizar el documento"
      );
    } finally {
      setActualizando((prev) => ({ ...prev, [key]: false }));
    }
  };

  const confirmarModal = () => {
    if (!modal) return;

    ejecutarAccion(modal.tipo, modal.documento, observacion.trim());
  };

  const acciones = (documento) => {
    const key = getDocumentoKey(documento);
    const disabled = Boolean(actualizando[key]);

    if (documento.estado === "PENDIENTE") {
      return (
        <button
          type="button"
          onClick={() => abrirModal("entregar", documento)}
          disabled={disabled || !puedeEntregar}
          className="btn-primary"
          title={
            puedeEntregar
              ? "Entregar documentación"
              : "Solo coordinación puede entregar documentación"
          }
        >
          {disabled ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Entregar
        </button>
      );
    }

    if (documento.estado === "ENTREGADO") {
      return (
        <button
          type="button"
          onClick={() => abrirModal("recepcionar", documento)}
          disabled={disabled || !puedeRecepcionar}
          className="btn-success"
          title={
            puedeRecepcionar
              ? "Recepcionar documentación"
              : "Solo facturación puede recepcionar documentación"
          }
        >
          <ClipboardCheck className="h-4 w-4" />
          Recepcionar
        </button>
      );
    }

    return (
      <span className="text-faint text-xs font-semibold">
        Sin acciones pendientes
      </span>
    );
  };

  const modalTitle = {
    entregar: "Entregar a facturación",
    recepcionar: "Recepcionar documento",
  }[modal?.tipo];

  return (
    <div className="w-full py-4">
      <div className="page-wrap">
        <header className="page-hero">
          <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="eyebrow">Facturación</div>
              <h1 className="page-title">Recepción de documentos</h1>
              <p className="page-description">
                Control de entrega y recepción de guías físicas conformes para
                habilitar el proceso de facturación.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[420px]">
              <div className="info-tile">
                <p className="text-faint text-xs">Entregados</p>
                <p className="text-main text-xl font-bold">
                  {counts.ENTREGADO || 0}
                </p>
              </div>
              <div className="info-tile">
                <p className="text-faint text-xs">Pendientes</p>
                <p className="text-main text-xl font-bold">
                  {counts.PENDIENTE || 0}
                </p>
              </div>
              <div className="info-tile">
                <p className="text-faint text-xs">Recepcionados</p>
                <p className="text-main text-xl font-bold">
                  {counts.RECEPCIONADO || 0}
                </p>
              </div>
            </div>
          </div>
        </header>

        <section className="panel p-4">
          <div className="grid gap-3 text-sm md:grid-cols-2">
            <div className="info-tile">
              <p className="text-faint text-xs font-bold uppercase">
                Entrega operaciones
              </p>
              <p className="text-muted mt-1">
                Registra al coordinador que entrega la documentación física a
                facturación.
              </p>
            </div>
            <div className="info-tile">
              <p className="text-faint text-xs font-bold uppercase">
                Recepción facturación
              </p>
              <p className="text-muted mt-1">
                Registra a la persona de facturación que recepciona la
                documentación entregada.
              </p>
            </div>
          </div>
        </section>

        <section className="panel p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {estados.map((item) => (
                <button
                  key={item.value || "todos"}
                  type="button"
                  onClick={() => setEstado(item.value)}
                  className={estado === item.value ? "btn-primary" : "btn-secondary"}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <form
              className="flex w-full gap-2 lg:max-w-md"
              onSubmit={(event) => {
                event.preventDefault();
                setQuery(search.trim());
              }}
            >
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar guía, cliente, placa o conductor"
                className="input"
              />
              <button type="submit" className="btn-secondary btn-icon">
                <Search className="h-4 w-4" />
              </button>
            </form>
          </div>
        </section>

        {loading ? (
          <div className="panel p-8 text-center">
            <div className="mx-auto mb-3 h-9 w-9 animate-spin rounded-full border-2 border-[var(--app-border)] border-t-blue-500" />
            <p className="text-muted text-sm">Cargando documentos...</p>
          </div>
        ) : documentos.length === 0 ? (
          <div className="empty-panel">
            <PackageCheck className="mx-auto mb-3 h-9 w-9 text-[var(--app-primary)]" />
            <h2 className="text-main text-lg font-semibold">
              No hay documentos en este estado
            </h2>
            <p className="text-muted mt-1 text-sm">
              Las guías con viaje finalizado aparecerán aquí para su control
              documentario.
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 lg:hidden">
              {documentos.map((documento) => (
                <article key={getDocumentoKey(documento)} className="mobile-card">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-faint text-xs font-medium">Guía</p>
                      <h2 className="text-main text-lg font-bold">
                        {documento.numeroGuia}
                      </h2>
                    </div>
                    <EstadoBadge estado={documento.estado} />
                  </div>

                  <div className="grid gap-3 text-sm">
                    <div className="info-tile">
                      <p className="text-faint text-xs">Cliente</p>
                      <p className="text-main font-semibold">
                        {documento.cliente || "-"}
                      </p>
                      <p className="text-faint text-xs">
                        {documento.numeroDocumentoCliente || ""}
                      </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="info-tile">
                        <p className="text-faint text-xs">Placa</p>
                        <p className="text-main font-semibold">
                          {documento.placa || "-"}
                        </p>
                      </div>
                      <div className="info-tile">
                        <p className="text-faint text-xs">Fecha traslado</p>
                        <p className="text-main font-semibold">
                          {formatDate(documento.fechaInicioTraslado)}
                        </p>
                      </div>
                    </div>
                    <div className="info-tile">
                      <p className="text-faint text-xs">Entrega / recepción</p>
                      <p className="text-main font-semibold">
                        {formatDateTime(documento.fechaEntregaOperaciones)}
                      </p>
                      <p className="text-faint text-xs">
                        Recepción:{" "}
                        {formatDateTime(documento.fechaRecepcionFacturacion)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 border-t pt-4">{acciones(documento)}</div>
                </article>
              ))}
            </div>

            <div className="data-table-wrap">
              <div className="table-scroll">
                <table className="data-table w-full min-w-[1120px] text-sm">
                  <thead>
                    <tr>
                      <th className="px-4 py-4 text-left">Guía</th>
                      <th className="px-4 py-4 text-left">Cliente</th>
                      <th className="px-4 py-4 text-left">Placa</th>
                      <th className="px-4 py-4 text-left">Traslado</th>
                      <th className="px-4 py-4 text-left">Entrega</th>
                      <th className="px-4 py-4 text-left">Recepción</th>
                      <th className="px-4 py-4 text-center">Estado</th>
                      <th className="px-4 py-4 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documentos.map((documento) => (
                      <tr key={getDocumentoKey(documento)}>
                        <td className="px-4 py-4">
                          <p className="text-main font-bold">
                            {documento.numeroGuia}
                          </p>
                          <p className="text-faint text-xs">
                            Viaje #{documento.programacionViajeId || "-"}
                          </p>
                        </td>
                        <td className="min-w-[240px] px-4 py-4">
                          <p className="text-main max-w-[260px] truncate font-semibold">
                            {documento.cliente || "-"}
                          </p>
                          <p className="text-faint text-xs">
                            {documento.numeroDocumentoCliente || ""}
                          </p>
                        </td>
                        <td className="text-muted whitespace-nowrap px-4 py-4">
                          {documento.placa || "-"}
                        </td>
                        <td className="text-muted whitespace-nowrap px-4 py-4">
                          {formatDate(documento.fechaInicioTraslado)}
                        </td>
                        <td className="text-muted whitespace-nowrap px-4 py-4">
                          {formatDateTime(documento.fechaEntregaOperaciones)}
                        </td>
                        <td className="text-muted whitespace-nowrap px-4 py-4">
                          {formatDateTime(documento.fechaRecepcionFacturacion)}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <EstadoBadge estado={documento.estado} />
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex justify-end">
                            {acciones(documento)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <TablePagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              limit={pagination.limit}
              onPageChange={cargarDocumentos}
            />
          </>
        )}
      </div>

      {modal && (
        <div className="modal-backdrop">
          <div className="modal-panel max-w-lg">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-main text-xl font-bold">{modalTitle}</h2>
                <p className="text-muted text-sm">
                  {modal.documento.numeroGuia} · {modal.documento.cliente || "Cliente"}
                </p>
              </div>
              <button
                type="button"
                onClick={cerrarModal}
                className="text-muted text-2xl hover:text-blue-500"
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>

            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <div className="info-tile">
                <p className="text-faint text-xs">Estado actual</p>
                <p className="text-main font-semibold">
                  {estadoConfig[modal.documento.estado]?.label || modal.documento.estado}
                </p>
              </div>
              <div className="info-tile">
                <p className="text-faint text-xs">Placa</p>
                <p className="text-main font-semibold">
                  {modal.documento.placa || "-"}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <label className="text-muted mb-1 block text-sm">
                {modal.tipo === "entregar"
                  ? "Observación de operaciones"
                  : "Observación de facturación"}
              </label>
              <textarea
                value={observacion}
                onChange={(event) => setObservacion(event.target.value)}
                className="input min-h-[110px] resize-y"
                placeholder={
                  "Opcional"
                }
              />
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={cerrarModal} className="btn-secondary">
                Cancelar
              </button>
              <button type="button" onClick={confirmarModal} className="btn-primary">
                <CheckCircle2 className="h-4 w-4" />
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentosFacturacionPage;
