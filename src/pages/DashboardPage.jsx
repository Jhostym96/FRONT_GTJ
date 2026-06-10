import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileText,
  FileWarning,
  Gauge,
  ReceiptText,
  Route,
  ShieldAlert,
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
    maximumFractionDigits: 2,
  });

const percent = (value, total) => {
  if (!total) return 0;
  return Math.round((Number(value || 0) / Number(total || 0)) * 100);
};

const toneClasses = {
  blue: {
    icon: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/25",
    text: "text-blue-500 dark:text-blue-300",
    bar: "bg-blue-500",
  },
  amber: {
    icon: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/25",
    text: "text-amber-600 dark:text-amber-300",
    bar: "bg-amber-500",
  },
  green: {
    icon: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/25",
    text: "text-emerald-600 dark:text-emerald-300",
    bar: "bg-emerald-500",
  },
  red: {
    icon: "text-red-500",
    bg: "bg-red-500/10",
    border: "border-red-500/25",
    text: "text-red-600 dark:text-red-300",
    bar: "bg-red-500",
  },
  violet: {
    icon: "text-violet-500",
    bg: "bg-violet-500/10",
    border: "border-violet-500/25",
    text: "text-violet-600 dark:text-violet-300",
    bar: "bg-violet-500",
  },
  slate: {
    icon: "text-slate-500 dark:text-slate-300",
    bg: "bg-slate-500/10",
    border: "border-slate-500/20",
    text: "text-main",
    bar: "bg-slate-500",
  },
};

const SectionHeader = ({ icon: Icon, title, subtitle, actionTo, actionLabel }) => (
  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
    <div className="flex min-w-0 gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border bg-[var(--app-surface-muted)]">
        <Icon className="h-5 w-5 text-[var(--app-primary)]" />
      </div>
      <div className="min-w-0">
        <h2 className="text-main text-base font-extrabold">{title}</h2>
        {subtitle && <p className="text-muted mt-0.5 text-sm">{subtitle}</p>}
      </div>
    </div>
    {actionTo && (
      <Link to={actionTo} className="btn-secondary px-3 py-1.5 text-xs">
        {actionLabel}
        <ArrowRight className="h-4 w-4" />
      </Link>
    )}
  </div>
);

const KpiCard = ({ icon: Icon, label, value, detail, to, tone = "blue", loading }) => {
  const styles = toneClasses[tone] || toneClasses.blue;
  const content = (
    <div className="panel group relative flex min-h-[142px] flex-col justify-between overflow-hidden p-4 transition hover:-translate-y-0.5 hover:border-[var(--app-primary)] hover:shadow-lg">
      <div className={`absolute inset-x-0 top-0 h-1 ${styles.bar}`} />
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-md border ${styles.border} ${styles.bg} transition group-hover:scale-105`}>
          <Icon className={`h-5 w-5 ${styles.icon}`} />
        </div>
        {loading && <div className="h-2 w-14 animate-pulse rounded-full bg-[var(--app-surface-muted)]" />}
      </div>
      <div className="mt-5 min-w-0">
        <p className="text-faint text-xs font-bold uppercase">{label}</p>
        <p className="text-main mt-1 truncate text-2xl font-extrabold">{loading ? "-" : value}</p>
        {detail && <p className="text-muted mt-1 truncate text-xs">{detail}</p>}
      </div>
    </div>
  );

  return to ? <Link to={to}>{content}</Link> : content;
};

const ProgressMetric = ({ label, value, total, tone = "blue", detail }) => {
  const styles = toneClasses[tone] || toneClasses.blue;
  const pct = Math.min(percent(value, total), 100);

  return (
    <div className="rounded-md border bg-[var(--app-surface-muted)] p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-main truncate text-sm font-bold">{label}</p>
        <p className={`text-sm font-extrabold ${styles.text}`}>{value || 0}</p>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--app-border)]">
        <div className={`h-full rounded-full ${styles.bar}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-muted mt-2 text-xs">{detail || `${pct}% del total`}</p>
    </div>
  );
};

const PriorityRow = ({ icon: Icon, title, subtitle, meta, tone = "amber", to }) => {
  const styles = toneClasses[tone] || toneClasses.amber;
  const content = (
    <div className="flex items-center justify-between gap-3 border-b py-3 last:border-b-0">
      <div className="flex min-w-0 items-center gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border ${styles.border} ${styles.bg}`}>
          <Icon className={`h-4 w-4 ${styles.icon}`} />
        </div>
        <div className="min-w-0">
          <p className="text-main truncate text-sm font-bold">{title}</p>
          <p className="text-muted truncate text-xs">{subtitle}</p>
        </div>
      </div>
      <p className={`shrink-0 text-right text-xs font-extrabold ${styles.text}`}>{meta}</p>
    </div>
  );

  return to ? <Link to={to}>{content}</Link> : content;
};

