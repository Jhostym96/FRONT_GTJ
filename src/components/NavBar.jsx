import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Check,
  ChevronDown,
  ChevronRight,
  LogOut,
  Moon,
  Search,
  Sun,
  UserRound,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { getAllowedRoutes } from "../utils/permissions";
import { Tooltip } from "./ui/Accessibility";

const normalizeText = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

function Navbar({ collapsed }) {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const searchInputRef = useRef(null);
  const userMenuRef = useRef(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const displayName = user?.name || user?.nombre || user?.email || "Usuario";
  const allowedMenus = getAllowedRoutes(user);

  const modules = useMemo(
    () =>
      allowedMenus.flatMap((menu) =>
        menu.children.map((child) => ({
          ...child,
          section: menu.label,
        }))
      ),
    [allowedMenus]
  );

  const currentModule = modules.find(
    (module) =>
      location.pathname === module.path ||
      location.pathname.startsWith(`${module.path}/`)
  );

  const filteredModules = useMemo(() => {
    const normalizedQuery = normalizeText(query);
    if (!normalizedQuery) return modules.slice(0, 8);

    return modules
      .filter((module) =>
        normalizeText(`${module.section} ${module.label}`).includes(normalizedQuery)
      )
      .slice(0, 10);
  }, [modules, query]);

  useEffect(() => {
    const handleKeyboard = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }

      if (event.key === "Escape") {
        setSearchOpen(false);
        setUserMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
  }, []);

  useEffect(() => {
    if (!searchOpen) {
      setQuery("");
      return;
    }

    window.requestAnimationFrame(() => searchInputRef.current?.focus());
  }, [searchOpen]);

  useEffect(() => {
    const closeUserMenu = (event) => {
      if (!userMenuRef.current?.contains(event.target)) setUserMenuOpen(false);
    };

    document.addEventListener("mousedown", closeUserMenu);
    return () => document.removeEventListener("mousedown", closeUserMenu);
  }, []);

  const openModule = (path) => {
    navigate(path);
    setSearchOpen(false);
  };

  return (
    <>
      <header
        className={`app-navbar ${collapsed ? "md:left-20" : "md:left-64"}`}
      >
        <div className="min-w-0">
          <div className="hidden items-center gap-1 text-xs sm:flex">
            <Link to="/" className="text-faint transition hover:text-[var(--app-primary)]">
              Inicio
            </Link>
            {currentModule && (
              <>
                <ChevronRight className="text-faint h-3.5 w-3.5" />
                <span className="text-faint">{currentModule.section}</span>
              </>
            )}
          </div>
          <p className="text-main truncate text-sm font-extrabold sm:mt-0.5">
            {currentModule?.label || (location.pathname === "/" ? "Inicio" : "Transportes J")}
          </p>
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="navbar-search-trigger"
            aria-label="Buscar módulos"
          >
            <Search className="h-4 w-4" />
            <span className="hidden lg:inline">Buscar módulo</span>
            <kbd className="hidden xl:inline-flex">Ctrl K</kbd>
          </button>

          <Tooltip
            label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          >
            {(tooltipProps) => (
              <button
                type="button"
                onClick={toggleTheme}
                className="navbar-icon-button"
                aria-label={
                  isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"
                }
                {...tooltipProps}
              >
                {isDark ? <Sun /> : <Moon />}
              </button>
            )}
          </Tooltip>

          <div ref={userMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setUserMenuOpen((current) => !current)}
              className="navbar-user-button"
              aria-expanded={userMenuOpen}
              aria-haspopup="menu"
            >
              <span className="navbar-avatar">
                {displayName.charAt(0).toUpperCase()}
              </span>
              <span className="hidden min-w-0 text-left md:block">
                <span className="text-main block max-w-40 truncate text-xs font-bold">
                  {displayName}
                </span>
                <span className="text-faint block max-w-40 truncate text-[10px]">
                  {user?.role || "Usuario"}
                </span>
              </span>
              <ChevronDown className="text-faint hidden h-4 w-4 md:block" />
            </button>

            {userMenuOpen && (
              <div className="navbar-user-menu" role="menu">
                <div className="border-b px-3 py-3">
                  <p className="text-main truncate text-sm font-bold">{displayName}</p>
                  <p className="text-muted mt-0.5 truncate text-xs">{user?.email || user?.role}</p>
                </div>
                <div className="p-1.5">
                  <Link
                    to="/profile"
                    onClick={() => setUserMenuOpen(false)}
                    className="navbar-menu-item"
                    role="menuitem"
                  >
                    <UserRound />
                    Mi perfil
                  </Link>
                  <button
                    type="button"
                    onClick={logout}
                    className="navbar-menu-item navbar-menu-item-danger"
                    role="menuitem"
                  >
                    <LogOut />
                    Cerrar sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {searchOpen && (
        <div
          className="command-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="Buscar módulos"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSearchOpen(false);
          }}
        >
          <div className="command-panel">
            <div className="command-input-wrap">
              <Search className="text-faint h-5 w-5 shrink-0" />
              <input
                ref={searchInputRef}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar clientes, viajes, facturación..."
                aria-label="Buscar módulos disponibles"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="navbar-icon-button h-8 w-8 min-w-8"
                aria-label="Cerrar búsqueda"
              >
                <X />
              </button>
            </div>

            <div className="command-results">
              <p className="command-section-label">
                {query ? "Resultados" : "Módulos disponibles"}
              </p>
              {filteredModules.length > 0 ? (
                filteredModules.map((module) => (
                  <button
                    type="button"
                    key={module.path}
                    onClick={() => openModule(module.path)}
                    className="command-result"
                  >
                    <span className="command-result-icon">
                      <module.icon />
                    </span>
                    <span className="min-w-0 flex-1 text-left">
                      <span className="text-main block truncate text-sm font-bold">
                        {module.label}
                      </span>
                      <span className="text-faint block truncate text-xs">
                        {module.section}
                      </span>
                    </span>
                    {location.pathname === module.path ? (
                      <Check className="h-4 w-4 text-[var(--app-success)]" />
                    ) : (
                      <ChevronRight className="text-faint h-4 w-4" />
                    )}
                  </button>
                ))
              ) : (
                <div className="px-4 py-10 text-center">
                  <p className="text-main text-sm font-bold">Sin resultados</p>
                  <p className="text-muted mt-1 text-xs">
                    Prueba con el nombre de otro módulo.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;
