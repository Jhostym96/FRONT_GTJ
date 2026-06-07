import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getAllowedRoutes } from "../utils/permissions";
import { ChevronDown, Home } from "lucide-react";
import { FaBars, FaTimes, FaSignInAlt } from "react-icons/fa";

function Sidebar({ collapsed, setCollapsed }) {
  const { isAuthenticated, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const location = useLocation();

  const rolePermissions = getAllowedRoutes(user);

  const toggleDropdown = (menuId) => {
    setActiveDropdown((prev) => (prev === menuId ? null : menuId));
  };

  const isPathActive = (path) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  const isMenuActive = (menu) =>
    menu.children?.some((child) => isPathActive(child.path));

  // 👉 Nueva función: si está colapsado, auto-expande al hacer click
  const handleMenuClick = (menuId) => {
    if (collapsed) {
      setCollapsed(false); // expandir sidebar
      setActiveDropdown(menuId); // abrir el dropdown
    } else {
      toggleDropdown(menuId);
    }
  };

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-slate-950/45 backdrop-blur-[2px] md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Cerrar menú"
        />
      )}

      {/* Botón hamburguesa (solo móvil) */}
      <button
        className="btn-secondary fixed left-3 top-2.5 z-50 h-9 w-9 px-0 md:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
      >
        {mobileOpen ? <FaTimes size={22} /> : <FaBars size={22} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`app-sidebar
        ${collapsed ? "w-72 md:w-20" : "w-72 md:w-64"}
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        {/* Logo + toggle desktop */}
        <div
          className={`flex border-b ${
            collapsed
              ? "h-24 flex-col items-center justify-center gap-2 px-0"
              : "h-16 items-center justify-between px-5"
          }`}
        >
          <div
            className={`flex items-center ${
              collapsed ? "justify-center" : "gap-2"
            }`}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-sm font-black text-white">
              TJ
            </div>
            {!collapsed && (
              <Link
                to="/"
                onClick={() => setMobileOpen(false)}
                className="text-main text-base font-extrabold tracking-tight transition-colors hover:text-blue-500"
              >
                Transportes J
              </Link>
            )}
          </div>

          {/* Botón colapsar/expandir (solo desktop) */}
          <button
            className="btn-secondary hidden h-9 w-9 shrink-0 px-0 md:inline-flex"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
          >
            <FaBars size={20} />
          </button>
        </div>

        {/* Navegación */}
        <nav className={`flex-1 overflow-y-auto text-sm ${collapsed ? "px-2 py-4" : "p-3 md:p-4"}`}>
          <ul className="space-y-2">
            {isAuthenticated ? (
              <>
                <li>
                  <Link
                    to="/"
                    onClick={() => setMobileOpen(false)}
                    className={`nav-item ${collapsed ? "justify-center px-0" : ""} ${
                      location.pathname === "/" ? "nav-item-active" : ""
                    }`}
                    title="Inicio"
                  >
                    <Home className="h-5 w-5 shrink-0" />
                    {!collapsed && "Inicio"}
                  </Link>
                </li>
                {rolePermissions.map((menu) => (
                  <li key={menu.id}>
                    <button
                      onClick={() => handleMenuClick(menu.id)}
                      className={`nav-item ${
                        collapsed ? "justify-center px-0" : "justify-between"
                      }
                        ${
                          isMenuActive(menu) ? "nav-item-active" : ""
                        }`}
                    >
                      <span
                        className={`flex items-center ${
                          collapsed ? "justify-center" : "gap-3"
                        }`}
                      >
                        <menu.icon className="h-5 w-5 shrink-0" />
                        {!collapsed && menu.label}
                      </span>
                      {!collapsed && (
                        <ChevronDown
                          className={`w-4 h-4 transform transition-transform ${
                            activeDropdown === menu.id ? "rotate-180" : ""
                          }`}
                        />
                      )}
                    </button>

                    {/* Submenús */}
                    {activeDropdown === menu.id && !collapsed && (
                      <ul className="ml-6 mt-1 space-y-1 overflow-hidden transition-all">
                        {menu.children.map((child) => (
                          <li key={child.path}>
                            <Link
                              to={child.path}
                              className={`nav-item
                                ${
                                  isPathActive(child.path)
                                    ? "nav-item-active"
                                    : ""
                                }`}
                              onClick={() => setMobileOpen(false)}
                            >
                              <child.icon className="h-4 w-4" />
                              {child.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </>
            ) : (
              <li>
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="btn-primary w-full justify-start"
                >
                  <FaSignInAlt /> {!collapsed && "Login"}
                </Link>
              </li>
            )}
          </ul>
        </nav>
      </aside>
    </>
  );
}

export default Sidebar;
