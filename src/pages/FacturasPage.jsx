import { useEffect, useMemo, useState } from "react";
import {
  ExternalLink,
  FileText,
  LoaderCircle,
  Save,
  Search,
  Send,
} from "lucide-react";
import {
  actualizarPrecioUnitarioFacturacionRequest,
  emitirFacturaNubefactRequest,
  emitirFacturasSeleccionadasNubefactRequest,
  obtenerOrdenesFacturasRequest,
} from "../api/facturas";
import TablePagination from "../components/TablePagination";
import {
  DEFAULT_PAGINATION,
  normalizeCollection,
  normalizePagination,
} from "../utils/apiData";
import { formatDateOnly, getTodayInputDate } from "../utils/date";
import { notify } from "../utils/notify";

const getItemId = (item) => item?.id ?? item?._id;

const formatMoney = (value) =>
  Number(value || 0).toLocaleString("es-PE", {
    style: "currency",
    currency: "PEN",
  });

const getClienteNombre = (orden) =>
  orden?.clienteSolicitante?.razonSocial || "-";

const getClienteDocumento = (orden) =>
  orden?.clienteSolicitante?.numeroDocumento || "";

const getEstadoNubefactStyle = (estado) => {
  switch (estado) {
    case "ACEPTADA":
    case "GENERADA":
      return "border-green-500/30 bg-green-500/10 text-green-400";
    case "ERROR":
      return "border-red-500/30 bg-red-500/10 text-red-400";
    case "PENDIENTE_ENVIO":
      return "border-blue-500/30 bg-blue-500/10 text-blue-300";
    default:
      return "border-slate-500/30 bg-slate-500/10 text-slate-300";
  }
};

const getCantidadViajes = (orden) => Number(orden?.cantidadViajes || 1);

const getPrecioUnitario = (orden) => Number(orden?.precioUnitarioFacturacion || 0);

const calcularTotalOrden = (orden) => {
  const subtotal = getCantidadViajes(orden) * getPrecioUnitario(orden);
  return subtotal + subtotal * 0.18;
};

const puedeEmitir = (orden) =>
  orden.estadoFacturacion !== "FACTURADO" &&
  getPrecioUnitario(orden) > 0 &&
  (!orden.facturaElectronica?.estado || orden.facturaElectronica.estado === "ERROR");

const NubefactStatus = ({ factura }) => {
  if (!factura) {
    return (
      <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-bold ${getEstadoNubefactStyle("")}`}>
        Sin emitir
      </span>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-bold ${getEstadoNubefactStyle(factura.estado)}`}>
        {factura.estado || "PENDIENTE"}
      </span>
      {factura.enlacePdf && (
        <a
          href={factura.enlacePdf}
          target="_blank"
          rel="noreferrer"
          className="text-xs font-semibold text-[var(--app-primary)] hover:underline"
        >
          PDF <ExternalLink className="inline h-3 w-3" />
        </a>
      )}
    </div>
  );
};

