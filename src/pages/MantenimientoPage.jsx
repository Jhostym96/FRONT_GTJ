import { AlertTriangle, HardHat, Lock, Power, PowerOff } from "lucide-react";
import { useState } from "react";
import { useMaintenance } from "../context/MaintenanceContext";
import { notify } from "../utils/notify";

export default function MantenimientoPage() {
  const { enabled, forcedByEnv, loading, refresh, setEnabled } = useMaintenance();
  const [saving, setSaving] = useState(false);

  const handleToggle = async () => {
    if (forcedByEnv) {
      notify.info("El modo mantenimiento está forzado por configuración del entorno.");
      return;
    }

    try {
      setSaving(true);
      await setEnabled(!enabled);
      notify.success(
        !enabled
          ? "Modo mantenimiento activado"
          : "Modo mantenimiento desactivado"
      );
      await refresh({ silent: true });
    } catch (error) {
      notify.error(
        error.response?.data?.message || "No se pudo actualizar el modo mantenimiento"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <div className="page-wrap">
        <header className="page-hero">
          <div className="page-hero-content">
            <div>
              <div className="eyebrow">Administración</div>
              <h1 className="page-title">Modo mantenimiento</h1>
              <p className="page-description">
                Bloquea temporalmente el acceso de usuarios normales durante
                migraciones, despliegues o cambios grandes.
              </p>
            </div>

            <div
              className={`inline-flex min-h-10 items-center justify-center rounded-md border px-4 py-2 text-xs font-extrabold uppercase ${
                enabled
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                  : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              }`}
            >
              {enabled ? "Activo" : "Inactivo"}
            </div>
          </div>
        </header>

        <section className="panel p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-[var(--app-border)] bg-[var(--app-surface-muted)] text-amber-300">
                <HardHat className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <h2 className="text-main text-base font-extrabold">
                  Acceso restringido para operación normal
                </h2>
                <p className="text-muted mt-1 text-sm">
                  Cuando está activo, solo los roles Administrador y
                  Superadministrador pueden ingresar a la aplicación.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggle}
              disabled={forcedByEnv || loading || saving}
              className={enabled ? "btn-danger px-4 py-2" : "btn-primary px-4 py-2"}
            >
              {enabled ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
              {saving ? "Guardando..." : enabled ? "Desactivar" : "Activar"}
            </button>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="info-tile">
              <p className="text-faint text-xs font-bold uppercase">Usuarios normales</p>
              <p className="text-main mt-1 font-semibold">Pantalla de mantenimiento</p>
            </div>
            <div className="info-tile">
              <p className="text-faint text-xs font-bold uppercase">Administradores</p>
              <p className="text-main mt-1 font-semibold">Acceso permitido</p>
            </div>
            <div className="info-tile">
              <p className="text-faint text-xs font-bold uppercase">Origen</p>
              <p className="text-main mt-1 font-semibold">
                {forcedByEnv ? "Variable de entorno" : "Backend"}
              </p>
            </div>
          </div>
        </section>

        {forcedByEnv && (
          <section className="alert-panel flex gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <p>
              El modo está forzado por `VITE_MAINTENANCE_MODE=true`. Para
              desactivarlo debes cambiar la variable de entorno y volver a
              desplegar el frontend.
            </p>
          </section>
        )}

        <section className="panel p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <Lock className="mt-0.5 h-5 w-5 shrink-0 text-[var(--app-primary)]" />
            <div>
              <h2 className="text-main text-sm font-extrabold">Nota técnica</h2>
              <p className="text-muted mt-1 text-sm">
                Este control se guarda en la configuración global del backend.
                Los usuarios normales serán bloqueados al iniciar sesión, al
                cambiar de ruta o en el siguiente refresco automático del estado.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
