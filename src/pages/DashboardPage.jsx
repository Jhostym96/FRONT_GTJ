import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileText,
  FileWarning,
  ReceiptText,
  Route,
  ShieldAlert,
  Truck,
  Users,
} from "lucide-react";
import { obtenerResumenDashboardRequest } from "../api/dashboard";
import { ErrorAlert } from "../components/ui/Accessibility";

const toArray = (value) => (Array.isArray(value) ? value : []);

const formatDate = (dateValue) => {
  if (!dateValue) return "-";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("es-PE", {
    timeZone: "UTC",
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

const getDaysRemaining = (dateValue) => {
  if (!dateValue) return null;

  const target = new Date(dateValue);
  if (Number.isNaN(target.getTime())) return null;

  const today = new Date();
  const todayUtc = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate()
  );
  const targetUtc = Date.UTC(
    target.getUTCFullYear(),
    target.getUTCMonth(),
    target.getUTCDate()
  );

  return Math.round((targetUtc - todayUtc) / 86400000);
};

const getPriority = (daysRemaining, forceCritical = false) => {
  if (forceCritical || daysRemaining === null || daysRemaining < 0) {
    return "critical";
  }
  if (daysRemaining <= 1) return "high";
  return "medium";
};

const priorityConfig = {
  critical: {
    label: "Crítica",
    tone: "red",
    weight: 0,
  },
  high: {
    label: "Alta",
    tone: "amber",
    weight: 1,
  },
  medium: {
    label: "Media",
    tone: "blue",
    weight: 2,
  },
};

const getDeadlineText = (dateValue, daysRemaining, immediate = false) => {
  if (immediate) return "Atención inmediata";
  if (!dateValue) return "Sin fecha límite";

  if (daysRemaining < 0) {
    return `${formatDate(dateValue)} · venció hace ${Math.abs(daysRemaining)} ${
      Math.abs(daysRemaining) === 1 ? "día" : "días"
    }`;
  }

  if (daysRemaining === 0) return `${formatDate(dateValue)} · vence hoy`;
  if (daysRemaining === 1) return `${formatDate(dateValue)} · vence mañana`;
  return `${formatDate(dateValue)} · en ${daysRemaining} días`;
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

const OperationalAlertRow = ({ alert }) => {
  const priority = priorityConfig[alert.priority] || priorityConfig.medium;
  const styles = toneClasses[priority.tone];
  const Icon = alert.icon;

  return (
    <div className="grid gap-3 rounded-lg border bg-[var(--app-surface-muted)] p-3.5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
      <div className="flex min-w-0 gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border ${styles.border} ${styles.bg}`}
        >
          <Icon className={`h-5 w-5 ${styles.icon}`} />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] font-extrabold uppercase ${styles.border} ${styles.bg} ${styles.text}`}
            >
              {priority.label}
            </span>
            <span className="text-faint text-[10px] font-extrabold uppercase tracking-wide">
              {alert.category}
            </span>
          </div>
          <p className="text-main mt-1 text-base font-extrabold">{alert.title}</p>
          <p className="text-muted mt-0.5 line-clamp-2 text-xs">{alert.subtitle}</p>
          <div className="text-faint mt-2 flex items-center gap-1.5 text-xs">
            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
            <span>{alert.deadline}</span>
          </div>
        </div>
      </div>
      <Link
        to={alert.to}
        className="btn-secondary ml-[3.25rem] w-fit px-3 py-1.5 text-xs md:ml-0"
      >
        {alert.action}
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
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
  const [alertFilter, setAlertFilter] = useState("all");

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
    Number(dashboard?.guias?.conErrorTotal ?? guiasPorEstado.ERROR ?? 0) +
    Number(devolucionesResumen.criticasTotal ?? devolucionesCriticas.length) +
    Number(facturacionResumen.vencidasTotal ?? facturasVencidas.length);

  const saludOperativa = useMemo(() => {
    const riesgos = [
      documentosVencidos > 0,
      Number(dashboard?.guias?.conErrorTotal ?? guiasPorEstado.ERROR ?? 0) > 0,
      Number(devolucionesResumen.criticasTotal ?? devolucionesCriticas.length) > 0,
      Number(facturacionResumen.vencidasTotal ?? facturasVencidas.length) > 0,
    ].filter(Boolean).length;

    if (riesgos >= 3) return { label: "Atención alta", tone: "red", detail: "Priorizar alertas críticas" };
    if (riesgos >= 1) return { label: "Con observaciones", tone: "amber", detail: "Revisar pendientes del día" };
    return {
      label: "Controlada",
      tone: "green",
      detail: "Sin alertas prioritarias visibles",
    };
  }, [
    dashboard?.guias?.conErrorTotal,
    devolucionesResumen.criticasTotal,
    documentosVencidos,
    facturacionResumen.vencidasTotal,
    guiasPorEstado.ERROR,
    devolucionesCriticas.length,
    facturasVencidas.length,
  ]);

  const alertasOperativas = useMemo(() => {
    const alertas = [
      ...documentosCriticos.map((documento) => {
        const daysRemaining =
          documento.diasRestantes ??
          getDaysRemaining(documento.fechaVencimiento);

        return {
          id: `doc-${documento.id}`,
          icon: FileText,
          type: "documents",
          category: "Documento",
          title: documento.nombre || "Documento operativo",
          subtitle: `${documento.entidad || "Entidad no identificada"} · ${
            daysRemaining < 0
              ? "Documento vencido"
              : "Documento próximo a vencer"
          }`,
          priority: getPriority(daysRemaining),
          daysRemaining,
          deadline: getDeadlineText(
            documento.fechaVencimiento,
            daysRemaining
          ),
          to: "/documentacion",
          action: "Revisar documento",
        };
      }),
      ...devolucionesCriticas.map((devolucion) => {
        const daysRemaining =
          devolucion.diasRestantes ??
          getDaysRemaining(devolucion.fechaVencimientoDevolucion);

        return {
          id: `dev-${devolucion.id || devolucion._id}`,
          icon: Clock3,
          type: "returns",
          category: "Devolución",
          title: devolucion.numeroContenedor || "Contenedor no registrado",
          subtitle: [
            devolucion.numeroOrden
              ? `OS ${devolucion.numeroOrden}`
              : "OS no registrada",
            devolucion.cliente || null,
            devolucion.almacenDevolucion
              ? `Almacén ${devolucion.almacenDevolucion}`
              : null,
          ]
            .filter(Boolean)
            .join(" · "),
          priority: getPriority(daysRemaining),
          daysRemaining,
          deadline: getDeadlineText(
            devolucion.fechaVencimientoDevolucion,
            daysRemaining
          ),
          to: "/devoluciones",
          action: "Gestionar devolución",
        };
      }),
      ...facturasVencidas.map((orden) => {
        const daysRemaining = getDaysRemaining(orden.fechaVencimientoPago);

        return {
          id: `factura-${orden.id || orden._id}`,
          icon: Banknote,
          type: "invoices",
          category: "Factura",
          title:
            orden.numeroFactura || orden.numeroOrden || "Factura sin número",
          subtitle: `${
            orden.clienteSolicitante?.razonSocial || "Cliente no registrado"
          } · Saldo ${formatMoney(orden.saldoPendiente)}`,
          priority: "critical",
          daysRemaining,
          deadline: getDeadlineText(
            orden.fechaVencimientoPago,
            daysRemaining
          ),
          to: "/facturacion",
          action: "Gestionar cobranza",
        };
      }),
      ...guiasConError.map((guia) => ({
        id: `guia-${guia.id || guia._id}`,
        icon: FileWarning,
        type: "guides",
        category: "Guía",
        title:
          [guia.serie, guia.numero].filter(Boolean).join("-") ||
          "Guía sin número",
        subtitle:
          guia.sunat_description ||
          guia.sunat_note ||
          "Revisar respuesta Nubefact/SUNAT",
        priority: getPriority(null, true),
        daysRemaining: Number.NEGATIVE_INFINITY,
        deadline: getDeadlineText(null, null, true),
        to: "/guia-transportista",
        action: "Corregir guía",
      })),
    ];

    return alertas.sort((a, b) => {
      const priorityDifference =
        priorityConfig[a.priority].weight - priorityConfig[b.priority].weight;
      if (priorityDifference !== 0) return priorityDifference;
      return (a.daysRemaining ?? Infinity) - (b.daysRemaining ?? Infinity);
    });
  }, [
    documentosCriticos,
    devolucionesCriticas,
    facturasVencidas,
    guiasConError,
  ]);

  const alertFilters = [
    {
      id: "all",
      label: "Todas",
      count:
        documentosVencidos +
        documentosPorVencer +
        Number(
          devolucionesResumen.criticasTotal ?? devolucionesCriticas.length
        ) +
        Number(facturacionResumen.vencidasTotal ?? facturasVencidas.length) +
        Number(dashboard?.guias?.conErrorTotal ?? guiasPorEstado.ERROR ?? 0),
    },
    {
      id: "documents",
      label: "Documentos",
      count: documentosVencidos + documentosPorVencer,
    },
    {
      id: "returns",
      label: "Devoluciones",
      count: Number(
        devolucionesResumen.criticasTotal ?? devolucionesCriticas.length
      ),
    },
    {
      id: "invoices",
      label: "Facturas",
      count: Number(
        facturacionResumen.vencidasTotal ?? facturasVencidas.length
      ),
    },
    {
      id: "guides",
      label: "Guías",
      count: Number(
        dashboard?.guias?.conErrorTotal ?? guiasPorEstado.ERROR ?? 0
      ),
    },
  ];

  const alertasFiltradas = alertasOperativas.filter((alert) =>
    alertFilter === "all"
      ? true
      : alert.type === alertFilter
  );

  const activeAlertCount =
    alertFilters.find((filter) => filter.id === alertFilter)?.count || 0;

  return (
    <div className="page">
      <div className="page-wrap">
        <header className="page-hero overflow-hidden border-l-4 border-l-[var(--app-primary)]">
          <div className="page-hero-content">
            <div className="max-w-3xl">
              <div className="eyebrow">Control operativo</div>
              <h1 className="page-title text-3xl sm:text-4xl">
                Resumen de la operación
              </h1>
              <p className="page-description">
                Indicadores y pendientes que requieren seguimiento durante la
                jornada.
              </p>
            </div>

            <div className="grid w-full gap-3 sm:grid-cols-3 lg:max-w-2xl">
              <div className={`rounded-lg border p-4 ${toneClasses[saludOperativa.tone].border} ${toneClasses[saludOperativa.tone].bg}`}>
                <p className="text-faint text-xs font-bold uppercase">Salud operativa</p>
                <p className={`mt-1 text-lg font-extrabold ${toneClasses[saludOperativa.tone].text}`}>
                  {loading ? "-" : saludOperativa.label}
                </p>
                <p className="text-muted mt-1 text-xs">{saludOperativa.detail}</p>
              </div>
              <div className={`rounded-lg border p-4 ${alertasCriticas > 0 ? "border-amber-500/25 bg-amber-500/10" : "border-emerald-500/25 bg-emerald-500/10"}`}>
                <p className="text-faint text-xs font-bold uppercase">
                  Alertas prioritarias
                </p>
                <p className={`mt-1 text-lg font-extrabold ${alertasCriticas > 0 ? "text-amber-600 dark:text-amber-300" : "text-emerald-600 dark:text-emerald-300"}`}>
                  {loading ? "-" : alertasCriticas}
                </p>
                <p className="text-muted mt-1 text-xs">
                  Vencidas, próximas o con error
                </p>
              </div>
              <div className={`rounded-lg border p-4 ${facturasVencidas.length > 0 ? "border-red-500/25 bg-red-500/10" : "border-blue-500/25 bg-blue-500/10"}`}>
                <p className="text-faint text-xs font-bold uppercase">Saldo por cobrar</p>
                <p className={`mt-1 text-lg font-extrabold ${facturasVencidas.length > 0 ? "text-red-600 dark:text-red-300" : "text-blue-600 dark:text-blue-300"}`}>
                  {loading ? "-" : formatMoney(facturacionResumen.saldoPendiente)}
                </p>
                <p className="text-muted mt-1 text-xs">
                  {facturacionResumen.vencidasTotal ?? facturasVencidas.length} facturas vencidas
                </p>
              </div>
            </div>
          </div>
        </header>

        {error && <ErrorAlert>{error}</ErrorAlert>}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
            icon={ShieldAlert}
            label="Documentación"
            value={`${documentosPorVencer} por vencer`}
            detail={`${documentosVencidos} vencidos`}
            to="/documentacion"
            tone={documentosVencidos > 0 ? "red" : "amber"}
            loading={loading}
          />
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="panel p-4">
            <SectionHeader
              icon={AlertTriangle}
              title="Centro de alertas operativas"
              subtitle="Pendientes priorizados por urgencia, fecha límite y efecto en la operación."
            />
            <div className="mb-2 flex gap-2 overflow-x-auto pb-2">
              {alertFilters.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setAlertFilter(filter.id)}
                  aria-pressed={alertFilter === filter.id}
                  className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                    alertFilter === filter.id
                      ? "border-[var(--app-primary)] bg-[var(--app-primary-soft)] text-[var(--app-primary)]"
                      : "text-muted hover:bg-[var(--app-surface-muted)]"
                  }`}
                >
                  {filter.label}
                  <span className="ml-1.5 opacity-75">{filter.count}</span>
                </button>
              ))}
            </div>
            {alertasFiltradas.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                text="No hay alertas operativas en esta categoría."
              />
            ) : (
              <div>
                <div className="grid gap-3">
                  {alertasFiltradas.map((alert) => (
                    <OperationalAlertRow key={alert.id} alert={alert} />
                  ))}
                </div>
                {activeAlertCount > alertasFiltradas.length && (
                  <p className="text-muted mt-3 text-center text-xs">
                    Se muestran las {alertasFiltradas.length} alertas más
                    próximas de {activeAlertCount}.
                  </p>
                )}
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
            <div className="grid gap-4">
              <div>
                <p className="text-faint mb-2 text-[11px] font-extrabold uppercase">
                  Órdenes de servicio
                </p>
                <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-1">
                <ProgressMetric label="Pendientes" value={ordenesPorEstado.PENDIENTE || 0} total={totalOrdenes} tone="amber" />
                <ProgressMetric label="Programadas" value={ordenesPorEstado.PROGRAMADA || 0} total={totalOrdenes} tone="blue" />
                <ProgressMetric label="Finalizadas" value={ordenesPorEstado.FINALIZADA || 0} total={totalOrdenes} tone="green" />
                </div>
              </div>
              <div>
                <p className="text-faint mb-2 text-[11px] font-extrabold uppercase">
                  Viajes
                </p>
                <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-1">
                <ProgressMetric label="Asignados" value={viajesPorEstado.ASIGNADO || 0} total={totalViajes} tone="blue" />
                <ProgressMetric label="En ruta" value={viajesPorEstado.EN_RUTA || 0} total={totalViajes} tone="violet" />
                <ProgressMetric label="En cliente" value={viajesPorEstado.EN_CLIENTE || 0} total={totalViajes} tone="amber" />
                </div>
              </div>
              <div>
                <p className="text-faint mb-2 text-[11px] font-extrabold uppercase">
                  Guías
                </p>
                <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-1">
                <ProgressMetric label="Aceptadas" value={guiasPorEstado.ACEPTADA || 0} total={totalGuias} tone="green" />
                <ProgressMetric label="Pendientes" value={guiasPorEstado.PENDIENTE || 0} total={totalGuias} tone="amber" />
                <ProgressMetric label="Con error" value={guiasPorEstado.ERROR || 0} total={totalGuias} tone="red" />
                </div>
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

        <section>
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
        </section>
      </div>
    </div>
  );
};

export default DashboardPage;
