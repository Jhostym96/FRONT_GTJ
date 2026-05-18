import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <section className="app-shell flex min-h-screen flex-col items-center justify-center px-4 py-10 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 text-red-300 shadow-lg shadow-red-900/20">
        <ShieldAlert size={40} />
      </div>

      <h1 className="page-title mb-3 text-red-300">
        Acceso denegado
      </h1>

      <p className="page-description mx-auto mb-8 max-w-md">
        No tienes permisos para acceder a esta página.
        Si crees que se trata de un error, comunícate con el administrador.
      </p>

      <Link
        to="/"
        className="btn-primary px-6 py-3"
      >
        Volver al inicio
      </Link>

      <p className="text-faint mt-14 text-xs">
        © {new Date().getFullYear()} TRANSPORTES J EIRL. Todos los derechos reservados.
      </p>
    </section>
  );
}
