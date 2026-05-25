import { useCallback, useEffect, useRef, useState } from "react";
import { Eye, Pencil, Trash2, Wrench } from "lucide-react";
import MantenimientoModal from "../components/modals/MantenimientoModal";
import TablePagination from "../components/TablePagination";
import { useConfirm } from "../context/ConfirmContext";
import { useAlmacen } from "../context/AlmacenContext";
import { useMantenimientos } from "../context/MantenimientoContext";
import { useMaquinarias } from "../context/MaquinariaContext";
import { useUnidades } from "../context/UnidadContext";
import { getRecordId } from "../utils/apiData";
import { formatDateOnly } from "../utils/date";
import { notify } from "../utils/notify";

const estadoStyles = {
  PROGRAMADO: "border-blue-500/30 bg-blue-500/10 text-blue-300",
  EN_PROCESO: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  FINALIZADO: "border-green-500/30 bg-green-500/10 text-green-300",
  CANCELADO: "border-red-500/30 bg-red-500/10 text-red-300",
};

const tipoStyles = {
  PREVENTIVO: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  CORRECTIVO: "border-red-500/30 bg-red-500/10 text-red-300",
  INSPECCION: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
  CAMBIO_FLUIDO: "border-blue-500/30 bg-blue-500/10 text-blue-300",
  CAMBIO_PIEZA: "border-violet-500/30 bg-violet-500/10 text-violet-300",
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(Number(value || 0));

const formatNumber = (value) => {
  const number = Number(value || 0);
  return Number.isInteger(number) ? String(number) : number.toFixed(2);
};

function Badge({ children, className = "" }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-bold ${className}`}>
      {children}
    </span>
  );
}

const getEquipoLabel = (mantenimiento) => {
  if (mantenimiento.tipoEquipo === "UNIDAD") {
    return mantenimiento.unidad?.placa || "-";
  }

  return mantenimiento.maquinaria
    ? `${mantenimiento.maquinaria.codigo} - ${mantenimiento.maquinaria.nombre}`
    : "-";
};

function MantenimientoPage() {
  const {
    mantenimientos = [],
    paginationMantenimientos,
    alertasMantenimiento,
    resumenAlertas,
    obtenerMantenimientos,
    obtenerAlertasMantenimiento,
    crearMantenimiento,
    actualizarMantenimiento,
    eliminarMantenimiento,
  } = useMantenimientos();
  const { unidades = [], obtenerUnidades } = useUnidades();
  const { maquinarias = [], obtenerMaquinarias } = useMaquinarias();
  const { items: itemsAlmacen = [], obtenerItems } = useAlmacen();
  const confirm = useConfirm();

  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState("create");
  const [mantenimientoSeleccionado, setMantenimientoSeleccionado] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [filtros, setFiltros] = useState({
    search: "",
    estado: "",
    tipoEquipo: "",
  });
  const filtrosRef = useRef(filtros);

  const cargarMantenimientos = useCallback(async (page = 1, nextFiltros) => {
    try {
      setLoading(true);
      await obtenerMantenimientos({
        page,
        limit: paginationMantenimientos.limit,
        ...(nextFiltros ?? filtrosRef.current),
      });
    } finally {
      setLoading(false);
    }
  }, [obtenerMantenimientos, paginationMantenimientos.limit]);

  useEffect(() => {
    cargarMantenimientos(1);
    obtenerAlertasMantenimiento?.();
    obtenerUnidades?.({ page: 1, limit: 200 });
    obtenerMaquinarias?.({ page: 1, limit: 200 });
    obtenerItems?.({ page: 1, limit: 500, estado: "ACTIVO" });
  }, [
    cargarMantenimientos,
    obtenerAlertasMantenimiento,
    obtenerItems,
    obtenerMaquinarias,
    obtenerUnidades,
  ]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const normalizedSearch = searchInput.trim();
      if (filtrosRef.current.search === normalizedSearch) return;

      const nextFiltros = { ...filtrosRef.current, search: normalizedSearch };
      filtrosRef.current = nextFiltros;
      setFiltros(nextFiltros);
      cargarMantenimientos(1, nextFiltros);
    }, 450);

    return () => window.clearTimeout(timer);
  }, [cargarMantenimientos, searchInput]);

  const abrirCrear = () => {
    setMode("create");
    setMantenimientoSeleccionado(null);
    setModalOpen(true);
  };

  const abrirEditar = (mantenimiento) => {
    setMode("edit");
    setMantenimientoSeleccionado(mantenimiento);
    setModalOpen(true);
  };

  const abrirVer = (mantenimiento) => {
    setMode("view");
    setMantenimientoSeleccionado(mantenimiento);
    setModalOpen(true);
  };

  const cerrarModal = () => {
    setModalOpen(false);
    setMantenimientoSeleccionado(null);
  };

  const handleFiltroChange = (event) => {
    const { name, value } = event.target;
    if (name === "search") {
      setSearchInput(value);
      return;
    }

    const nextFiltros = { ...filtros, [name]: value };
    filtrosRef.current = nextFiltros;
    setFiltros(nextFiltros);
    cargarMantenimientos(1, nextFiltros);
  };

  const handleSubmit = async (data) => {
    const id = getRecordId(mantenimientoSeleccionado);

    if (mode === "edit" && id) {
      await actualizarMantenimiento(id, data);
      notify.success("Mantenimiento actualizado correctamente");
    } else {
      await crearMantenimiento(data);
      notify.success("Mantenimiento registrado correctamente");
    }

    cerrarModal();
    await cargarMantenimientos(paginationMantenimientos.page);
    await obtenerAlertasMantenimiento?.();
    await obtenerUnidades?.({ page: 1, limit: 200 });
    await obtenerMaquinarias?.({ page: 1, limit: 200 });
  };

  const handleEliminar = async (mantenimiento) => {
    const confirmar = await confirm({
      title: "Eliminar mantenimiento",
      message: `¿Seguro que deseas eliminar ${mantenimiento.numeroOrden}?`,
      confirmText: "Eliminar",
      variant: "danger",
    });

    if (!confirmar) return;

    try {
      await eliminarMantenimiento(getRecordId(mantenimiento));
      notify.success("Mantenimiento eliminado correctamente");
      await cargarMantenimientos(paginationMantenimientos.page);
      await obtenerAlertasMantenimiento?.();
    } catch (error) {
      notify.error(
        error.response?.data?.message || "Error al eliminar mantenimiento"
      );
    }
  };

  return (
    <div className="w-full py-4">
      <div className="page-wrap">
        <header className="page-hero">
          <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="eyebrow">Control técnico</div>
              <h1 className="page-title">Mantenimiento</h1>
              <p className="page-description">
                Programa y registra intervenciones preventivas, correctivas,
                inspecciones y cambios sobre unidades o maquinarias.
              </p>
            </div>

            <button
              type="button"
              onClick={abrirCrear}
              className="btn-primary px-3 py-2"
            >
              Nueva orden
            </button>
          </div>
        </header>

        <section className="panel p-4">
          <div className="grid gap-3 md:grid-cols-[1.5fr_1fr_1fr]">
            <input
              name="search"
              value={searchInput}
              onChange={handleFiltroChange}
              className="input p-3"
              placeholder="Buscar por orden, responsable, equipo o trabajo"
            />
            <select
              name="estado"
              value={filtros.estado}
              onChange={handleFiltroChange}
              className="input p-3"
            >
              <option value="">Todos los estados</option>
              <option value="PROGRAMADO">Programado</option>
              <option value="EN_PROCESO">En proceso</option>
              <option value="FINALIZADO">Finalizado</option>
              <option value="CANCELADO">Cancelado</option>
            </select>
            <select
              name="tipoEquipo"
              value={filtros.tipoEquipo}
              onChange={handleFiltroChange}
              className="input p-3"
            >
              <option value="">Todos los equipos</option>
              <option value="UNIDAD">Unidades</option>
              <option value="MAQUINARIA">Maquinarias</option>
            </select>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="panel p-4">
            <p className="text-faint text-xs">Alertas preventivas</p>
            <p className="text-main mt-1 text-2xl font-bold">
              {resumenAlertas.total || 0}
            </p>
          </div>
          <div className="panel p-4">
            <p className="text-faint text-xs">Vencidos</p>
            <p className="mt-1 text-2xl font-bold text-red-300">
              {resumenAlertas.vencidos || 0}
            </p>
          </div>
          <div className="panel p-4">
            <p className="text-faint text-xs">Próximos</p>
            <p className="mt-1 text-2xl font-bold text-amber-300">
              {resumenAlertas.proximos || 0}
            </p>
          </div>
        </section>

        {alertasMantenimiento.length > 0 && (
          <section className="panel p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-main font-semibold">
                  Mantenimientos por atender
                </h2>
                <p className="text-muted text-sm">
                  Equipos vencidos o cercanos por fecha, kilometraje u horómetro.
                </p>
              </div>
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
              {alertasMantenimiento.slice(0, 6).map((alerta) => (
                <div
                  key={`${alerta.tipoEquipo}-${alerta.equipoId}`}
                  className="rounded-lg border border-[var(--app-border)] p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-faint text-xs">{alerta.tipoEquipo}</p>
                      <p className="text-main font-bold">
                        {alerta.identificador} - {alerta.nombre || "-"}
                      </p>
                    </div>
                    <Badge
                      className={
                        alerta.criticidad === "VENCIDO"
                          ? "border-red-500/30 bg-red-500/10 text-red-300"
                          : "border-amber-500/30 bg-amber-500/10 text-amber-300"
                      }
                    >
                      {alerta.criticidad}
                    </Badge>
                  </div>
                  <div className="mt-3 grid gap-1 text-sm text-muted">
                    {alerta.razones.map((razon) => (
                      <p key={razon}>{razon}</p>
                    ))}
                  </div>
                  <p className="text-faint mt-3 text-xs">
                    Km {formatNumber(alerta.kilometrajeActual)} / H {formatNumber(alerta.horometroActual)}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {loading ? (
          <div className="panel p-8 text-center">
            <div className="mx-auto mb-3 h-9 w-9 animate-spin rounded-full border-2 border-neutral-700 border-t-blue-500" />
            <p className="text-muted text-sm">Cargando mantenimientos...</p>
          </div>
        ) : mantenimientos.length === 0 ? (
          <div className="empty-panel">
            <Wrench className="mx-auto mb-3 h-10 w-10 text-muted" />
            <h2 className="text-main text-lg font-semibold">
              No hay mantenimientos registrados
            </h2>
            <button
              type="button"
              onClick={abrirCrear}
              className="btn-primary mt-4 px-3 py-2"
            >
              Crear orden
            </button>
          </div>
        ) : (
          <>
            <div className="grid gap-4 lg:hidden">
              {mantenimientos.map((mantenimiento) => (
                <article key={getRecordId(mantenimiento)} className="mobile-card">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-faint text-xs">{mantenimiento.numeroOrden}</p>
                      <h2 className="text-main text-lg font-bold">
                        {getEquipoLabel(mantenimiento)}
                      </h2>
                    </div>
                    <Badge className={estadoStyles[mantenimiento.estado] || estadoStyles.PROGRAMADO}>
                      {mantenimiento.estado}
                    </Badge>
                  </div>

                  <div className="mt-4 grid gap-3 text-sm">
                    <div className="info-tile">
                      <p className="text-faint text-xs">Tipo</p>
                      <Badge className={tipoStyles[mantenimiento.tipoMantenimiento] || tipoStyles.PREVENTIVO}>
                        {mantenimiento.tipoMantenimiento}
                      </Badge>
                    </div>
                    <div className="info-tile">
                      <p className="text-faint text-xs">Fecha programada</p>
                      <p className="text-main font-semibold">
                        {formatDateOnly(mantenimiento.fechaProgramada)}
                      </p>
                    </div>
                    <div className="info-tile">
                      <p className="text-faint text-xs">Responsable</p>
                      <p className="text-main font-semibold">
                        {mantenimiento.responsable || "-"}
                      </p>
                    </div>
                    <div className="info-tile">
                      <p className="text-faint text-xs">Costo</p>
                      <p className="text-main font-semibold">
                        {formatCurrency(mantenimiento.costoTotal)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
                    <button type="button" onClick={() => abrirVer(mantenimiento)} className="btn-secondary btn-icon" title="Ver">
                      <Eye />
                    </button>
                    <button type="button" onClick={() => abrirEditar(mantenimiento)} className="btn-primary btn-icon" title="Editar">
                      <Pencil />
                    </button>
                    <button type="button" onClick={() => handleEliminar(mantenimiento)} className="btn-danger btn-icon" title="Eliminar">
                      <Trash2 />
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <div className="data-table-wrap">
              <div className="table-scroll">
                <table className="data-table w-full min-w-[1280px] text-sm">
                  <thead>
                    <tr>
                      <th className="px-4 py-4 text-left">Orden</th>
                      <th className="px-4 py-4 text-left">Equipo</th>
                      <th className="px-4 py-4 text-left">Tipo</th>
                      <th className="px-4 py-4 text-left">Programada</th>
                      <th className="px-4 py-4 text-left">Lectura</th>
                      <th className="px-4 py-4 text-left">Responsable</th>
                      <th className="px-4 py-4 text-left">Próximo</th>
                      <th className="px-4 py-4 text-left">Costo</th>
                      <th className="px-4 py-4 text-center">Estado</th>
                      <th className="px-4 py-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mantenimientos.map((mantenimiento) => (
                      <tr key={getRecordId(mantenimiento)}>
                        <td className="whitespace-nowrap px-4 py-4 font-bold text-main">
                          {mantenimiento.numeroOrden}
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-main font-semibold">
                            {getEquipoLabel(mantenimiento)}
                          </p>
                          <p className="text-faint text-xs">{mantenimiento.tipoEquipo}</p>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">
                          <Badge className={tipoStyles[mantenimiento.tipoMantenimiento] || tipoStyles.PREVENTIVO}>
                            {mantenimiento.tipoMantenimiento}
                          </Badge>
                        </td>
                        <td className="text-muted whitespace-nowrap px-4 py-4">
                          {formatDateOnly(mantenimiento.fechaProgramada)}
                        </td>
                        <td className="text-muted whitespace-nowrap px-4 py-4">
                          {formatNumber(mantenimiento.kilometraje)} km / {formatNumber(mantenimiento.horometro)} h
                        </td>
                        <td className="text-muted whitespace-nowrap px-4 py-4">
                          {mantenimiento.responsable || "-"}
                        </td>
                        <td className="text-muted whitespace-nowrap px-4 py-4">
                          {mantenimiento.proximoFecha
                            ? formatDateOnly(mantenimiento.proximoFecha)
                            : mantenimiento.proximoKilometraje
                              ? `${formatNumber(mantenimiento.proximoKilometraje)} km`
                              : mantenimiento.proximoHorometro
                                ? `${formatNumber(mantenimiento.proximoHorometro)} h`
                                : "-"}
                        </td>
                        <td className="text-muted whitespace-nowrap px-4 py-4">
                          {formatCurrency(mantenimiento.costoTotal)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-center">
                          <Badge className={estadoStyles[mantenimiento.estado] || estadoStyles.PROGRAMADO}>
                            {mantenimiento.estado}
                          </Badge>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">
                          <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => abrirVer(mantenimiento)} className="btn-secondary btn-icon" title="Ver">
                              <Eye />
                            </button>
                            <button type="button" onClick={() => abrirEditar(mantenimiento)} className="btn-primary btn-icon" title="Editar">
                              <Pencil />
                            </button>
                            <button type="button" onClick={() => handleEliminar(mantenimiento)} className="btn-danger btn-icon" title="Eliminar">
                              <Trash2 />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <TablePagination
              page={paginationMantenimientos.page}
              totalPages={paginationMantenimientos.totalPages}
              total={paginationMantenimientos.total}
              limit={paginationMantenimientos.limit}
              onPageChange={(page) => cargarMantenimientos(page)}
            />
          </>
        )}

        <MantenimientoModal
          isOpen={modalOpen}
          onClose={cerrarModal}
          onSubmit={handleSubmit}
          mode={mode}
          mantenimiento={mantenimientoSeleccionado}
          unidades={unidades}
          maquinarias={maquinarias}
          itemsAlmacen={itemsAlmacen}
        />
      </div>
    </div>
  );
}

export default MantenimientoPage;
