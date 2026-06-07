import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileWarning,
  ReceiptText,
  Route,
  Truck,
  Users,
} from "lucide-react";
import { obtenerResumenDashboardRequest } from "../api/dashboard";

const toArray = (value) => (Array.isArray(value) ? value : []);

const formatDate = (dateValue) => {
  if (!dateValue) return "-";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatMoney = (value) =>
  Number(value || 0).toLocaleString("es-PE", {
    style: "currency",
    currency: "PEN",
  });

const MetricCard = ({ icon: Icon, label, value, detail, to, tone = "primary" }) => {
  const toneClass = {
    primary: "text-[var(--app-primary)]",
    amber: "text-amber-400",
    green: "text-green-400",
    red: "text-red-400",
    blue: "text-blue-300",
  }[tone];

  const content = (
    <div className="panel flex min-h-[118px] items-center gap-4 p-4 transition hover:border-[var(--app-primary)]">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border bg-[var(--app-surface-muted)]">
        <Icon className={`h-5 w-5 ${toneClass}`} />
      </div>
      <div className="min-w-0">
        <p className="text-faint text-xs font-semibold uppercase">{label}</p>
        <p className="text-main text-2xl font-extrabold">{value}</p>
        {detail && <p className="text-muted mt-1 text-xs">{detail}</p>}
      </div>
    </div>
  );

  return to ? <Link to={to}>{content}</Link> : content;
};

const StatusPill = ({ label, value, tone = "primary" }) => {
  const toneClass = {
    primary: "border-blue-500/20 bg-blue-500/10 text-blue-300",
    amber: "border-amber-500/20 bg-amber-500/10 text-amber-300",
    green: "border-green-500/20 bg-green-500/10 text-green-300",
    red: "border-red-500/20 bg-red-500/10 text-red-300",
    purple: "border-purple-500/20 bg-purple-500/10 text-purple-300",
  }[tone];

  return (
    <div className={`rounded-md border px-3 py-2 ${toneClass}`}>
      <p className="text-[11px] font-bold uppercase">{label}</p>
      <p className="mt-1 text-lg font-extrabold">{value}</p>
    </div>
  );
};

const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);

  useEffect(() => {
    const cargarResumen = async () => {
      try {
        setLoading(true);
        const res = await obtenerResumenDashboardRequest();
        setDashboard(res.data || null);
      } catch (error) {
        console.error("Error al cargar dashboard:", error);
        setDashboard(null);
      } finally {
        setLoading(false);
      }
    };

    cargarResumen();
  }, []);

  const ordenesPorEstado = dashboard?.ordenes?.porEstado || {};
  const viajesPorEstado = dashboard?.programaciones?.porEstado || {};
  const guiasPorEstado = dashboard?.guias?.porEstado || {};
  const facturacionResumen = dashboard?.facturacion || {
    pendientesFacturar: 0,
    facturadas: 0,
    saldoPendiente: 0,
    vencidas: [],
    parciales: [],
  };
  const devolucionesResumen = dashboard?.devoluciones || {
    pendientes: 0,
    criticas: [],
  };
  const recursosResumen = dashboard?.recursos || {
    unidadesActivas: 0,
    conductoresActivos: 0,
  };

  const viajesActivos =
    (viajesPorEstado.ASIGNADO || 0) +
    (viajesPorEstado.EN_RUTA || 0) +
    (viajesPorEstado.EN_ALMACEN || 0) +
    (viajesPorEstado.EN_CLIENTE || 0);

  const devolucionesCriticas = toArray(devolucionesResumen.criticas);
  const guiasConError = toArray(dashboard?.guias?.conError);
  const unidadesActivas = recursosResumen.unidadesActivas || 0;
  const conductoresActivos = recursosResumen.conductoresActivos || 0;

  const saludOperacion = [
    {
      label: "Órdenes",
      value: dashboard?.ordenes?.total || 0,
      detail: `${ordenesPorEstado.PENDIENTE || 0} pendientes`,
      to: "/ordenes-servicio",
    },
    {
      label: "Viajes",
      value: dashboard?.programaciones?.total || 0,
      detail: `${viajesActivos} activos`,
      to: "/programacion-viaje",
    },
    {
      label: "Guías",
      value: dashboard?.guias?.total || 0,
      detail: `${guiasPorEstado.ERROR || 0} con error`,
      to: "/guia-transportista",
    },
  ];

  return (
    <div className="page">
      <div className="page-wrap">
        <header className="page-hero">
          <div className="page-hero-content">
            <div>
              <div className="eyebrow">Panel ejecutivo</div>
              <h1 className="page-title">Dashboard</h1>
              <p className="page-description">
                Indicadores calculados desde el backend con datos completos de la operación.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 border-t pt-4 lg:min-w-[340px] lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
              {saludOperacion.map((item) => (
                <Link key={item.label} to={item.to} className="rounded-md px-2 py-2 text-center transition hover:bg-[var(--app-surface-muted)]">
                  <p className="text-faint text-[11px] font-bold uppercase">{item.label}</p>
                  <p className="text-main text-xl font-extrabold">{item.value}</p>
                  <p className="text-muted truncate text-xs">{item.detail}</p>
                </Link>
              ))}
            </div>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={ClipboardList}
            label="Órdenes pendientes"
            value={ordenesPorEstado.PENDIENTE || 0}
            detail={`${ordenesPorEstado.PROGRAMADA || 0} programadas`}
            to="/ordenes-servicio"
          />
          <MetricCard
            icon={Route}
            label="Viajes activos"
            value={viajesActivos}
            detail={`${viajesPorEstado.ENTREGADO || 0} entregados`}
            to="/programacion-viaje"
            tone="blue"
          />
          <MetricCard
            icon={ReceiptText}
            label="Por facturar"
            value={loading ? "-" : facturacionResumen.pendientesFacturar || 0}
            detail="Órdenes sin factura registrada"
            to="/facturacion"
            tone="amber"
          />
          <MetricCard
            icon={Banknote}
            label="Saldo por cobrar"
            value={loading ? "-" : formatMoney(facturacionResumen.saldoPendiente)}
            detail={`${facturacionResumen.vencidas.length} vencidas detectadas`}
            to="/facturacion"
            tone={facturacionResumen.vencidas.length > 0 ? "red" : "green"}
          />
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="panel p-4">
            <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-main text-base font-extrabold">Estado operativo</h2>
                <p className="text-muted text-sm">
                  Distribución rápida de órdenes, viajes y guías.
                </p>
              </div>
              <Link to="/programacion-viaje" className="btn-secondary px-3 py-1.5">
                Ver viajes
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="grid gap-2">
                <p className="text-faint text-xs font-bold uppercase">Órdenes</p>
                <StatusPill label="Pendiente" value={ordenesPorEstado.PENDIENTE || 0} tone="amber" />
                <StatusPill label="Programada" value={ordenesPorEstado.PROGRAMADA || 0} tone="primary" />
                <StatusPill label="Finalizada" value={ordenesPorEstado.FINALIZADA || 0} tone="green" />
              </div>

              <div className="grid gap-2">
                <p className="text-faint text-xs font-bold uppercase">Viajes</p>
                <StatusPill label="Asignado" value={viajesPorEstado.ASIGNADO || 0} tone="primary" />
                <StatusPill label="En ruta" value={viajesPorEstado.EN_RUTA || 0} tone="purple" />
                <StatusPill label="En cliente" value={viajesPorEstado.EN_CLIENTE || 0} tone="amber" />
              </div>

              <div className="grid gap-2">
                <p className="text-faint text-xs font-bold uppercase">Guías</p>
                <StatusPill label="Aceptadas" value={guiasPorEstado.ACEPTADA || 0} tone="green" />
                <StatusPill label="Pendientes" value={guiasPorEstado.PENDIENTE || 0} tone="amber" />
                <StatusPill label="Error" value={guiasPorEstado.ERROR || 0} tone="red" />
              </div>
            </div>
          </div>

          <div className="panel p-4">
            <div className="mb-4 flex items-center gap-2">
              <Truck className="h-4 w-4 text-[var(--app-primary)]" />
              <h2 className="text-main text-base font-extrabold">Recursos</h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <Link to="/unidades" className="info-tile flex items-center justify-between">
                <div>
                  <p className="text-faint text-xs">Unidades activas</p>
                  <p className="text-main text-2xl font-bold">{unidadesActivas}</p>
                </div>
                <Truck className="h-5 w-5 text-[var(--app-primary)]" />
              </Link>
              <Link to="/conductores" className="info-tile flex items-center justify-between">
                <div>
                  <p className="text-faint text-xs">Conductores activos</p>
                  <p className="text-main text-2xl font-bold">{conductoresActivos}</p>
                </div>
                <Users className="h-5 w-5 text-[var(--app-primary)]" />
              </Link>
              <Link to="/devoluciones" className="info-tile flex items-center justify-between">
                <div>
                  <p className="text-faint text-xs">Devoluciones pendientes</p>
                  <p className="text-main text-2xl font-bold">
                    {devolucionesResumen.pendientes || 0}
                  </p>
                </div>
                <Clock3 className="h-5 w-5 text-amber-400" />
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <div className="panel p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <h2 className="text-main text-sm font-bold">Alertas de devolución</h2>
              </div>
              <Link to="/devoluciones" className="text-faint text-xs font-bold hover:text-[var(--app-primary)]">
                Ver módulo
              </Link>
            </div>
            {devolucionesCriticas.length === 0 ? (
              <div className="info-tile flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-400" />
                <p className="text-muted text-sm">No hay devoluciones críticas.</p>
              </div>
            ) : (
              <div className="grid gap-2">
                {devolucionesCriticas.map((orden) => (
                  <Link
                    key={`${orden.id || orden._id}-${orden.programacionViajeId || ""}`}
                    to="/devoluciones"
                    className="info-tile flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-main truncate text-sm font-semibold">
                        {orden.numeroOrden || "Orden sin número"}
                      </p>
                      <p className="text-muted text-xs">
                        Contenedor: {orden.numeroContenedor || "-"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-main text-sm font-bold">
                        {orden.diasRestantes < 0
                          ? `${Math.abs(orden.diasRestantes)} días vencida`
                          : `${orden.diasRestantes} días`}
                      </p>
                      <p className="text-faint text-xs">
                        {formatDate(orden.fechaVencimientoDevolucion)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="panel p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileWarning className="h-4 w-4 text-red-400" />
                <h2 className="text-main text-sm font-bold">Guías con observación</h2>
              </div>
              <Link to="/guia-transportista" className="text-faint text-xs font-bold hover:text-[var(--app-primary)]">
                Ver guías
              </Link>
            </div>
            {guiasConError.length === 0 ? (
              <div className="info-tile flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-400" />
                <p className="text-muted text-sm">No hay guías con error.</p>
              </div>
            ) : (
              <div className="grid gap-2">
                {guiasConError.map((guia) => (
                  <Link key={guia.id || guia._id} to="/guia-transportista" className="info-tile">
                    <p className="text-main text-sm font-semibold">
                      {guia.serie}-{guia.numero}
                    </p>
                    <p className="text-muted mt-1 line-clamp-2 text-xs">
                      {guia.sunat_description ||
                        guia.sunat_note ||
                        "Revisar respuesta Nubefact/SUNAT"}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {dashboard?.facturacion && (
          <section className="panel p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Banknote className="h-4 w-4 text-green-400" />
                <h2 className="text-main text-sm font-bold">Cobranza</h2>
              </div>
              <Link to="/facturacion" className="text-faint text-xs font-bold hover:text-[var(--app-primary)]">
                Ver facturación
              </Link>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              <div>
                <p className="text-faint mb-2 text-xs font-bold uppercase">Facturas vencidas</p>
                {facturacionResumen.vencidas.length === 0 ? (
                  <p className="text-muted text-sm">No hay facturas vencidas en la muestra reciente.</p>
                ) : (
                  <div className="grid gap-2">
                    {facturacionResumen.vencidas.map((orden) => (
                      <Link key={orden.id} to="/facturacion" className="info-tile flex justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-main truncate text-sm font-semibold">{orden.numeroFactura}</p>
                          <p className="text-muted truncate text-xs">{orden.clienteSolicitante?.razonSocial}</p>
                        </div>
                        <p className="text-main text-sm font-bold">{formatMoney(orden.saldoPendiente)}</p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <p className="text-faint mb-2 text-xs font-bold uppercase">Pagos parciales</p>
                {facturacionResumen.parciales.length === 0 ? (
                  <p className="text-muted text-sm">No hay pagos parciales pendientes en la muestra reciente.</p>
                ) : (
                  <div className="grid gap-2">
                    {facturacionResumen.parciales.map((orden) => (
                      <Link key={orden.id} to="/facturacion" className="info-tile flex justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-main truncate text-sm font-semibold">{orden.numeroFactura}</p>
                          <p className="text-muted truncate text-xs">{orden.numeroOrden}</p>
                        </div>
                        <p className="text-main text-sm font-bold">{formatMoney(orden.saldoPendiente)}</p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
