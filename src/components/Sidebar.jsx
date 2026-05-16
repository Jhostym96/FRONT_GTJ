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
        className="md:hidden fixed top-4 left-4 z-50 text-white"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <FaTimes size={22} /> : <FaBars size={22} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 bg-zinc-900/95 backdrop-blur-md 
        border-r border-zinc-800 shadow-lg transition-all duration-300
        ${collapsed ? "w-20" : "w-64"}
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        {/* Logo + toggle desktop */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            {!collapsed && (
              <Link
                to="/"
                onClick={() => setMobileOpen(false)}
                className="text-xl font-bold text-white tracking-tight hover:text-indigo-400 transition-colors"
              >
                TRANSPORTES J
              </Link>
            )}
          </div>

          {/* Botón colapsar/expandir (solo desktop) */}
          <button
            className="hidden md:block text-gray-300 hover:text-white"
            onClick={() => setCollapsed(!collapsed)}
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
                    className={`flex items-center justify-between w-full px-3 py-2 rounded-md transition-colors text-sm
                      ${
                        location.pathname.startsWith(menu.basePath)
                          ? "bg-indigo-600 text-white"
                          : "text-gray-300 hover:bg-zinc-800 hover:text-white"
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
                            className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm
                              ${
                                location.pathname === child.path
                                  ? "bg-indigo-600 text-white"
                                  : "text-gray-300 hover:bg-zinc-800 hover:text-white"
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
                  className="flex items-center gap-3 px-3 py-2 text-white bg-indigo-600 hover:bg-indigo-500 rounded-md transition-colors shadow-md"
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
