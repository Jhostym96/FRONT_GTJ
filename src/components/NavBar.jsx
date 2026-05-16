import { FaUserCircle, FaSignOutAlt } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

function Navbar({ collapsed }) {
  const { user, logout } = useAuth();

  return (
    <header
      className={`fixed top-0 right-0 left-0
        ${collapsed ? "md:left-20" : "md:left-64"}
        h-12 bg-zinc-800/90 backdrop-blur-md border-b border-zinc-700
        flex items-center justify-between px-6 shadow-md z-30`}
    >
      {/* 👇 Puedes poner un título o dejar vacío */}
      <h2 className="text-white font-semibold text-sm tracking-wide">
      </h2>

      {/* Usuario + Logout */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <FaUserCircle className="text-white text-xl" />
          <span className="text-gray-300 text-sm hidden sm:block">
            {user?.role || "Invitado"}
          </span>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded-md text-xs font-medium transition-colors"
        >
          <FaSignOutAlt />
        </button>
      </div>
    </header>
  );
}

export default Navbar;
