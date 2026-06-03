import { useEffect, useState } from "react";
import { Building2, Save } from "lucide-react";
import { useEmpresaConfig } from "../context/EmpresaConfigContext";
import { notify } from "../utils/notify";

const initialForm = {
  ruc: "",
  razonSocial: "",
  nombreComercial: "",
  direccionFiscal: "",
  mtc: "",
  serieGuiaTransportista: "VVV1",
  activo: true,
  permitirConductorViajesActivos: false,
  permitirUnidadViajesActivos: false,
};

const toUpper = (value) => String(value || "").toUpperCase();

function EmpresaConfigPage() {
  const { config, loading, obtenerConfig, actualizarConfig } =
    useEmpresaConfig();
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    obtenerConfig().catch((error) => {
      notify.error(
        error.response?.data?.message ||
          "No se pudo cargar la configuración de empresa"
      );
    });
  }, [obtenerConfig]);

  useEffect(() => {
    if (!config) return;

    setForm({
      ruc: config.ruc || "",
      razonSocial: config.razonSocial || "",
      nombreComercial: config.nombreComercial || "",
      direccionFiscal: config.direccionFiscal || "",
      mtc: config.mtc || "",
      serieGuiaTransportista: config.serieGuiaTransportista || "VVV1",
      activo: config.activo !== false,
      permitirConductorViajesActivos:
        config.permitirConductorViajesActivos === true,
      permitirUnidadViajesActivos:
        config.permitirUnidadViajesActivos === true,
    });
  }, [config]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    const nextValue = type === "checkbox" ? checked : value;

    setForm((prev) => ({
      ...prev,
      [name]:
        name === "ruc" ? String(nextValue).replace(/\D/g, "").slice(0, 11) : nextValue,
    }));
  };

  const handleUpperChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: toUpper(value),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      await actualizarConfig({
        ...form,
        ruc: form.ruc.trim(),
        razonSocial: form.razonSocial.trim(),
        nombreComercial: form.nombreComercial.trim(),
        direccionFiscal: form.direccionFiscal.trim(),
        mtc: form.mtc.trim(),
        serieGuiaTransportista: form.serieGuiaTransportista.trim(),
      });
      notify.success("Configuración de empresa actualizada");
    } catch (error) {
      notify.error(
        error.response?.data?.message ||
          "No se pudo actualizar la configuración de empresa"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full py-4">
      <div className="page-wrap">
        <header className="page-hero">
          <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="eyebrow">Administración</div>
              <h1 className="page-title">Datos de empresa</h1>
              <p className="page-description">
                Configura los datos usados para guías de transportista y emisión electrónica.
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] text-blue-400">
              <Building2 className="h-6 w-6" />
            </div>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="panel p-5 sm:p-6">
          {loading ? (
            <div className="p-8 text-center">
              <div className="mx-auto mb-3 h-9 w-9 animate-spin rounded-full border-2 border-[var(--app-border)] border-t-blue-500" />
              <p className="text-muted text-sm">Cargando datos de empresa...</p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-muted text-xs font-semibold uppercase tracking-wide">
                    RUC
                  </span>
                  <input
                    name="ruc"
                    value={form.ruc}
                    onChange={handleChange}
                    className="input"
                    maxLength={11}
                    inputMode="numeric"
                    required
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-muted text-xs font-semibold uppercase tracking-wide">
                    Razón social
                  </span>
                  <input
                    name="razonSocial"
                    value={form.razonSocial}
                    onChange={handleUpperChange}
                    className="input"
                    required
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-muted text-xs font-semibold uppercase tracking-wide">
                    Nombre comercial
                  </span>
                  <input
                    name="nombreComercial"
                    value={form.nombreComercial}
                    onChange={handleUpperChange}
                    className="input"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-muted text-xs font-semibold uppercase tracking-wide">
                    MTC
                  </span>
                  <input
                    name="mtc"
                    value={form.mtc}
                    onChange={handleUpperChange}
                    className="input"
                    maxLength={20}
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-muted text-xs font-semibold uppercase tracking-wide">
                    Serie guía transportista
                  </span>
                  <input
                    name="serieGuiaTransportista"
                    value={form.serieGuiaTransportista}
                    onChange={handleUpperChange}
                    className="input"
                    maxLength={4}
                    required
                  />
                </label>

                <label className="flex items-center gap-3 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3">
                  <input
                    type="checkbox"
                    name="activo"
                    checked={form.activo}
                    onChange={handleChange}
                    className="h-4 w-4"
                  />
                  <span className="text-main text-sm font-semibold">
                    Configuración activa
                  </span>
                </label>

                <label className="flex items-center gap-3 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3">
                  <input
                    type="checkbox"
                    name="permitirConductorViajesActivos"
                    checked={form.permitirConductorViajesActivos}
                    onChange={handleChange}
                    className="h-4 w-4"
                  />
                  <span className="text-main text-sm font-semibold">
                    Permitir conductor con viaje activo
                  </span>
                </label>

                <label className="flex items-center gap-3 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3">
                  <input
                    type="checkbox"
                    name="permitirUnidadViajesActivos"
                    checked={form.permitirUnidadViajesActivos}
                    onChange={handleChange}
                    className="h-4 w-4"
                  />
                  <span className="text-main text-sm font-semibold">
                    Permitir unidad con viaje activo
                  </span>
                </label>
              </div>

              <label className="mt-4 block space-y-1">
                <span className="text-muted text-xs font-semibold uppercase tracking-wide">
                  Dirección fiscal
                </span>
                <textarea
                  name="direccionFiscal"
                  value={form.direccionFiscal}
                  onChange={handleUpperChange}
                  className="input min-h-[96px]"
                />
              </label>

              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary gap-2 px-4 py-2"
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}

export default EmpresaConfigPage;