const EmptyState = ({ icon: Icon, text }) => (
  <div className="flex items-center gap-3 rounded-md border border-dashed p-4">
    <Icon className="h-5 w-5 shrink-0 text-emerald-500" />
    <p className="text-muted text-sm">{text}</p>
  </div>
);

const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const cargarResumen = async () => {
      try {
        setLoading(true);
        const res = await obtenerResumenDashboardRequest();
        setDashboard(res.data || null);
        setError("");
      } catch (error) {
        console.error("Error al cargar dashboard:", error);
        setDashboard(null);
        setError("No se pudo cargar el resumen gerencial");
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

  const documentosCriticos = toArray(dashboard?.documentacion?.criticos);
  const devolucionesCriticas = toArray(devolucionesResumen.criticas);
  const guiasConError = toArray(dashboard?.guias?.conError);
  const programacionesRecientes = toArray(dashboard?.recientes?.programaciones);
  const facturasVencidas = toArray(facturacionResumen.vencidas);
  const facturasParciales = toArray(facturacionResumen.parciales);

  const viajesActivos =
    (viajesPorEstado.ASIGNADO || 0) +
    (viajesPorEstado.EN_RUTA || 0) +
    (viajesPorEstado.EN_ALMACEN || 0) +
    (viajesPorEstado.EN_CLIENTE || 0);

  const totalOrdenes = dashboard?.ordenes?.total || 0;
  const totalViajes = dashboard?.programaciones?.total || 0;
  const totalGuias = dashboard?.guias?.total || 0;
  const documentosVencidos = dashboard?.documentacion?.vencidos || 0;
  const documentosPorVencer = dashboard?.documentacion?.porVencer || 0;
  const alertasCriticas =
    documentosVencidos +
    guiasConError.length +
    devolucionesCriticas.length +
    facturasVencidas.length;

  const saludOperativa = useMemo(() => {
    const riesgos = [
      documentosVencidos > 0,
      guiasConError.length > 0,
      devolucionesCriticas.length > 0,
      facturasVencidas.length > 0,
    ].filter(Boolean).length;

    if (riesgos >= 3) return { label: "Atención alta", tone: "red", detail: "Priorizar alertas críticas" };
    if (riesgos >= 1) return { label: "Con observaciones", tone: "amber", detail: "Revisar pendientes del día" };
    return { label: "Controlada", tone: "green", detail: "Sin alertas críticas visibles" };
  }, [documentosVencidos, devolucionesCriticas.length, facturasVencidas.length, guiasConError.length]);

  const prioridades = [
    ...documentosCriticos.slice(0, 3).map((documento) => ({
      id: `doc-${documento.id}`,
      icon: FileText,
      title: documento.nombre,
      subtitle: documento.entidad,
      meta:
        documento.diasRestantes < 0
          ? `${Math.abs(documento.diasRestantes)} días vencido`
          : `${documento.diasRestantes} días`,
      tone: documento.diasRestantes < 0 ? "red" : "amber",
      to: "/documentacion",
    })),
    ...devolucionesCriticas.slice(0, 2).map((orden) => ({
      id: `dev-${orden.id || orden._id}`,
      icon: Clock3,
      title: orden.numeroOrden || "Orden sin número",
      subtitle: `Contenedor ${orden.numeroContenedor || "-"}`,
      meta:
        orden.diasRestantes < 0
          ? `${Math.abs(orden.diasRestantes)} días vencida`
          : `${orden.diasRestantes} días`,
      tone: orden.diasRestantes < 0 ? "red" : "amber",
      to: "/devoluciones",
    })),
    ...guiasConError.slice(0, 2).map((guia) => ({
      id: `guia-${guia.id || guia._id}`,
      icon: FileWarning,
      title: `${guia.serie || ""}-${guia.numero || ""}`,
      subtitle: guia.sunat_description || guia.sunat_note || "Revisar respuesta Nubefact/SUNAT",
      meta: "Error",
      tone: "red",
      to: "/guia-transportista",
    })),
  ].slice(0, 6);

  return (
    <div className="page">
      <div className="page-wrap">
        <header className="page-hero border-l-4 border-l-[var(--app-primary)]">
          <div className="page-hero-content">
            <div className="max-w-3xl">
              <div className="eyebrow">Panel gerencial</div>
              <h1 className="page-title text-3xl sm:text-4xl">Dashboard</h1>
              <p className="page-description">
                Vista consolidada de operación, cobranza, documentación y recursos para tomar decisiones rápidas.
              </p>
              <div className="mt-4 grid max-w-xl gap-2 sm:grid-cols-3">
                <Link to="/ordenes-servicio" className="rounded-md border bg-[var(--app-surface-muted)] px-3 py-2 transition hover:border-[var(--app-primary)]">
                  <p className="text-faint text-[11px] font-bold uppercase">Órdenes</p>
                  <p className="text-main text-lg font-extrabold">{loading ? "-" : totalOrdenes}</p>
                </Link>
                <Link to="/programacion-viaje" className="rounded-md border bg-[var(--app-surface-muted)] px-3 py-2 transition hover:border-[var(--app-primary)]">
                  <p className="text-faint text-[11px] font-bold uppercase">Viajes</p>
                  <p className="text-main text-lg font-extrabold">{loading ? "-" : totalViajes}</p>
                </Link>
                <Link to="/guia-transportista" className="rounded-md border bg-[var(--app-surface-muted)] px-3 py-2 transition hover:border-[var(--app-primary)]">
                  <p className="text-faint text-[11px] font-bold uppercase">Guías</p>
                  <p className="text-main text-lg font-extrabold">{loading ? "-" : totalGuias}</p>
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[520px]">
              <div className={`rounded-md border p-3 ${toneClasses[saludOperativa.tone].border} ${toneClasses[saludOperativa.tone].bg}`}>
                <p className="text-faint text-xs font-bold uppercase">Salud operativa</p>
                <p className={`mt-1 text-lg font-extrabold ${toneClasses[saludOperativa.tone].text}`}>
                  {loading ? "-" : saludOperativa.label}
                </p>
                <p className="text-muted mt-1 text-xs">{saludOperativa.detail}</p>
              </div>
              <div className={`rounded-md border p-3 ${alertasCriticas > 0 ? "border-amber-500/25 bg-amber-500/10" : "border-emerald-500/25 bg-emerald-500/10"}`}>
                <p className="text-faint text-xs font-bold uppercase">Alertas críticas</p>
                <p className={`mt-1 text-lg font-extrabold ${alertasCriticas > 0 ? "text-amber-600 dark:text-amber-300" : "text-emerald-600 dark:text-emerald-300"}`}>
                  {loading ? "-" : alertasCriticas}
                </p>
                <p className="text-muted mt-1 text-xs">Documentos, guías, devoluciones y cobranza</p>
              </div>
              <div className={`rounded-md border p-3 ${facturasVencidas.length > 0 ? "border-red-500/25 bg-red-500/10" : "border-blue-500/25 bg-blue-500/10"}`}>
                <p className="text-faint text-xs font-bold uppercase">Saldo por cobrar</p>
                <p className={`mt-1 text-lg font-extrabold ${facturasVencidas.length > 0 ? "text-red-600 dark:text-red-300" : "text-blue-600 dark:text-blue-300"}`}>
                  {loading ? "-" : formatMoney(facturacionResumen.saldoPendiente)}
                </p>
                <p className="text-muted mt-1 text-xs">{facturasVencidas.length} vencidas en muestra</p>
              </div>
            </div>
          </div>
        </header>

        {error && <div className="alert-panel">{error}</div>}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <KpiCard
            icon={ClipboardList}
            label="Órdenes pendientes"
            value={ordenesPorEstado.PENDIENTE || 0}
            detail={`${ordenesPorEstado.PROGRAMADA || 0} programadas`}
            to="/ordenes-servicio"
            tone="blue"
            loading={loading}
          />
          <KpiCard
            icon={Route}
            label="Viajes activos"
            value={viajesActivos}
            detail={`${viajesPorEstado.ENTREGADO || 0} entregados`}
            to="/programacion-viaje"
            tone="violet"
            loading={loading}
          />
          <KpiCard
            icon={ReceiptText}
            label="Por facturar"
            value={facturacionResumen.pendientesFacturar || 0}
            detail={`${facturacionResumen.facturadas || 0} facturadas`}
            to="/facturacion"
            tone="amber"
            loading={loading}
          />
          <KpiCard
            icon={Banknote}
            label="Cobranza pendiente"
            value={formatMoney(facturacionResumen.saldoPendiente)}
            detail={`${facturasParciales.length} pagos parciales`}
            to="/facturacion"
            tone={facturasVencidas.length > 0 ? "red" : "green"}
            loading={loading}
          />
          <KpiCard
            icon={ShieldAlert}
            label="Documentación"
            value={`${documentosPorVencer} por vencer`}
            detail={`${documentosVencidos} vencidos`}
            to="/documentacion"
            tone={documentosVencidos > 0 ? "red" : "amber"}
            loading={loading}
          />
        </section>

        <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="panel p-4">
            <SectionHeader
              icon={Gauge}
              title="Prioridades ejecutivas"
              subtitle="Alertas que requieren revisión antes de cerrar la operación."
            />
            {prioridades.length === 0 ? (
              <EmptyState icon={CheckCircle2} text="No hay alertas críticas visibles en este resumen." />
            ) : (
              <div>
                {prioridades.map((item) => (
                  <PriorityRow key={item.id} {...item} />
                ))}
              </div>
            )}
          </div>

          <div className="panel p-4">
            <SectionHeader
              icon={BarChart3}
              title="Estado operativo"
              subtitle="Distribución de órdenes, viajes y guías por estado."
              actionTo="/programacion-viaje"
              actionLabel="Ver viajes"
            />
            <div className="grid gap-3 md:grid-cols-3">
              <div className="grid gap-3">
                <ProgressMetric label="Pendientes" value={ordenesPorEstado.PENDIENTE || 0} total={totalOrdenes} tone="amber" />
                <ProgressMetric label="Programadas" value={ordenesPorEstado.PROGRAMADA || 0} total={totalOrdenes} tone="blue" />
                <ProgressMetric label="Finalizadas" value={ordenesPorEstado.FINALIZADA || 0} total={totalOrdenes} tone="green" />
              </div>
              <div className="grid gap-3">
                <ProgressMetric label="Asignados" value={viajesPorEstado.ASIGNADO || 0} total={totalViajes} tone="blue" />
                <ProgressMetric label="En ruta" value={viajesPorEstado.EN_RUTA || 0} total={totalViajes} tone="violet" />
                <ProgressMetric label="En cliente" value={viajesPorEstado.EN_CLIENTE || 0} total={totalViajes} tone="amber" />
              </div>
              <div className="grid gap-3">
                <ProgressMetric label="Aceptadas" value={guiasPorEstado.ACEPTADA || 0} total={totalGuias} tone="green" />
                <ProgressMetric label="Pendientes" value={guiasPorEstado.PENDIENTE || 0} total={totalGuias} tone="amber" />
                <ProgressMetric label="Con error" value={guiasPorEstado.ERROR || 0} total={totalGuias} tone="red" />
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="panel p-4">
            <SectionHeader
              icon={Banknote}
              title="Cobranza y facturación"
              subtitle="Saldos pendientes, vencimientos y pagos parciales."
              actionTo="/facturacion"
              actionLabel="Ver facturación"
            />
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <p className="text-faint mb-2 text-xs font-bold uppercase">Facturas vencidas</p>
                {facturasVencidas.length === 0 ? (
                  <EmptyState icon={CheckCircle2} text="No hay facturas vencidas en la muestra reciente." />
                ) : (
                  <div className="divide-y rounded-md border">
                    {facturasVencidas.map((orden) => (
                      <Link key={orden.id} to="/facturacion" className="flex justify-between gap-3 p-3 hover:bg-[var(--app-surface-muted)]">
                        <div className="min-w-0">
                          <p className="text-main truncate text-sm font-bold">{orden.numeroFactura || orden.numeroOrden}</p>
                          <p className="text-muted truncate text-xs">{orden.clienteSolicitante?.razonSocial || "Cliente no registrado"}</p>
                        </div>
                        <p className="text-red-500 shrink-0 text-sm font-extrabold">{formatMoney(orden.saldoPendiente)}</p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <p className="text-faint mb-2 text-xs font-bold uppercase">Pagos parciales</p>
                {facturasParciales.length === 0 ? (
                  <EmptyState icon={CheckCircle2} text="No hay pagos parciales pendientes en la muestra reciente." />
                ) : (
                  <div className="divide-y rounded-md border">
                    {facturasParciales.map((orden) => (
                      <Link key={orden.id} to="/facturacion" className="flex justify-between gap-3 p-3 hover:bg-[var(--app-surface-muted)]">
                        <div className="min-w-0">
                          <p className="text-main truncate text-sm font-bold">{orden.numeroFactura || "Sin factura"}</p>
                          <p className="text-muted truncate text-xs">{orden.numeroOrden}</p>
                        </div>
                        <p className="text-amber-500 shrink-0 text-sm font-extrabold">{formatMoney(orden.saldoPendiente)}</p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="panel p-4">
            <SectionHeader
              icon={Truck}
              title="Capacidad operativa"
              subtitle="Recursos disponibles y compromisos pendientes."
            />
            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <Link to="/unidades" className="flex items-center justify-between rounded-md border bg-[var(--app-surface-muted)] p-4 hover:border-[var(--app-primary)]">
                <div>
                  <p className="text-faint text-xs font-bold uppercase">Unidades activas</p>
                  <p className="text-main mt-1 text-2xl font-extrabold">{recursosResumen.unidadesActivas || 0}</p>
                </div>
                <Truck className="h-6 w-6 text-blue-500" />
              </Link>
              <Link to="/conductores" className="flex items-center justify-between rounded-md border bg-[var(--app-surface-muted)] p-4 hover:border-[var(--app-primary)]">
                <div>
                  <p className="text-faint text-xs font-bold uppercase">Conductores activos</p>
                  <p className="text-main mt-1 text-2xl font-extrabold">{recursosResumen.conductoresActivos || 0}</p>
                </div>
                <Users className="h-6 w-6 text-emerald-500" />
              </Link>
              <Link to="/devoluciones" className="flex items-center justify-between rounded-md border bg-[var(--app-surface-muted)] p-4 hover:border-[var(--app-primary)]">
                <div>
                  <p className="text-faint text-xs font-bold uppercase">Devoluciones pendientes</p>
                  <p className="text-main mt-1 text-2xl font-extrabold">{devolucionesResumen.pendientes || 0}</p>
                </div>
                <Clock3 className="h-6 w-6 text-amber-500" />
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <div className="panel p-4">
            <SectionHeader
              icon={Route}
              title="Viajes recientes"
              subtitle="Últimas programaciones registradas en la operación."
              actionTo="/programacion-viaje"
              actionLabel="Ver viajes"
            />
            {programacionesRecientes.length === 0 ? (
              <EmptyState icon={Clock3} text="No hay viajes recientes." />
            ) : (
              <div className="divide-y rounded-md border">
                {programacionesRecientes.map((programacion) => (
                  <Link key={programacion.id} to="/programacion-viaje" className="flex items-center justify-between gap-3 p-3 hover:bg-[var(--app-surface-muted)]">
                    <div className="min-w-0">
                      <p className="text-main truncate text-sm font-bold">
                        {programacion.numeroProgramacion || "Sin número"} · {programacion.numeroOrden || "Sin orden"}
                      </p>
                      <p className="text-muted truncate text-xs">{programacion.cliente || "-"}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-main text-sm font-extrabold">{programacion.estado || "-"}</p>
                      <p className="text-faint text-xs">{programacion.placa || "-"} · {formatDate(programacion.fechaInicioTraslado)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="panel p-4">
            <SectionHeader
              icon={AlertTriangle}
              title="Alertas operativas"
              subtitle="Documentos, devoluciones y guías que pueden bloquear la operación."
            />
            <div className="grid gap-3">
              <Link to="/documentacion" className="flex items-center justify-between rounded-md border p-3 hover:bg-[var(--app-surface-muted)]">
                <div className="min-w-0">
                  <p className="text-main text-sm font-bold">Documentos críticos</p>
                  <p className="text-muted text-xs">{documentosVencidos} vencidos · {documentosPorVencer} por vencer</p>
                </div>
                <FileText className="h-5 w-5 text-amber-500" />
              </Link>
              <Link to="/devoluciones" className="flex items-center justify-between rounded-md border p-3 hover:bg-[var(--app-surface-muted)]">
                <div className="min-w-0">
                  <p className="text-main text-sm font-bold">Devoluciones críticas</p>
                  <p className="text-muted text-xs">{devolucionesCriticas.length} próximas o vencidas</p>
                </div>
                <Clock3 className="h-5 w-5 text-amber-500" />
              </Link>
              <Link to="/guia-transportista" className="flex items-center justify-between rounded-md border p-3 hover:bg-[var(--app-surface-muted)]">
                <div className="min-w-0">
                  <p className="text-main text-sm font-bold">Guías con observación</p>
                  <p className="text-muted text-xs">{guiasConError.length} requieren revisión</p>
                </div>
                <FileWarning className="h-5 w-5 text-red-500" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default DashboardPage;
