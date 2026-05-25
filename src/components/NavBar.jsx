import { FaUserCircle, FaSignOutAlt } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Moon, Sun } from "lucide-react";

function Navbar({ collapsed }) {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const displayName = user?.name || user?.email || "Invitado";

  return (
    <header
      className={`fixed top-0 right-0 left-0
        ${collapsed ? "md:left-20" : "md:left-64"}
        app-navbar h-14 flex items-center justify-between px-4 shadow-sm z-30 sm:px-6`}
    >
      <h2 className="text-main hidden text-sm font-semibold tracking-wide sm:block">
        TRANSPORTES J EIRL
      </h2>

      {/* Usuario + Logout */}
      <div className="ml-auto flex items-center gap-3">
        <button
          type="button"
          onClick={toggleTheme}
          className="btn-secondary h-9 w-9 px-0"
          title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
        >
          {isDark ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        <div className="flex min-w-0 items-center gap-2">
          <FaUserCircle className="text-main text-xl" />
          <div className="hidden min-w-0 flex-col items-center sm:flex">
            <span className="text-main max-w-[180px] truncate text-center text-sm font-semibold leading-4 lg:max-w-[260px]">
              {displayName}
            </span>
            <span className="text-faint max-w-[180px] truncate text-center text-[11px] leading-4 lg:max-w-[260px]">
              {user?.role || "Invitado"}
            </span>
          </div>
        </div>

        <button
          onClick={logout}
          className="btn-danger h-9 px-3 text-xs"
          title="Cerrar sesión"
          aria-label="Cerrar sesión"
        >
          <FaSignOutAlt />
        </button>
      </div>
    </header>
  );
}

export default Navbar;
