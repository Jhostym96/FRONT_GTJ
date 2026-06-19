import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  CreditCard,
  FileText,
  LoaderCircle,
  Pencil,
  Search,
  X,
} from "lucide-react";
import {
  marcarPagoOrdenRequest,
  obtenerOrdenesFacturacionRequest,
  registrarFacturacionOrdenRequest,
} from "../api/facturacion";
import TablePagination from "../components/TablePagination";
import {
  DEFAULT_PAGINATION,
  normalizeCollection,
  normalizePagination,
} from "../utils/apiData";
import { formatDateOnly, getTodayInputDate } from "../utils/date";
import { notify } from "../utils/notify";

const getItemId = (item) => item?.id ?? item?._id;

const emptyFacturaForm = {
  fechaFacturacion: getTodayInputDate(),
  numeroFactura: "",
  montoTotalFactura: "",
  diasCredito: "0",
  observacionFacturacion: "",
};

const emptyPagoForm = {
  fechaPago: getTodayInputDate(),
  montoPago: "",
  medioPago: "",
  referenciaPago: "",
  observacionPago: "",
};

const formatMoney = (value) =>
  Number(value || 0).toLocaleString("es-PE", {
    style: "currency",
    currency: "PEN",
  });

const getClienteNombre = (orden) =>
  orden?.clienteSolicitante?.razonSocial || orden?.cliente || "-";

const getClienteDocumento = (orden) =>
  orden?.clienteSolicitante?.numeroDocumento || "";

const getEstadoFacturacionStyle = (estado) =>
  estado === "FACTURADO"
    ? "border-green-500/30 bg-green-500/10 text-green-400"
    : "border-amber-500/30 bg-amber-500/10 text-amber-400";

const getEstadoPagoStyle = (estado) => {
  switch (estado) {
    case "PAGADO":
      return "border-green-500/30 bg-green-500/10 text-green-400";
    case "PARCIAL":
      return "border-blue-500/30 bg-blue-500/10 text-blue-300";
    case "VENCIDO":
      return "border-red-500/30 bg-red-500/10 text-red-400";
    default:
      return "border-amber-500/30 bg-amber-500/10 text-amber-400";
  }
};

const getProgramacionesOrden = (orden) =>
  Array.isArray(orden?.programacionesViaje) ? orden.programacionesViaje : [];

