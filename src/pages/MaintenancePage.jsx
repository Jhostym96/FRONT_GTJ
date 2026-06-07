import { HardHat, LogOut, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function MaintenancePage() {
  const { logout } = useAuth();

  return (
    <section className="app-shell flex min-h-screen items-center justify-center px-4 py-10">
      <div className="panel w-full max-w-xl p-6 text-center sm:p-8">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300">
          <HardHat className="h-9 w-9" />
        </div>

        <div className="eyebrow">Sistema en mantenimiento</div>
        <h1 className="page-title mt-2">Estamos realizando mejoras</h1>

        <p className="page-description mx-auto mt-3">
          El acceso está temporalmente restringido mientras se realizan cambios
          técnicos, migraciones o ajustes mayores. Intenta nuevamente más tarde.
        </p>

        <div className="mt-6 grid gap-3 text-left sm:grid-cols-2">
          <div className="info-tile">
            <p className="text-faint text-xs font-bold uppercase">Estado</p>
            <p className="text-main mt-1 font-semibold">Mantenimiento activo</p>
          </div>
          <div className="info-tile">
            <p className="text-faint text-xs font-bold uppercase">Acceso</p>
            <p className="text-main mt-1 font-semibold">Solo administradores</p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button type="button" onClick={logout} className="btn-secondary px-4 py-2">
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
          <div className="inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-[var(--app-muted)]">
            <ShieldCheck className="h-4 w-4" />
            Transportes J EIRL
          </div>
        </div>
      </div>
    </section>
  );
}
