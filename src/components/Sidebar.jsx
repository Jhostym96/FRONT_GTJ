import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { permissions } from "../utils/permissions";
import { ChevronDown } from "lucide-react";
import { FaBars, FaTimes, FaSignInAlt } from "react-icons/fa";

function Sidebar({ collapsed, setCollapsed }) {
  const { isAuthenticated, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const location = useLocation();

  const role = user?.role;
  const rolePermissions = permissions[role]?.routes || [];

  const toggleDropdown = (menuId) => {
    setActiveDropdown((prev) => (prev === menuId ? null : menuId));
  };

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
      {/* Botón hamburguesa (solo móvil) */}
      <button
        className="btn-secondary fixed left-4 top-3 z-50 h-9 w-9 px-0 md:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
      >
        {mobileOpen ? <FaTimes size={22} /> : <FaBars size={22} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`app-sidebar
        ${collapsed ? "w-20" : "w-64"}
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        {/* Logo + toggle desktop */}
        <div className="flex h-16 items-center justify-between border-b px-5">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-sm font-black text-white">
              TJ
            </div>
            {!collapsed && (
              <Link
                to="/"
                onClick={() => setMobileOpen(false)}
                className="text-main text-lg font-bold tracking-tight transition-colors hover:text-blue-500"
              >
                
              </Link>
            )}
          </div>

          {/* Botón colapsar/expandir (solo desktop) */}
          <button
            className="btn-secondary hidden h-9 w-9 px-0 md:inline-flex"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
          >
            <FaBars size={20} />
          </button>
        </div>

        {/* Navegación */}
        <nav className="flex-1 p-4 text-sm">
          <ul className="space-y-2">
            {isAuthenticated ? (
              rolePermissions.map((menu) => (
                <li key={menu.id}>
                  <button
                    onClick={() => handleMenuClick(menu.id)}
                    className={`nav-item justify-between
                      ${
                        location.pathname.startsWith(menu.basePath)
                          ? "nav-item-active"
                          : ""
                      }`}
                  >
                    <span className="flex items-center gap-3">
                      <menu.icon className="h-5 w-5" />
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
                                location.pathname === child.path
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
              ))
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
