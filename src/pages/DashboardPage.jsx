import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ClipboardList,
  FileWarning,
  Route,
  Truck,
  Users,
} from "lucide-react";
import { useOrdenesServicio } from "../context/OrdenServicioContext";
import { useProgramacionViaje } from "../context/ProgramacionViajeContext";
import { useGuiaTransportista } from "../context/GuiaTransportistaContext";
import { useUnidades } from "../context/UnidadContext";
import { useConductores } from "../context/ConductorContext";

const toArray = (value) => (Array.isArray(value) ? value : []);

const countBy = (items, key) =>
  toArray(items).reduce((acc, item) => {
    const value = item?.[key] || "SIN_ESTADO";
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});

const daysUntil = (dateValue) => {
  if (!dateValue) return null;

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  return Math.ceil((date.getTime() - today.getTime()) / 86400000);
};

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

const MetricCard = ({ icon: Icon, label, value, detail, to }) => {
  const content = (
    <div className="panel flex min-h-[112px] items-center gap-4 p-4 transition hover:border-[var(--app-primary)]">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border bg-[var(--app-surface-muted)]">
        <Icon className="h-5 w-5 text-[var(--app-primary)]" />
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

const DashboardPage = () => {
  const {
    ordenes = [],
    devolucionesPendientes = [],
    cargarOrdenesServicio,
    cargarDevolucionesPendientes,
  } = useOrdenesServicio();
  const { programaciones = [], getProgramacionesViaje } =
    useProgramacionViaje();
  const { guiasTransportista = [], obtenerGuiasTransportista } =
    useGuiaTransportista();
  const { unidades = [], obtenerUnidades } = useUnidades();
  const { conductores = [], obtenerConductores } = useConductores();

  useEffect(() => {
    cargarOrdenesServicio?.({ page: 1, limit: 10 });
    cargarDevolucionesPendientes?.({ page: 1, limit: 10 });
    getProgramacionesViaje?.({ page: 1, limit: 10 });
    obtenerGuiasTransportista?.({ page: 1, limit: 10 });
    obtenerUnidades?.({ page: 1, limit: 100 });
    obtenerConductores?.({ page: 1, limit: 100 });
  }, [
    cargarDevolucionesPendientes,
    cargarOrdenesServicio,
    getProgramacionesViaje,
    obtenerConductores,
    obtenerGuiasTransportista,
    obtenerUnidades,
  ]);

  const ordenesPorEstado = useMemo(() => countBy(ordenes, "estado"), [ordenes]);
  const viajesPorEstado = useMemo(
    () => countBy(programaciones, "estado"),
    [programaciones]
  );
  const guiasPorEstado = useMemo(
    () => countBy(guiasTransportista, "estado"),
    [guiasTransportista]
  );

  const devolucionesCriticas = useMemo(() => {
    return toArray(devolucionesPendientes)
      .map((orden) => ({
        ...orden,
        diasRestantes: daysUntil(orden.fechaVencimientoDevolucion),
      }))
      .filter(
        (orden) =>
          orden.diasRestantes !== null &&
          orden.diasRestantes <= 3 &&
          orden.estadoDevolucion !== "DEVUELTO"
      )
      .sort((a, b) => a.diasRestantes - b.diasRestantes)
      .slice(0, 5);
  }, [devolucionesPendientes]);

  const guiasConError = useMemo(
    () =>
      toArray(guiasTransportista)
        .filter((guia) => guia.estado === "ERROR")
        .slice(0, 5),
    [guiasTransportista]
  );

  const unidadesActivas = toArray(unidades).filter(
    (unidad) => unidad.estado === "ACTIVO"
  ).length;
  const conductoresActivos = toArray(conductores).filter(
    (conductor) => conductor.estado === "ACTIVO"
  ).length;

  return (
    <div className="w-full py-4">
      <div className="page-wrap">
        <header className="page-hero">
          <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="eyebrow">Panel operativo</div>
              <h1 className="page-title">Dashboard</h1>
              <p className="page-description">
                Vista rápida de órdenes, viajes, guías, devoluciones y recursos
                disponibles.
              </p>
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
            value={
              (viajesPorEstado.ASIGNADO || 0) +
              (viajesPorEstado.EN_RUTA || 0) +
              (viajesPorEstado.EN_ALMACEN || 0) +
              (viajesPorEstado.EN_CLIENTE || 0)
            }
            detail={`${viajesPorEstado.ENTREGADO || 0} entregados`}
            to="/programacion-viaje"
          />
          <MetricCard
            icon={FileWarning}
            label="Guías con error"
            value={guiasPorEstado.ERROR || 0}
            detail={`${guiasPorEstado.PENDIENTE || 0} pendientes`}
            to="/guia-transportista"
          />
          <MetricCard
            icon={AlertTriangle}
            label="Devoluciones críticas"
            value={devolucionesCriticas.length}
            detail="Vencidas o por vencer en 3 días"
            to="/devoluciones"
          />
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <div className="panel p-4">
            <div className="mb-3 flex items-center gap-2">
              <Truck className="h-4 w-4 text-[var(--app-primary)]" />
              <h2 className="text-main text-sm font-bold">Recursos activos</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="info-tile">
                <p className="text-faint text-xs">Unidades activas</p>
                <p className="text-main text-xl font-bold">
                  {unidadesActivas}
                </p>
              </div>
              <div className="info-tile">
                <p className="text-faint text-xs">Conductores activos</p>
                <p className="text-main text-xl font-bold">
                  {conductoresActivos}
                </p>
              </div>
            </div>
          </div>

          <div className="panel p-4 lg:col-span-2">
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <h2 className="text-main text-sm font-bold">
                Devoluciones por atender
              </h2>
            </div>
            {devolucionesCriticas.length === 0 ? (
              <p className="text-muted text-sm">
                No hay devoluciones críticas en este momento.
              </p>
            ) : (
              <div className="grid gap-2">
                {devolucionesCriticas.map((orden) => (
                  <Link
                    key={orden.id || orden._id}
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
        </section>

        <section className="panel p-4">
          <div className="mb-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-[var(--app-primary)]" />
            <h2 className="text-main text-sm font-bold">
              Guías con observación
            </h2>
          </div>
          {guiasConError.length === 0 ? (
            <p className="text-muted text-sm">No hay guías con error.</p>
          ) : (
            <div className="grid gap-2 md:grid-cols-2">
              {guiasConError.map((guia) => (
                <Link
                  key={guia.id || guia._id}
                  to="/guia-transportista"
                  className="info-tile"
                >
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
        </section>
      </div>
    </div>
  );
};

export default DashboardPage;
