import { Link } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  Building2,
  ClipboardList,
  FileCheck2,
  FileText,
  History,
  LayoutDashboard,
  MapPinned,
  RotateCcw,
  ShieldCheck,
  Truck,
  UserRound,
  Users,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getAllowedRoutes, hasAction } from "../utils/permissions";

const iconByPath = {
  "/dashboard": LayoutDashboard,
  "/profile": UserRound,
  "/ordenes-servicio": ClipboardList,
  "/programacion-viaje": MapPinned,
  "/guia-transportista": FileText,
  "/documentos-facturacion": FileCheck2,
  "/devoluciones": RotateCcw,
  "/clientes": Building2,
  "/conductores": Users,
  "/unidades": Truck,
  "/usuarios": ShieldCheck,
  "/admin/empresa": Building2,
  "/admin/nubefact-pruebas": Activity,
  "/auditoria": History,
};

const moduleDescriptions = {
  "/dashboard": "Indicadores y alertas de la operación diaria.",
  "/profile": "Datos de tu cuenta y configuración personal.",
  "/ordenes-servicio": "Registro y seguimiento de órdenes de servicio.",
  "/programacion-viaje": "Asignación de viajes, unidades y conductores.",
  "/guia-transportista": "Emisión y control de guías de transportista.",
  "/documentos-facturacion": "Entrega y recepción de guías físicas para facturar.",
  "/devoluciones": "Control de contenedores por devolver.",
  "/clientes": "Directorio de clientes y datos comerciales.",
  "/conductores": "Gestión de conductores disponibles.",
  "/unidades": "Inventario y estado de unidades.",
  "/usuarios": "Usuarios, roles y accesos del sistema.",
  "/admin/empresa": "Datos tributarios y parámetros de empresa.",
  "/admin/nubefact-pruebas": "Validación de comprobantes y conexión Nubefact.",
  "/auditoria": "Historial de acciones y trazabilidad.",
};

const actionCards = [
  {
    path: "/ordenes-servicio",
    label: "Nueva orden",
    detail: "Crear una orden de servicio para iniciar la operación.",
    icon: ClipboardList,
    action: "create",
  },
  {
    path: "/programacion-viaje",
    label: "Programar viaje",
    detail: "Asignar unidad, conductor y fechas de traslado.",
    icon: MapPinned,
    action: "create",
  },
  {
    path: "/guia-transportista",
    label: "Gestionar guías",
    detail: "Revisar guías pendientes, emitidas o con error.",
    icon: FileText,
    action: "view",
  },
  {
    path: "/devoluciones",
    label: "Ver devoluciones",
    detail: "Atender contenedores próximos a vencimiento.",
    icon: RotateCcw,
    action: "view",
  },
];

const getUserName = (user) =>
  user?.name ||
  user?.nombre ||
  user?.username ||
  user?.email ||
  "Usuario";

const HomePage = () => {
  const { user } = useAuth();
  const allowedMenus = getAllowedRoutes(user);
  const modules = allowedMenus.flatMap((menu) =>
    menu.children.map((child) => ({
      ...child,
      section: menu.label,
      description: moduleDescriptions[child.path] || "Acceso autorizado.",
      Icon: iconByPath[child.path] || LayoutDashboard,
    }))
  );
  const visibleActions = actionCards.filter((action) =>
    hasAction(user, action.path, action.action)
  );
  const primaryPath = modules[0]?.path || "/profile";
  const today = new Intl.DateTimeFormat("es-PE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(new Date());

  return (
    <div className="w-full py-4">
      <div className="page-wrap">
        <header className="page-hero">
          <div className="flex flex-col gap-6 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <div className="eyebrow">Inicio</div>
              <h1 className="page-title">
                Bienvenido, {getUserName(user)}
              </h1>
              <p className="page-description">
                Punto de entrada para consultar tus módulos, revisar accesos y
                abrir las acciones operativas más usadas de Transportes J.
              </p>
            </div>
            <div className="panel w-full p-4 lg:max-w-xs">
              <p className="text-faint text-xs font-bold uppercase">
                Sesión activa
              </p>
              <p className="text-main mt-1 text-lg font-extrabold">
                {user?.role || "Usuario"}
              </p>
              <p className="text-muted mt-1 text-sm capitalize">{today}</p>
              <Link to={primaryPath} className="btn-primary mt-4 w-full">
                Abrir primer módulo
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </header>

        {visibleActions.length > 0 && (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {visibleActions.map(({ path, label, detail, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className="panel flex min-h-[132px] flex-col justify-between p-4 transition hover:border-[var(--app-primary)]"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-[var(--app-surface-muted)]">
                    <Icon className="h-5 w-5 text-[var(--app-primary)]" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-main text-sm font-extrabold">
                      {label}
                    </h2>
                    <p className="text-muted mt-1 text-xs leading-5">
                      {detail}
                    </p>
                  </div>
                </div>
                <span className="text-faint mt-3 inline-flex items-center gap-1 text-xs font-bold">
                  Acceder
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            ))}
          </section>
        )}

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="panel p-4 sm:p-5">
            <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-main text-base font-extrabold">
                  Módulos disponibles
                </h2>
                <p className="text-muted text-sm">
                  Accesos habilitados según tu rol y permisos.
                </p>
              </div>
              <span className="text-faint text-xs font-bold">
                {modules.length} módulos
              </span>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {modules.map(({ path, label, section, description, Icon }) => (
                <Link
                  key={path}
                  to={path}
                  className="info-tile group flex min-h-[118px] flex-col justify-between transition hover:border-[var(--app-primary)]"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-[var(--app-surface)]">
                      <Icon className="h-4 w-4 text-[var(--app-primary)]" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-faint text-[11px] font-bold uppercase">
                        {section}
                      </p>
                      <h3 className="text-main mt-0.5 text-sm font-extrabold">
                        {label}
                      </h3>
                    </div>
                  </div>
                  <p className="text-muted mt-3 text-xs leading-5">
                    {description}
                  </p>
                </Link>
              ))}
            </div>
          </div>

          <aside className="panel p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[var(--app-primary)]" />
              <h2 className="text-main text-base font-extrabold">
                Tu acceso
              </h2>
            </div>
            <div className="grid gap-3">
              <div className="info-tile">
                <p className="text-faint text-xs font-bold uppercase">
                  Usuario
                </p>
                <p className="text-main mt-1 break-words text-sm font-semibold">
                  {getUserName(user)}
                </p>
              </div>
              <div className="info-tile">
                <p className="text-faint text-xs font-bold uppercase">Rol</p>
                <p className="text-main mt-1 text-sm font-semibold">
                  {user?.role || "Usuario"}
                </p>
              </div>
              <div className="info-tile">
                <p className="text-faint text-xs font-bold uppercase">
                  Secciones
                </p>
                <p className="text-main mt-1 text-sm font-semibold">
                  {allowedMenus.map((menu) => menu.label).join(", ") || "-"}
                </p>
              </div>
            </div>
            <Link to="/profile" className="btn-secondary mt-4 w-full">
              Ver mi perfil
              <ArrowRight className="h-4 w-4" />
            </Link>
          </aside>
        </section>
      </div>
    </div>
  );
};

export default HomePage;