const FacturasPage = () => {
  const [ordenes, setOrdenes] = useState([]);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingPrice, setSavingPrice] = useState({});
  const [emitting, setEmitting] = useState({});
  const [precios, setPrecios] = useState({});
  const [selectedOrdenIds, setSelectedOrdenIds] = useState([]);
  const [search, setSearch] = useState("");

  const resumen = useMemo(
    () => ({
      listas: ordenes.filter(puedeEmitir).length,
      emitidas: ordenes.filter((orden) =>
        ["GENERADA", "ACEPTADA"].includes(orden.facturaElectronica?.estado)
      ).length,
      conError: ordenes.filter((orden) => orden.facturaElectronica?.estado === "ERROR").length,
    }),
    [ordenes]
  );

  const cargarOrdenes = async (params = {}) => {
    try {
      setLoading(true);
      const res = await obtenerOrdenesFacturasRequest({
        page: params.page ?? pagination.page ?? 1,
        limit: params.limit ?? pagination.limit ?? 10,
        search: params.search ?? search,
      });
      const ordenesData = normalizeCollection(res.data, ["ordenes"]);
      setOrdenes(ordenesData);
      setPrecios(
        ordenesData.reduce((acc, orden) => {
          acc[getItemId(orden)] = orden.precioUnitarioFacturacion
            ? String(orden.precioUnitarioFacturacion)
            : "";
          return acc;
        }, {})
      );
      setPagination(normalizePagination(res.data, DEFAULT_PAGINATION));
      setSelectedOrdenIds([]);
    } catch (error) {
      notify.error(error.response?.data?.message || "No se pudieron cargar las facturas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarOrdenes({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBuscar = (event) => {
    event.preventDefault();
    cargarOrdenes({ page: 1 });
  };

  const toggleOrden = (orden) => {
    const id = getItemId(orden);
    if (!id || !puedeEmitir(orden)) return;
    setSelectedOrdenIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const guardarPrecio = async (orden) => {
    const id = getItemId(orden);
    if (!id) return;

    const precio = Number(precios[id] || 0);
    if (!Number.isFinite(precio) || precio < 0) {
      notify.error("El precio unitario debe ser mayor o igual a cero");
      return;
    }

    try {
      setSavingPrice((prev) => ({ ...prev, [id]: true }));
      const res = await actualizarPrecioUnitarioFacturacionRequest(id, {
        precioUnitarioFacturacion: precio,
      });
      const ordenActualizada = res.data?.orden;
      if (ordenActualizada) {
        setOrdenes((prev) =>
          prev.map((item) => (getItemId(item) === id ? ordenActualizada : item))
        );
        setPrecios((prev) => ({
          ...prev,
          [id]: ordenActualizada.precioUnitarioFacturacion
            ? String(ordenActualizada.precioUnitarioFacturacion)
            : "",
        }));
        if (!puedeEmitir(ordenActualizada)) {
          setSelectedOrdenIds((prev) => prev.filter((item) => item !== id));
        }
      }
      notify.success("Precio unitario actualizado");
    } catch (error) {
      notify.error(error.response?.data?.message || "No se pudo actualizar el precio unitario");
    } finally {
      setSavingPrice((prev) => ({ ...prev, [id]: false }));
    }
  };

  const emitirUna = async (orden) => {
    const id = getItemId(orden);
    if (!id || !puedeEmitir(orden)) return;

    if (!window.confirm(`Se emitirá ${orden.numeroFactura || "una factura FF01"} en Nubefact/SUNAT. ¿Continuar?`)) {
      return;
    }

    try {
      setEmitting((prev) => ({ ...prev, [id]: true }));
      await emitirFacturaNubefactRequest(id, {
        fechaEmision: orden.fechaFacturacion?.slice?.(0, 10) || getTodayInputDate(),
      });
      notify.success("Factura enviada a Nubefact");
      cargarOrdenes({ page: pagination.page });
    } catch (error) {
      notify.error(
        error.response?.data?.message ||
          error.response?.data?.errors ||
          "No se pudo emitir la factura"
      );
    } finally {
      setEmitting((prev) => ({ ...prev, [id]: false }));
    }
  };

  const emitirSeleccionadas = async () => {
    if (!selectedOrdenIds.length) {
      notify.error("Selecciona órdenes facturadas pendientes de emitir");
      return;
    }

    const seleccionadas = ordenes.filter((orden) =>
      selectedOrdenIds.includes(getItemId(orden))
    );
    const clientes = new Set(seleccionadas.map(getClienteDocumento));
    if (clientes.size > 1) {
      notify.error("Las órdenes seleccionadas deben pertenecer al mismo cliente");
      return;
    }

    if (!window.confirm(`Se emitirá una sola factura Nubefact para ${selectedOrdenIds.length} orden(es). ¿Continuar?`)) {
      return;
    }

    try {
      setSaving(true);
      await emitirFacturasSeleccionadasNubefactRequest({
        ordenIds: selectedOrdenIds,
      });
      notify.success("Factura agrupada enviada a Nubefact");
      cargarOrdenes({ page: pagination.page });
    } catch (error) {
      notify.error(
        error.response?.data?.message ||
          error.response?.data?.errors ||
          "No se pudo emitir la factura agrupada"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <div className="page-wrap">
        <header className="page-hero">
          <div className="page-hero-content">
            <div>
              <div className="eyebrow">Nubefact</div>
              <h1 className="page-title">Facturas</h1>
              <p className="page-description">
                Emisión de facturas electrónicas FF01 para órdenes aún no registradas en el control manual.
              </p>
            </div>
          </div>
        </header>

        <div className="summary-grid mb-4">
          <div className="info-tile">
            <p className="text-faint text-xs">Listas para emitir</p>
            <p className="text-main text-2xl font-bold">{resumen.listas}</p>
          </div>
          <div className="info-tile">
            <p className="text-faint text-xs">Emitidas</p>
            <p className="text-main text-2xl font-bold">{resumen.emitidas}</p>
          </div>
          <div className="info-tile">
            <p className="text-faint text-xs">Con error</p>
            <p className="text-main text-2xl font-bold">{resumen.conError}</p>
          </div>
        </div>

        <form onSubmit={handleBuscar} className="filter-panel mb-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_auto] lg:items-end">
            <label>
              <span className="text-faint mb-2 block text-xs font-semibold uppercase">Buscar</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="input"
                placeholder="Orden, factura, cliente o RUC"
              />
            </label>
            <button type="submit" className="btn-primary px-3 py-2" disabled={loading}>
              {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Buscar
            </button>
          </div>
        </form>

        {selectedOrdenIds.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-md border bg-[var(--app-surface-muted)] px-4 py-3">
            <p className="text-main text-sm font-semibold">
              {selectedOrdenIds.length} orden(es) seleccionada(s) para una factura Nubefact
            </p>
            <button type="button" className="btn-primary px-3 py-2" onClick={emitirSeleccionadas} disabled={saving}>
              {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Emitir seleccionadas
            </button>
          </div>
        )}

        {loading ? (
          <div className="loading-panel">
            <div className="loading-spinner" />
            <p className="text-muted text-sm">Cargando facturas...</p>
          </div>
        ) : ordenes.length === 0 ? (
          <div className="empty-panel">
            <FileText className="text-faint mx-auto mb-3 h-10 w-10" />
            <h2 className="text-main text-lg font-semibold">No hay órdenes pendientes para emitir</h2>
            <p className="text-muted mt-1 text-sm">Las órdenes ya facturadas manualmente no aparecen en este módulo.</p>
          </div>
        ) : (
          <>
            <div className="data-table-wrap">
              <div className="table-scroll">
                <table className="data-table dense-table w-full min-w-[1320px] text-sm">
                  <thead>
                    <tr>
                      <th className="px-4 py-4 text-center">Sel.</th>
                      <th className="px-4 py-4 text-left">Orden</th>
                      <th className="px-4 py-4 text-left">Cliente</th>
                      <th className="px-4 py-4 text-left">Control manual</th>
                      <th className="px-4 py-4 text-left">Nubefact</th>
                      <th className="px-4 py-4 text-center">Viajes</th>
                      <th className="px-4 py-4 text-left">Precio unitario sin IGV</th>
                      <th className="px-4 py-4 text-right">Total con IGV</th>
                      <th className="px-4 py-4 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordenes.map((orden) => (
                      <tr key={getItemId(orden)}>
                        <td className="px-4 py-4 text-center">
                          <input
                            type="checkbox"
                            checked={selectedOrdenIds.includes(getItemId(orden))}
                            onChange={() => toggleOrden(orden)}
                            disabled={!puedeEmitir(orden)}
                          />
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-main font-bold">{orden.numeroOrden}</p>
                          <p className="text-faint text-xs">{formatDateOnly(orden.fechaProgramada)}</p>
                        </td>
                        <td className="min-w-[260px] px-4 py-4">
                          <p className="text-main max-w-[300px] truncate font-semibold">{getClienteNombre(orden)}</p>
                          <p className="text-faint text-xs">{getClienteDocumento(orden)}</p>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-main font-semibold">{orden.numeroFactura || "-"}</p>
                          <p className="text-faint text-xs">{formatDateOnly(orden.fechaFacturacion)}</p>
                        </td>
                        <td className="px-4 py-4">
                          <NubefactStatus factura={orden.facturaElectronica} />
                        </td>
                        <td className="px-4 py-4 text-center font-semibold">
                          {getCantidadViajes(orden)}
                        </td>
                        <td className="min-w-[220px] px-4 py-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={precios[getItemId(orden)] ?? ""}
                              onChange={(event) =>
                                setPrecios((prev) => ({
                                  ...prev,
                                  [getItemId(orden)]: event.target.value,
                                }))
                              }
                              className="input max-w-[130px]"
                              placeholder="0.00"
                            />
                            <button
                              type="button"
                              className="btn-secondary px-3 py-2"
                              onClick={() => guardarPrecio(orden)}
                              disabled={Boolean(savingPrice[getItemId(orden)])}
                              title="Guardar precio unitario"
                            >
                              {savingPrice[getItemId(orden)] ? (
                                <LoaderCircle className="h-4 w-4 animate-spin" />
                              ) : (
                                <Save className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                          {getPrecioUnitario(orden) <= 0 && (
                            <p className="text-faint mt-1 text-xs">Requerido para emitir</p>
                          )}
                        </td>
                        <td className="px-4 py-4 text-right font-semibold">
                          {formatMoney(calcularTotalOrden(orden))}
                        </td>
                        <td className="px-4 py-4 text-center">
                          {puedeEmitir(orden) ? (
                            <button
                              type="button"
                              className="btn-primary px-3 py-2"
                              onClick={() => emitirUna(orden)}
                              disabled={Boolean(emitting[getItemId(orden)])}
                            >
                              {emitting[getItemId(orden)] ? (
                                <LoaderCircle className="h-4 w-4 animate-spin" />
                              ) : (
                                <Send className="h-4 w-4" />
                              )}
                              Emitir
                            </button>
                          ) : (
                            <span className="text-muted text-xs">Sin acción</span>
                          )}
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
              onPageChange={(page) => cargarOrdenes({ page })}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default FacturasPage;
