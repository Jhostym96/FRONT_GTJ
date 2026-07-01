import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, Home, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { FaBars, FaSignInAlt, FaTimes } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { getAllowedRoutes } from "../utils/permissions";

function Sidebar({ collapsed, setCollapsed }) {
  const { isAuthenticated, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const location = useLocation();
  const rolePermissions = getAllowedRoutes(user).filter(
    (menu) => menu.id !== "perfil"
  );

  const isPathActive = (path) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  const isItemActive = (item) =>
    item.children?.length
      ? item.children.some(isItemActive)
      : isPathActive(item.path);

  const isMenuActive = (menu) =>
    menu.children?.some(isItemActive);

  useEffect(() => {
    const currentMenu = rolePermissions.find(isMenuActive);
    if (currentMenu) setActiveDropdown(currentMenu.id);
    setMobileOpen(false);
    // La ruta es la fuente de verdad para el grupo abierto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const handleMenuClick = (menuId) => {
    if (collapsed) {
      setCollapsed(false);
      setActiveDropdown(menuId);
      return;
    }

    setActiveDropdown((current) => (current === menuId ? null : menuId));
  };

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-[2px] md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Cerrar menú"
        />
      )}

      <button
        type="button"
        className="sidebar-mobile-trigger"
        onClick={() => setMobileOpen((current) => !current)}
        aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={mobileOpen}
      >
        {mobileOpen ? <FaTimes /> : <FaBars />}
      </button>

      <aside
        className={`app-sidebar ${
          collapsed ? "w-72 md:w-20" : "w-72 md:w-64"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
        aria-label="Navegación principal"
      >
        <div className={`sidebar-brand ${collapsed ? "md:justify-center md:px-2" : ""}`}>
          <Link
            to="/"
            className={`flex min-w-0 items-center ${collapsed ? "md:justify-center" : "gap-3"}`}
            aria-label="Ir al inicio"
          >
            <span className="sidebar-logo">TJ</span>
            <span className={`${collapsed ? "md:hidden" : ""} min-w-0`}>
              <span className="text-main block truncate text-sm font-extrabold">
                Transportes J
              </span>
              <span className="text-faint block truncate text-[10px] font-bold uppercase tracking-[0.14em]">
                Gestión operativa
              </span>
            </span>
          </Link>
        </div>

        <nav className={`sidebar-nav ${collapsed ? "md:px-2" : ""}`}>
          <p className={`sidebar-section-label ${collapsed ? "md:hidden" : ""}`}>
            Espacio de trabajo
          </p>

          <ul className="space-y-1">
            {isAuthenticated ? (
              <>
                <li>
                  <Link
                    to="/"
                    className={`nav-item ${collapsed ? "md:justify-center md:px-0" : ""} ${
                      location.pathname === "/" ? "nav-item-active" : ""
                    }`}
                    aria-current={location.pathname === "/" ? "page" : undefined}
                    title={collapsed ? "Inicio" : undefined}
                  >
                    <Home className="h-[18px] w-[18px] shrink-0" />
                    <span className={collapsed ? "md:hidden" : ""}>Inicio</span>
                  </Link>
                </li>

                {rolePermissions.map((menu) => {
                  const menuActive = isMenuActive(menu);
                  const isOpen = activeDropdown === menu.id;
                  const singleChild = menu.children.length === 1 && !menu.children[0].children;

                  if (singleChild) {
                    const child = menu.children[0];
                    return (
                      <li key={menu.id}>
                        <Link
                          to={child.path}
                          className={`nav-item ${collapsed ? "md:justify-center md:px-0" : ""} ${
                            menuActive ? "nav-item-active" : ""
                          }`}
                          title={collapsed ? child.label : undefined}
                          aria-current={menuActive ? "page" : undefined}
                        >
                          <menu.icon className="h-[18px] w-[18px] shrink-0" />
                          <span className={collapsed ? "md:hidden" : ""}>{menu.label}</span>
                        </Link>
                      </li>
                    );
                  }

                  return (
                    <li key={menu.id}>
                      <button
                        type="button"
                        onClick={() => handleMenuClick(menu.id)}
                        className={`nav-item ${
                          collapsed ? "md:justify-center md:px-0" : "justify-between"
                        } ${menuActive ? "nav-item-parent-active" : ""}`}
                        title={collapsed ? menu.label : undefined}
                        aria-expanded={isOpen}
                      >
                        <span className="flex min-w-0 items-center gap-3">
                          <menu.icon className="h-[18px] w-[18px] shrink-0" />
                          <span className={`${collapsed ? "md:hidden" : ""} truncate`}>
                            {menu.label}
                          </span>
                        </span>
                        <ChevronDown
                          className={`${collapsed ? "md:hidden" : ""} h-4 w-4 shrink-0 transition-transform ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {isOpen && (
                        <ul className={`${collapsed ? "md:hidden" : ""} sidebar-submenu`}>
                          {menu.children.map((child) =>
                            child.children?.length ? (
                              <li key={child.id || child.label}>
                                <div className="sidebar-submenu-heading">
                                  <child.icon className="h-4 w-4 shrink-0" />
                                  <span className="truncate">{child.label}</span>
                                </div>
                                <ul className="sidebar-submenu-nested">
                                  {child.children.map((nestedChild) => (
                                    <li key={nestedChild.path}>
                                      <Link
                                        to={nestedChild.path}
                                        className={`sidebar-submenu-item ${
                                          isPathActive(nestedChild.path)
                                            ? "sidebar-submenu-item-active"
                                            : ""
                                        }`}
                                        aria-current={
                                          isPathActive(nestedChild.path)
                                            ? "page"
                                            : undefined
                                        }
                                      >
                                        <nestedChild.icon className="h-4 w-4 shrink-0" />
                                        <span className="truncate">{nestedChild.label}</span>
                                      </Link>
                                    </li>
                                  ))}
                                </ul>
                              </li>
                            ) : (
                              <li key={child.path}>
                                <Link
                                  to={child.path}
                                  className={`sidebar-submenu-item ${
                                    isPathActive(child.path)
                                      ? "sidebar-submenu-item-active"
                                      : ""
                                  }`}
                                  aria-current={
                                    isPathActive(child.path) ? "page" : undefined
                                  }
                                >
                                  <child.icon className="h-4 w-4 shrink-0" />
                                  <span className="truncate">{child.label}</span>
                                </Link>
                              </li>
                            )
                          )}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </>
            ) : (
              <li>
                <Link to="/login" className="btn-primary w-full justify-start">
                  <FaSignInAlt />
                  <span className={collapsed ? "md:hidden" : ""}>Iniciar sesión</span>
                </Link>
              </li>
            )}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button
            type="button"
            className="sidebar-collapse-button"
            onClick={() => setCollapsed((current) => !current)}
            aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
          >
            {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
            <span className={collapsed ? "md:hidden" : ""}>Colapsar menú</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