const FacturacionPage = () => {
  const [ordenes, setOrdenes] = useState([]);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [estadoFacturacion, setEstadoFacturacion] = useState("PENDIENTE");
  const [estadoPago, setEstadoPago] = useState("");
  const [facturaModalOpen, setFacturaModalOpen] = useState(false);
  const [pagoModalOpen, setPagoModalOpen] = useState(false);
  const [detalleOrden, setDetalleOrden] = useState(null);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);
  const [facturaForm, setFacturaForm] = useState(emptyFacturaForm);
  const [pagoForm, setPagoForm] = useState(emptyPagoForm);

  const resumen = useMemo(
    () => ({
      pendientes: ordenes.filter((item) => item.estadoFacturacion !== "FACTURADO").length,
      facturadas: ordenes.filter((item) => item.estadoFacturacion === "FACTURADO").length,
      vencidas: ordenes.filter((item) => item.estadoPago === "VENCIDO").length,
    }),
    [ordenes]
  );

  const cargarOrdenes = async (params = {}) => {
    try {
      setLoading(true);
      const res = await obtenerOrdenesFacturacionRequest({
        page: params.page ?? pagination.page ?? 1,
        limit: params.limit ?? pagination.limit ?? 10,
        search: params.search ?? search,
        estadoFacturacion: params.estadoFacturacion ?? estadoFacturacion,
        estadoPago: params.estadoPago ?? estadoPago,
      });
      setOrdenes(normalizeCollection(res.data, ["ordenes"]));
      setPagination(normalizePagination(res.data, DEFAULT_PAGINATION));
    } catch (error) {
      console.error("Error al cargar facturación:", error);
      notify.error(error.response?.data?.message || "No se pudo cargar facturación");
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

  const abrirFactura = (orden) => {
    const diasCreditoBase =
      orden.estadoFacturacion === "FACTURADO"
        ? orden.diasCredito
        : orden.diasCreditoCliente ?? orden.diasCredito;

    setOrdenSeleccionada(orden);
    setFacturaForm({
      fechaFacturacion:
        orden.fechaFacturacion?.slice?.(0, 10) || getTodayInputDate(),
      numeroFactura: orden.numeroFactura || "",
      montoTotalFactura:
        orden.montoTotalFactura > 0 ? String(orden.montoTotalFactura) : "",
      diasCredito: String(diasCreditoBase ?? 0),
      observacionFacturacion: orden.observacionFacturacion || "",
    });
    setFacturaModalOpen(true);
  };

  const abrirPago = (orden) => {
    setOrdenSeleccionada(orden);
    setPagoForm({
      ...emptyPagoForm,
      montoPago: orden.saldoPendiente > 0 ? String(orden.saldoPendiente) : "",
      medioPago: orden.medioPago || "",
      referenciaPago: orden.referenciaPago || "",
      observacionPago: orden.observacionPago || "",
    });
    setPagoModalOpen(true);
  };

  const cerrarModales = () => {
    setFacturaModalOpen(false);
    setPagoModalOpen(false);
    setOrdenSeleccionada(null);
    setFacturaForm(emptyFacturaForm);
    setPagoForm(emptyPagoForm);
  };

  const abrirDetalleOrden = (orden) => {
    setDetalleOrden(orden);
  };

  const cerrarDetalleOrden = () => {
    setDetalleOrden(null);
  };

  const handleFacturaChange = (event) => {
    const { name, value } = event.target;
    setFacturaForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePagoChange = (event) => {
    const { name, value } = event.target;
    setPagoForm((prev) => ({ ...prev, [name]: value }));
  };

  const guardarFactura = async (event) => {
    event.preventDefault();
    if (!ordenSeleccionada) return;

    if (!facturaForm.fechaFacturacion || !facturaForm.numeroFactura.trim()) {
      notify.error("Completa la fecha y número de factura");
      return;
    }

    if (Number(facturaForm.montoTotalFactura) <= 0) {
      notify.error("El monto total debe ser mayor a cero");
      return;
    }

    try {
      setSaving(true);
      await registrarFacturacionOrdenRequest(getItemId(ordenSeleccionada), {
        fechaFacturacion: facturaForm.fechaFacturacion,
        numeroFactura: facturaForm.numeroFactura.trim(),
        montoTotalFactura: Number(facturaForm.montoTotalFactura),
        diasCredito: Number(facturaForm.diasCredito || 0),
        observacionFacturacion: facturaForm.observacionFacturacion.trim(),
      });
      notify.success("Factura registrada");
      cerrarModales();
      cargarOrdenes({ page: pagination.page });
    } catch (error) {
      console.error("Error al registrar factura:", error);
      notify.error(error.response?.data?.message || "No se pudo registrar la factura");
    } finally {
      setSaving(false);
    }
  };

  const guardarPago = async (event) => {
    event.preventDefault();
    if (!ordenSeleccionada) return;

    if (!pagoForm.fechaPago || Number(pagoForm.montoPago) <= 0) {
      notify.error("Completa la fecha y monto de pago");
      return;
    }

    if (Number(pagoForm.montoPago) > Number(ordenSeleccionada.saldoPendiente || 0)) {
      notify.error("El pago no puede exceder el saldo pendiente");
      return;
    }

    try {
      setSaving(true);
      await marcarPagoOrdenRequest(getItemId(ordenSeleccionada), {
        fechaPago: pagoForm.fechaPago,
        montoPago: Number(pagoForm.montoPago),
        medioPago: pagoForm.medioPago.trim(),
        referenciaPago: pagoForm.referenciaPago.trim(),
        observacionPago: pagoForm.observacionPago.trim(),
      });
      notify.success("Pago registrado");
      cerrarModales();
      cargarOrdenes({ page: pagination.page });
    } catch (error) {
      console.error("Error al registrar pago:", error);
      notify.error(error.response?.data?.message || "No se pudo registrar el pago");
    } finally {
      setSaving(false);
    }
  };

  const EstadoBadge = ({ estado, type = "facturacion" }) => (
    <span
      className={`inline-flex items-center justify-center rounded-full border px-3 py-1 text-[11px] font-bold tracking-wide ${
        type === "pago" ? getEstadoPagoStyle(estado) : getEstadoFacturacionStyle(estado)
      }`}
    >
      {estado || "PENDIENTE"}
    </span>
  );

  const Acciones = ({ orden, mobile = false }) => (
    <div className={mobile ? "mobile-actions" : "table-actions"}>
      <button
        type="button"
        onClick={() => abrirFactura(orden)}
        className={mobile ? "btn-secondary" : "btn-secondary btn-icon"}
        title="Registrar factura"
        aria-label="Registrar factura"
      >
        <Pencil className="h-4 w-4" />
        {mobile && "Facturar"}
      </button>

      {orden.estadoFacturacion === "FACTURADO" && orden.estadoPago !== "PAGADO" && (
        <button
          type="button"
          onClick={() => abrirPago(orden)}
          className={mobile ? "btn-primary" : "btn-primary btn-icon"}
          title="Registrar pago"
          aria-label="Registrar pago"
        >
          <CheckCircle2 className="h-4 w-4" />
          {mobile && "Pago"}
        </button>
      )}
    </div>
  );

  const saldoPagoResultante = Math.max(
    Number(ordenSeleccionada?.saldoPendiente || 0) - Number(pagoForm.montoPago || 0),
    0
  );
  const programacionesDetalle = getProgramacionesOrden(detalleOrden);

  return (
    <div className="page">
      <div className="page-wrap">
        <header className="page-hero">
          <div className="page-hero-content">
            <div>
              <div className="eyebrow">Control administrativo</div>
              <h1 className="page-title">Facturación</h1>
              <p className="page-description">
                Registra facturas por orden de servicio y controla pendientes de pago.
              </p>
            </div>
          </div>
        </header>

        <div className="summary-grid mb-4">
          <div className="info-tile">
            <p className="text-faint text-xs">Pendientes</p>
            <p className="text-main text-2xl font-bold">{resumen.pendientes}</p>
          </div>
          <div className="info-tile">
            <p className="text-faint text-xs">Facturadas</p>
            <p className="text-main text-2xl font-bold">{resumen.facturadas}</p>
          </div>
          <div className="info-tile">
            <p className="text-faint text-xs">Vencidas</p>
            <p className="text-main text-2xl font-bold">{resumen.vencidas}</p>
          </div>
        </div>

        <form onSubmit={handleBuscar} className="filter-panel mb-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_180px_180px_auto] lg:items-end">
            <label>
              <span className="text-faint mb-2 block text-xs font-semibold uppercase">Buscar</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="input"
                placeholder="Orden, factura, cliente o RUC"
              />
            </label>

            <label>
              <span className="text-faint mb-2 block text-xs font-semibold uppercase">Facturación</span>
              <select
                value={estadoFacturacion}
                onChange={(event) => setEstadoFacturacion(event.target.value)}
                className="input"
              >
                <option value="">Todos</option>
                <option value="PENDIENTE">Pendiente</option>
                <option value="FACTURADO">Facturado</option>
              </select>
            </label>

            <label>
              <span className="text-faint mb-2 block text-xs font-semibold uppercase">Pago</span>
              <select
                value={estadoPago}
                onChange={(event) => setEstadoPago(event.target.value)}
                className="input"
              >
                <option value="">Todos</option>
                <option value="PENDIENTE">Pendiente</option>
                <option value="PARCIAL">Parcial</option>
                <option value="PAGADO">Pagado</option>
              </select>
            </label>

            <button type="submit" className="btn-primary px-3 py-2" disabled={loading}>
              {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Buscar
            </button>
          </div>
        </form>

        {loading ? (
          <div className="loading-panel">
            <div className="loading-spinner" />
            <p className="text-muted text-sm">Cargando órdenes...</p>
          </div>
        ) : ordenes.length === 0 ? (
          <div className="empty-panel">
            <FileText className="text-faint mx-auto mb-3 h-10 w-10" />
            <h2 className="text-main text-lg font-semibold">No hay órdenes para mostrar</h2>
            <p className="text-muted mt-1 text-sm">
              Ajusta los filtros para encontrar órdenes de servicio.
            </p>
          </div>
        ) : (
          <>
            <div className="mobile-list">
              {ordenes.map((orden) => (
                <article key={getItemId(orden)} className="mobile-card">
                  <div className="mobile-card-header">
                    <div>
                      <p className="text-faint text-xs">Orden</p>
                      <button
                        type="button"
                        onClick={() => abrirDetalleOrden(orden)}
                        className="mobile-card-title text-left underline-offset-4 hover:underline"
                        title="Ver programaciones y contenedores"
                      >
                        {orden.numeroOrden}
                      </button>
                      <p className="mobile-card-subtitle">{formatDateOnly(orden.fechaProgramada)}</p>
                    </div>
                    <EstadoBadge estado={orden.estadoFacturacion} />
                  </div>

                  <div className="mobile-detail-grid">
                    <div className="info-tile">
                      <p className="text-faint text-xs">Cliente</p>
                      <p className="text-main font-semibold">{getClienteNombre(orden)}</p>
                      <p className="text-faint text-xs">{getClienteDocumento(orden)}</p>
                    </div>
                    <div className="info-tile">
                      <p className="text-faint text-xs">Factura</p>
                      <p className="text-main font-semibold">{orden.numeroFactura || "-"}</p>
                      <p className="text-faint text-xs">{formatMoney(orden.montoTotalFactura)}</p>
                    </div>
                    <div className="info-tile">
                      <p className="text-faint text-xs">Pago</p>
                      <p className="text-main font-semibold">
                        Saldo: {formatMoney(orden.saldoPendiente)}
                      </p>
                      <EstadoBadge estado={orden.estadoPago} type="pago" />
                    </div>
                  </div>

                  <div className="mobile-card-actions">
                    <Acciones orden={orden} mobile />
                  </div>
                </article>
              ))}
            </div>

            <div className="data-table-wrap">
              <div className="table-scroll">
                <table className="data-table dense-table w-full min-w-[1450px] text-sm">
                  <thead>
                    <tr>
                      <th className="px-4 py-4 text-left">Orden</th>
                      <th className="px-4 py-4 text-left">Cliente</th>
                      <th className="px-4 py-4 text-left">Factura</th>
                      <th className="px-4 py-4 text-right">Monto</th>
                      <th className="px-4 py-4 text-left">Crédito</th>
                      <th className="px-4 py-4 text-right">Pagado</th>
                      <th className="px-4 py-4 text-right">Saldo</th>
                      <th className="px-4 py-4 text-center">Facturación</th>
                      <th className="px-4 py-4 text-center">Pago</th>
                      <th className="px-4 py-4 text-center">Acciones</th>
                    </tr>
                  </thead>

                  <tbody>
                    {ordenes.map((orden) => (
                      <tr key={getItemId(orden)}>
                        <td className="px-4 py-4">
                          <button
                            type="button"
                            onClick={() => abrirDetalleOrden(orden)}
                            className="text-main font-bold underline-offset-4 hover:underline"
                            title="Ver programaciones y contenedores"
                          >
                            {orden.numeroOrden}
                          </button>
                          <p className="text-faint text-xs">
                            Servicio: {formatDateOnly(orden.fechaProgramada)}
                          </p>
                        </td>
                        <td className="min-w-[240px] px-4 py-4">
                          <p className="text-main max-w-[280px] truncate font-semibold">
                            {getClienteNombre(orden)}
                          </p>
                          <p className="text-faint text-xs">{getClienteDocumento(orden)}</p>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-main font-semibold">{orden.numeroFactura || "-"}</p>
                          <p className="text-faint text-xs">{formatDateOnly(orden.fechaFacturacion)}</p>
                        </td>
                        <td className="px-4 py-4 text-right font-semibold">
                          {formatMoney(orden.montoTotalFactura)}
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-main font-semibold">{orden.diasCredito || 0} días</p>
                          {orden.estadoFacturacion !== "FACTURADO" && (
                            <p className="text-faint text-xs">
                              Cliente: {orden.diasCreditoCliente || 0} días
                            </p>
                          )}
                          <p className="text-faint text-xs">
                            Vence: {formatDateOnly(orden.fechaVencimientoPago)}
                          </p>
                        </td>
                        <td className="px-4 py-4 text-right font-semibold">
                          {formatMoney(orden.montoPagado)}
                        </td>
                        <td className="px-4 py-4 text-right font-semibold">
                          {formatMoney(orden.saldoPendiente)}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <EstadoBadge estado={orden.estadoFacturacion} />
                        </td>
                        <td className="px-4 py-4 text-center">
                          <EstadoBadge estado={orden.estadoPago} type="pago" />
                          {orden.fechaUltimoPago && (
                            <p className="text-faint mt-1 text-xs">
                              {formatDateOnly(orden.fechaUltimoPago)}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <Acciones orden={orden} />
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

        {detalleOrden && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="panel w-full max-w-xl overflow-hidden">
              <div className="flex items-start justify-between gap-4 border-b px-5 py-4">
                <div>
                  <div className="eyebrow">Orden {detalleOrden.numeroOrden}</div>
                  <h2 className="text-main text-lg font-bold">
                    Programaciones asociadas
                  </h2>
                </div>
                <button
                  type="button"
                  className="btn-secondary btn-icon"
                  onClick={cerrarDetalleOrden}
                  aria-label="Cerrar detalle"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="px-5 py-4">
                {programacionesDetalle.length === 0 ? (
                  <div className="empty-panel py-8">
                    <FileText className="text-faint mx-auto mb-3 h-8 w-8" />
                    <p className="text-main font-semibold">
                      Esta orden no tiene programaciones asociadas
                    </p>
                  </div>
                ) : (
                  <div className="table-scroll">
                    <table className="data-table dense-table w-full min-w-[480px] text-sm">
                      <thead>
                        <tr>
                          <th className="px-4 py-3 text-left">Programación</th>
                          <th className="px-4 py-3 text-left">Contenedor</th>
                          <th className="px-4 py-3 text-left">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {programacionesDetalle.map((programacion) => (
                          <tr key={programacion.id}>
                            <td className="px-4 py-3">
                              <p className="text-main font-semibold">
                                {programacion.numeroProgramacion || "-"}
                              </p>
                              <p className="text-faint text-xs">
                                {formatDateOnly(programacion.fechaInicioTraslado)}
                              </p>
                            </td>
                            <td className="px-4 py-3 font-semibold">
                              {programacion.numeroContenedor || "-"}
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex rounded-full border border-white/10 px-3 py-1 text-[11px] font-bold">
                                {programacion.estado || "-"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="flex justify-end border-t px-5 py-4">
                <button
                  type="button"
                  className="btn-secondary px-3 py-2"
                  onClick={cerrarDetalleOrden}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {facturaModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <form onSubmit={guardarFactura} className="panel w-full max-w-2xl overflow-hidden">
              <div className="flex items-start justify-between gap-4 border-b px-5 py-4 sm:px-6">
                <div>
                  <div className="eyebrow">Orden {ordenSeleccionada?.numeroOrden}</div>
                  <h2 className="text-main text-lg font-bold">Registrar factura</h2>
                </div>
                <button type="button" className="btn-secondary btn-icon" onClick={cerrarModales}>
                  X
                </button>
              </div>

              <div className="grid gap-4 px-5 py-5 sm:grid-cols-2 sm:px-6">
                <label>
                  <span className="text-faint mb-2 block text-xs font-semibold uppercase">Fecha de facturación</span>
                  <input
                    type="date"
                    name="fechaFacturacion"
                    value={facturaForm.fechaFacturacion}
                    onChange={handleFacturaChange}
                    className="input"
                    required
                  />
                </label>
                <label>
                  <span className="text-faint mb-2 block text-xs font-semibold uppercase">Número de factura</span>
                  <input
                    name="numeroFactura"
                    value={facturaForm.numeroFactura}
                    onChange={handleFacturaChange}
                    className="input"
                    placeholder="F001-00000001"
                    required
                  />
                </label>
                <label>
                  <span className="text-faint mb-2 block text-xs font-semibold uppercase">Monto total</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    name="montoTotalFactura"
                    value={facturaForm.montoTotalFactura}
                    onChange={handleFacturaChange}
                    className="input"
                    required
                  />
                </label>
                <label>
                  <span className="text-faint mb-2 block text-xs font-semibold uppercase">Días de crédito</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    name="diasCredito"
                    value={facturaForm.diasCredito}
                    onChange={handleFacturaChange}
                    className="input"
                  />
                </label>
                <label className="sm:col-span-2">
                  <span className="text-faint mb-2 block text-xs font-semibold uppercase">Observación</span>
                  <textarea
                    name="observacionFacturacion"
                    value={facturaForm.observacionFacturacion}
                    onChange={handleFacturaChange}
                    className="input min-h-[90px] resize-y"
                    placeholder="Detalle interno de facturación"
                  />
                </label>
              </div>

              <div className="flex justify-end gap-2 border-t px-5 py-4 sm:px-6">
                <button type="button" className="btn-secondary px-3 py-2" onClick={cerrarModales}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary px-3 py-2" disabled={saving}>
                  {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                  Guardar factura
                </button>
              </div>
            </form>
          </div>
        )}

        {pagoModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <form onSubmit={guardarPago} className="panel w-full max-w-2xl overflow-hidden">
              <div className="flex items-start justify-between gap-4 border-b px-5 py-4 sm:px-6">
                <div>
                  <div className="eyebrow">Factura {ordenSeleccionada?.numeroFactura}</div>
                  <h2 className="text-main text-lg font-bold">Registrar pago</h2>
                </div>
                <button type="button" className="btn-secondary btn-icon" onClick={cerrarModales}>
                  X
                </button>
              </div>

              <div className="grid gap-4 px-5 py-5 sm:grid-cols-2 sm:px-6">
                <div className="info-tile">
                  <p className="text-faint text-xs">Saldo actual</p>
                  <p className="text-main text-xl font-bold">
                    {formatMoney(ordenSeleccionada?.saldoPendiente)}
                  </p>
                </div>
                <div className="info-tile">
                  <p className="text-faint text-xs">Saldo resultante</p>
                  <p className="text-main text-xl font-bold">
                    {formatMoney(saldoPagoResultante)}
                  </p>
                </div>
                <label>
                  <span className="text-faint mb-2 block text-xs font-semibold uppercase">Fecha de pago</span>
                  <input
                    type="date"
                    name="fechaPago"
                    value={pagoForm.fechaPago}
                    onChange={handlePagoChange}
                    className="input"
                    required
                  />
                </label>
                <label>
                  <span className="text-faint mb-2 block text-xs font-semibold uppercase">Monto de pago</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    name="montoPago"
                    value={pagoForm.montoPago}
                    onChange={handlePagoChange}
                    className="input"
                    required
                  />
                </label>
                <label>
                  <span className="text-faint mb-2 block text-xs font-semibold uppercase">Medio de pago</span>
                  <input
                    name="medioPago"
                    value={pagoForm.medioPago}
                    onChange={handlePagoChange}
                    className="input"
                    placeholder="Transferencia, efectivo, cheque"
                  />
                </label>
                <label>
                  <span className="text-faint mb-2 block text-xs font-semibold uppercase">Referencia</span>
                  <input
                    name="referenciaPago"
                    value={pagoForm.referenciaPago}
                    onChange={handlePagoChange}
                    className="input"
                    placeholder="Operación, voucher o nota"
                  />
                </label>
                <label className="sm:col-span-2">
                  <span className="text-faint mb-2 block text-xs font-semibold uppercase">Observación</span>
                  <textarea
                    name="observacionPago"
                    value={pagoForm.observacionPago}
                    onChange={handlePagoChange}
                    className="input min-h-[90px] resize-y"
                    placeholder="Detalle interno de cobranza"
                  />
                </label>
              </div>

              <div className="flex justify-end gap-2 border-t px-5 py-4 sm:px-6">
                <button type="button" className="btn-secondary px-3 py-2" onClick={cerrarModales}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary px-3 py-2" disabled={saving}>
                  {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Guardar pago
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default FacturacionPage;
