import { Link } from "react-router-dom";

export default function UnauthorizedPage() {
  return (
    <section className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-950 text-white px-4">
      {/* Icono grande con fondo */}
      <div className="w-24 h-24 flex items-center justify-center rounded-full bg-gradient-to-br from-red-600 to-red-800 shadow-lg shadow-red-900/40 mb-6 animate-pulse">
        <span className="text-5xl">🚫</span>
      </div>

      {/* Mensaje principal */}
      <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent drop-shadow-lg">
        Acceso denegado
      </h1>

      {/* Subtexto */}
      <p className="text-gray-400 text-center max-w-md mb-10 leading-relaxed">
        No tienes permisos para acceder a esta página.  
        Si crees que se trata de un error, comunícate con el administrador.
      </p>

      {/* Botón de regreso */}
      <Link
        to="/"
        className="px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-semibold shadow-lg hover:shadow-indigo-600/40 hover:scale-105 transition-all duration-300"
      >
        ⬅️ Volver al inicio
      </Link>

      {/* Footer */}
      <p className="text-gray-600 text-xs mt-16 tracking-wide">
        © {new Date().getFullYear()} TRANSPORTES J EIRL. Todos los derechos reservados.
      </p>
    </section>
  );
}
