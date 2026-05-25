import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import TablePagination from "../components/TablePagination";
import { useAuditoria } from "../context/AuditoriaContext";

const ENTIDADES = [
  "GuiaTransportista",
  "OrdenServicio",
  "ProgramacionViaje",
  "Cliente",
  "Unidad",
  "Conductor",
  "User",
];

const formatDateTime = (value) => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const AuditoriaPage = () => {
  const {
    auditoria,
    paginationAuditoria,
    loadingAuditoria,
    errorsAuditoria,
    obtenerAuditoria,
  } = useAuditoria();
  const [filters, setFilters] = useState({
    search: "",
    entidad: "",
    accion: "",
  });

  useEffect(() => {
    obtenerAuditoria({ page: 1, limit: 10 });
  }, [obtenerAuditoria]);

  const cargarAuditoria = (page = paginationAuditoria.page) => {
    obtenerAuditoria({
      page,
      limit: paginationAuditoria.limit,
      ...filters,
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    cargarAuditoria(1);
  };

  return (
    <div className="w-full py-4">
      <div className="page-wrap">
        <header className="page-hero">
          <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="eyebrow">Control interno</div>
              <h1 className="page-title">Auditoría del sistema</h1>
              <p className="page-description">
                Revisa acciones registradas, intentos operativos y cambios
                importantes realizados por usuarios.
              </p>
            </div>
          </div>
        </header>

        <form
          onSubmit={handleSubmit}
          className="panel grid gap-3 p-4 md:grid-cols-[1fr_220px_180px_auto]"
        >
          <label className="relative">
            <Search className="text-faint pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            <input
              value={filters.search}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, search: event.target.value }))
              }
              className="input w-full pl-9"
              placeholder="Buscar por descripción, usuario, entidad..."
            />
          </label>

          <select
            value={filters.entidad}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, entidad: event.target.value }))
            }
            className="input"
          >
            <option value="">Todas las entidades</option>
            {ENTIDADES.map((entidad) => (
              <option key={entidad} value={entidad}>
                {entidad}
              </option>
            ))}
          </select>

          <input
            value={filters.accion}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, accion: event.target.value }))
            }
            className="input"
            placeholder="Acción"
          />

          <button type="submit" className="btn-primary px-4">
            Filtrar
          </button>
        </form>

        {errorsAuditoria.length > 0 && (
          <div className="panel border-red-500/30 p-4">
            {errorsAuditoria.map((error) => (
              <p key={error} className="text-sm text-red-400">
                {error}
              </p>
            ))}
          </div>
        )}

        {loadingAuditoria ? (
          <div className="panel p-8 text-center">
            <div className="mx-auto mb-3 h-9 w-9 animate-spin rounded-full border-2 border-[var(--app-border)] border-t-blue-500" />
            <p className="text-muted text-sm">Cargando auditoría...</p>
          </div>
        ) : auditoria.length === 0 ? (
          <div className="empty-panel">
            <h2 className="text-main text-lg font-semibold">
              No hay registros de auditoría
            </h2>
            <p className="text-muted mt-1 text-sm">
              Cuando se registren acciones del sistema aparecerán aquí.
            </p>
          </div>
        ) : (
          <>
            <div className="data-table-wrap">
              <div className="table-scroll">
                <table className="data-table w-full min-w-[1100px] text-sm">
                  <thead>
                    <tr>
                      <th className="px-4 py-4 text-left">Fecha</th>
                      <th className="px-4 py-4 text-left">Usuario</th>
                      <th className="px-4 py-4 text-left">Entidad</th>
                      <th className="px-4 py-4 text-left">Acción</th>
                      <th className="px-4 py-4 text-left">Descripción</th>
                      <th className="px-4 py-4 text-left">Origen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditoria.map((item) => (
                      <tr key={item.id}>
                        <td className="text-muted whitespace-nowrap px-4 py-4">
                          {formatDateTime(item.createdAt)}
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-main font-semibold">
                            {item.usuario?.name || "Sistema"}
                          </p>
                          <p className="text-faint text-xs">
                            {item.usuario?.role || "-"}
                          </p>
                        </td>
                        <td className="text-muted px-4 py-4">
                          {item.entidad}
                          {item.entidadId ? ` #${item.entidadId}` : ""}
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-flex rounded-full border px-3 py-1 text-[11px] font-bold">
                            {item.accion}
                          </span>
                        </td>
                        <td className="text-muted min-w-[320px] px-4 py-4">
                          {item.descripcion || "-"}
                        </td>
                        <td className="text-faint px-4 py-4 text-xs">
                          <p>{item.ip || "-"}</p>
                          <p className="max-w-[240px] truncate">
                            {item.userAgent || ""}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <TablePagination
              page={paginationAuditoria.page}
              totalPages={paginationAuditoria.totalPages}
              total={paginationAuditoria.total}
              limit={paginationAuditoria.limit}
              onPageChange={cargarAuditoria}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default AuditoriaPage;
