import { useEffect, useState } from "react";
import { useProgramacionViaje } from "../../context/ProgramacionViajeContext";
import { getTodayInputDate } from "../../utils/date";
import { notify } from "../../utils/notify";

const ProgramacionGuiaSunatModal = ({ isOpen, onClose, programacion }) => {
  const { registrarGuiaSunatProgramacion } = useProgramacionViaje();
  const [form, setForm] = useState({
    numeroGuia: "",
    fechaEmision: getTodayInputDate(),
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setForm({
      numeroGuia: programacion?.guiaSunatNumero || "",
      fechaEmision:
        programacion?.guiaSunatFechaEmision?.slice?.(0, 10) ||
        getTodayInputDate(),
    });
  }, [isOpen, programacion]);

  if (!isOpen) return null;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const id = programacion?.id ?? programacion?._id;

    if (!id) {
      notify.error("No se encontró la programación de viaje");
      return;
    }

    try {
      setLoading(true);
      await registrarGuiaSunatProgramacion(id, {
        numeroGuia: form.numeroGuia.trim().toUpperCase(),
        fechaEmision: form.fechaEmision,
      });
      notify.success("Guía SUNAT registrada en la programación");
      onClose(true);
    } catch (error) {
      notify.error(
        error.response?.data?.message || "No se pudo registrar la guía SUNAT"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="panel w-full max-w-lg">
        <div className="flex items-start justify-between gap-3 border-b px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-400">
              Contingencia
            </p>
            <h2 className="text-main text-xl font-bold">
              Registrar guía emitida en SUNAT
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onClose(false)}
            className="btn-secondary px-3 py-2 text-sm"
          >
            X
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-5">
          <p className="text-muted text-sm">
            Este registro no aparecerá en Guías de Transportista. Solo marcará
            la programación como atendida para guía y conservará los datos para
            reportes futuros.
          </p>

          <label className="block">
            <span className="text-muted mb-2 block text-sm font-semibold">
              Número completo de guía
            </span>
            <input
              name="numeroGuia"
              value={form.numeroGuia}
              onChange={handleChange}
              className="input px-4 py-3 uppercase"
              placeholder="Ejemplo: T001-123"
              maxLength={50}
              required
            />
          </label>

          <label className="block">
            <span className="text-muted mb-2 block text-sm font-semibold">
              Fecha de emisión
            </span>
            <input
              type="date"
              name="fechaEmision"
              value={form.fechaEmision}
              onChange={handleChange}
              className="input px-4 py-3"
              required
            />
          </label>

          <div className="flex justify-end gap-3 border-t pt-4">
            <button
              type="button"
              onClick={() => onClose(false)}
              className="btn-secondary px-4 py-2"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary px-4 py-2"
            >
              {loading ? "Registrando..." : "Registrar guía SUNAT"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProgramacionGuiaSunatModal;
