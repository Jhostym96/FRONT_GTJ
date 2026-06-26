import { useMemo, useState } from "react";
import {
  CalendarDays,
  Download,
  FileSpreadsheet,
  LoaderCircle,
} from "lucide-react";
import { obtenerReporteServiciosRequest } from "../api/reportes";
import { formatDateOnly } from "../utils/date";
import { notify } from "../utils/notify";

const getDefaultDateRange = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  const date = `${year}-${month}-${day}`;

  return { fechaInicio: date, fechaFin: date };
};

const downloadExcel = (blob, filters) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `reporte-servicios-${filters.fechaInicio}-${filters.fechaFin}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const ReportesPage = () => {
  const defaultRange = useMemo(() => getDefaultDateRange(), []);
  const [filters, setFilters] = useState(defaultRange);
  const [loading, setLoading] = useState(false);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const descargarReporte = async (event) => {
    event.preventDefault();

    if (!filters.fechaInicio || !filters.fechaFin) {
      notify.error("Selecciona el rango de fechas");
      return;
    }

    if (filters.fechaInicio > filters.fechaFin) {
      notify.error("La fecha inicial no puede ser mayor que la fecha final");
      return;
    }

    try {
      setLoading(true);
      const response = await obtenerReporteServiciosRequest(filters);
      downloadExcel(response.data, filters);
      notify.success(
        `Reporte del ${formatDateOnly(filters.fechaInicio)} al ${formatDateOnly(
          filters.fechaFin
        )} descargado`
      );
    } catch (error) {
      console.error("Error al descargar reporte de servicios:", error);
      notify.error(
        error.response?.data?.message ||
          "No se pudo descargar el reporte de servicios"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-wrap">
        <header className="page-hero">
          <div className="page-hero-content">
            <div>
              <div className="eyebrow">Análisis operativo</div>
              <h1 className="page-title">Reportes</h1>
              <p className="page-description">
                Descarga el detalle completo de servicios en formato Excel.
              </p>
            </div>
          </div>
        </header>

        <form onSubmit={descargarReporte} className="panel p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-300">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-main text-base font-semibold">
                Detalle de servicios
              </h2>
              <p className="text-muted text-sm">
                Selecciona el rango de fechas y descarga el archivo.
              </p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
            {[
              ["fechaInicio", "Fecha desde"],
              ["fechaFin", "Fecha hasta"],
            ].map(([name, label]) => (
              <label key={name} className="block">
                <span className="text-faint mb-2 flex items-center gap-2 text-xs font-semibold uppercase">
                  <CalendarDays className="h-4 w-4" />
                  {label}
                </span>
                <input
                  type="date"
                  name={name}
                  value={filters[name]}
                  onChange={handleFilterChange}
                  className="input"
                />
              </label>
            ))}

            <button
              type="submit"
              className="btn-primary px-4 py-2"
              disabled={loading}
            >
              {loading ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Descargar Excel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportesPage;
