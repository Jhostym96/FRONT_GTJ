import { useEffect, useMemo, useState } from "react";
import { notify } from "../utils/notify";
import { Eye, Pencil, Power, PowerOff, ShieldCheck, Truck } from "lucide-react";
import { useUnidades } from "../context/UnidadContext";
import { useConfirm } from "../context/ConfirmContext";
import UnidadModal from "../components/modals/UnidadModal";
import TablePagination from "../components/TablePagination";
import { getRecordId } from "../utils/apiData";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import {
  FilterButtonGroup,
  ListSearchInput,
  StatusBadge,
  SummaryIndicator,
} from "../components/ui/ListingControls";

function UnidadesPage() {
  const {
    unidades = [],
    obtenerUnidades,
    crearUnidad,
    actualizarUnidad,
    cambiarEstadoUnidad,
    paginationUnidades,
  } = useUnidades();
  const confirm = useConfirm();

  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState("create");
  const [unidadSeleccionada, setUnidadSeleccionada] = useState(null);
  const [loading, setLoading] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("TODOS");
  const [filtroTipo, setFiltroTipo] = useState("TODOS");
  const busquedaDebounced = useDebouncedValue(busqueda.trim());

  const cargarUnidades = async (page = 1) => {
    try {
      setLoading(true);
      await obtenerUnidades?.({
        page,
        limit: paginationUnidades.limit,
        search: busquedaDebounced,
        tipoUnidad: filtroTipo === "TODOS" ? undefined : filtroTipo,
        estado:
          filtroEstado === "TODOS"
            ? undefined
            : filtroEstado === "ACTIVOS"
              ? "ACTIVO"
              : "INACTIVO",
      });
    } catch (error) {
      console.error("Error al cargar unidades:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarUnidades();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busquedaDebounced, filtroEstado, filtroTipo]);

  const abrirCrear = () => {
    setMode("create");
    setUnidadSeleccionada(null);
    setModalOpen(true);
  };

  const abrirEditar = (unidad) => {
    setMode("edit");
    setUnidadSeleccionada(unidad);
    setModalOpen(true);
  };

  const abrirVer = (unidad) => {
    setMode("view");
    setUnidadSeleccionada(unidad);
    setModalOpen(true);
  };

  const cerrarModal = () => {
    setModalOpen(false);
    setUnidadSeleccionada(null);
  };

  const handleSubmit = async (data) => {
    try {
      const unidadId = getRecordId(unidadSeleccionada);

      if (mode === "edit" && unidadId) {
        await actualizarUnidad(unidadId, data);
      } else {
        await crearUnidad(data);
      }

      cerrarModal();
      await cargarUnidades(paginationUnidades.page);
    } catch (error) {
      console.error("Error al guardar unidad:", error);
    }
  };

  const handleCambiarEstado = async (unidad) => {
    const id = getRecordId(unidad);
    const estadoActual = unidad.estado || "ACTIVO";
    const nuevoEstado = estadoActual === "ACTIVO" ? "INACTIVO" : "ACTIVO";
    const accion = nuevoEstado === "ACTIVO" ? "activar" : "desactivar";

    const confirmar = await confirm({
      title: nuevoEstado === "ACTIVO" ? "Activar unidad" : "Desactivar unidad",
      message: `¿Seguro que deseas ${accion} esta unidad?`,
      confirmText: nuevoEstado === "ACTIVO" ? "Activar" : "Desactivar",
      variant: nuevoEstado === "ACTIVO" ? "primary" : "danger",
    });
    if (!confirmar) return;

    try {
      await cambiarEstadoUnidad(id, nuevoEstado);
      notify.success(
        nuevoEstado === "ACTIVO"
          ? "Unidad activada correctamente"
          : "Unidad desactivada correctamente"
      );
      await cargarUnidades(paginationUnidades.page);
    } catch (error) {
      console.error("Error al cambiar estado de unidad:", error);
      notify.error(
        error.response?.data?.message || "Error al cambiar estado de unidad"
      );
    }
  };

  const handlePageChange = (page) => {
    cargarUnidades(page);
  };

  const resumen = useMemo(
    () =>
      unidades.reduce(
        (acc, unidad) => {
          acc.total += 1;
          if ((unidad.estado || "ACTIVO") === "ACTIVO") acc.activos += 1;
          if (unidad.tipoUnidad === "TRACTO") acc.tractos += 1;
          if (unidad.tipoUnidad === "CARRETA") acc.carretas += 1;
          return acc;
        },
        { total: 0, activos: 0, tractos: 0, carretas: 0 }
      ),
    [unidades]
  );

  const EstadoBadge = ({ estado }) => {
    return (
      <StatusBadge tone={estado === "ACTIVO" ? "success" : "danger"}>
        {estado || "INACTIVO"}
      </StatusBadge>
    );
  };

  const TipoUnidadBadge = ({ tipo }) => {
    const isTracto = tipo === "TRACTO";

    return (
      <StatusBadge tone={isTracto ? "info" : "warning"}>
        {tipo || "UNIDAD"}
      </StatusBadge>
    );
  };

  const AccionesUnidad = ({ unidad, mobile = false }) => {
    return (
      <div
        className={`flex gap-2 ${
          mobile ? "flex-wrap" : "justify-end"
        }`}
      >
        <button
          type="button"
          onClick={() => abrirVer(unidad)}
          className={mobile ? "btn-secondary" : "btn-secondary btn-icon"}
          title="Ver unidad"
          aria-label="Ver unidad"
        >
          <Eye />
          {mobile && "Ver"}
        </button>

        <button
          type="button"
          onClick={() => abrirEditar(unidad)}
          className={mobile ? "btn-primary" : "btn-primary btn-icon"}
          title="Editar unidad"
          aria-label="Editar unidad"
        >
          <Pencil />
          {mobile && "Editar"}
        </button>

        <button
          type="button"
          onClick={() => handleCambiarEstado(unidad)}
          className={`${
            unidad.estado === "ACTIVO" ? "btn-danger" : "btn-success"
          } ${mobile ? "" : "btn-icon"}`}
          title={unidad.estado === "ACTIVO" ? "Desactivar unidad" : "Activar unidad"}
          aria-label={unidad.estado === "ACTIVO" ? "Desactivar unidad" : "Activar unidad"}
        >
          {unidad.estado === "ACTIVO" ? <PowerOff /> : <Power />}
          {mobile && (unidad.estado === "ACTIVO" ? "Desactivar" : "Activar")}
        </button>
      </div>
    );
  };

  return (
    <div className="page">
      <div className="page-wrap">
        <header className="page-hero">
          <div className="page-hero-content">
            <div>
              <div className="eyebrow">
                Gestión de transporte
              </div>

              <h1 className="page-title">
                Unidades
              </h1>

              <p className="page-description">
                Administra los tractos y carretas disponibles para la
                programación de viajes y emisión de guías de transportista.
              </p>
            </div>

            <button
              type="button"
              onClick={abrirCrear}
              className="btn-primary px-3 py-2"
            >
              Nueva unidad
            </button>
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Unidades", resumen.total, Truck, "bg-blue-500/10 text-blue-600 dark:text-blue-300"],
            ["Activas", resumen.activos, Power, "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"],
            ["Tractos", resumen.tractos, Truck, "bg-violet-500/10 text-violet-600 dark:text-violet-300"],
            ["Carretas", resumen.carretas, ShieldCheck, "bg-amber-500/10 text-amber-600 dark:text-amber-300"],
          ].map(([label, value, icon, tone]) => (
            <SummaryIndicator
              key={label}
              icon={icon}
              label={label}
              value={value}
              tone={tone}
            />
          ))}
        </section>

        <section className="filter-panel">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-center">
            <ListSearchInput
              value={busqueda}
              onChange={setBusqueda}
              onClear={() => setBusqueda("")}
              placeholder="Buscar por placa, marca, modelo o TUCE"
              ariaLabel="Buscar unidades"
              className="lg:max-w-md"
            />
            <FilterButtonGroup
              value={filtroTipo}
              onChange={setFiltroTipo}
              options={[
                { value: "TODOS", label: "Todos" },
                { value: "TRACTO", label: "Tractos" },
                { value: "CARRETA", label: "Carretas" },
              ]}
            />
            <FilterButtonGroup
              value={filtroEstado}
              onChange={setFiltroEstado}
              options={[
                { value: "TODOS", label: "Todos" },
                { value: "ACTIVOS", label: "Activas" },
                { value: "INACTIVOS", label: "Inactivas" },
              ]}
            />
          </div>
          <p className="text-muted mt-3 border-t pt-3 text-xs">{paginationUnidades.total} registros encontrados</p>
        </section>

        {loading ? (
          <div className="loading-panel">
            <div className="loading-spinner" />
            <p className="text-muted text-sm">Cargando unidades...</p>
          </div>
        ) : unidades.length === 0 ? (
          <div className="empty-panel">
            <h2 className="text-main text-lg font-semibold">
              No hay unidades registradas
            </h2>

            <p className="text-muted mt-1 text-sm">
              Registra tu primera unidad para poder asignarla en una
              programación de viaje.
            </p>

            <button
              type="button"
              onClick={abrirCrear}
              className="btn-primary mt-4 px-3 py-2"
            >
              Crear unidad
            </button>
          </div>
        ) : (
          <>
            {/* Cards en móvil */}
            <div className="mobile-list">
              {unidades.map((unidad) => (
                <article
                  key={getRecordId(unidad)}
                  className="mobile-card"
                >
                  <div className="mobile-card-header">
                    <div>
                      <p className="text-faint text-xs font-medium">
                        Placa
                      </p>

                      <h2 className="text-main text-xl font-bold">
                        {unidad.placa || "-"}
                      </h2>
                    </div>

                    <EstadoBadge estado={unidad.estado} />
                  </div>

                  <div className="mobile-detail-grid">
                    <div className="info-tile">
                      <p className="mobile-card-subtitle">Tipo de unidad</p>

                      <div className="mt-1">
                        <TipoUnidadBadge tipo={unidad.tipoUnidad} />
                      </div>
                    </div>

                    <div className="info-tile">
                      <p className="mobile-card-subtitle">Marca</p>

                      <p className="text-main font-semibold">
                        {unidad.marca || "-"}
                      </p>
                    </div>

                    <div className="info-tile">
                      <p className="mobile-card-subtitle">Modelo</p>

                      <p className="text-main font-semibold">
                        {[unidad.modelo, unidad.anio].filter(Boolean).join(" / ") || "-"}
                      </p>
                    </div>

                    <div className="info-tile">
                      <p className="mobile-card-subtitle">Permisos</p>
                      <p className="text-main font-semibold">
                        {[
                          unidad.permisoIMO ? "IMO" : null,
                          unidad.permisoIQBF ? "IQBF" : null,
                        ]
                          .filter(Boolean)
                          .join(" / ") || "GENERAL"}
                      </p>
                    </div>

                    {unidad.numeroTUCE_CHV && (
                      <div className="info-tile">
                        <p className="mobile-card-subtitle">TUCE / CHV</p>

                        <p className="text-main font-semibold">
                          {unidad.numeroTUCE_CHV}
                        </p>
                      </div>
                    )}

                    {unidad.observaciones && (
                      <div className="info-tile">
                        <p className="mobile-card-subtitle">
                          Observaciones
                        </p>

                        <p className="text-muted mt-1">
                          {unidad.observaciones}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mobile-card-actions">
                    <AccionesUnidad unidad={unidad} mobile />
                  </div>
                </article>
              ))}
            </div>

            {/* Tabla en desktop */}
            <div className="data-table-wrap">
              <div className="table-scroll">
                <table className="data-table dense-table w-full min-w-[980px] text-sm">
                  <thead>
                    <tr>
                      <th className="px-4 py-4 text-left">Placa</th>
                      <th className="px-4 py-4 text-left">Tipo</th>
                      <th className="px-4 py-4 text-left">Marca</th>
                      <th className="px-4 py-4 text-left">Modelo</th>
                      <th className="px-4 py-4 text-left">Permisos</th>
                      <th className="px-4 py-4 text-left">TUCE / CHV</th>
                      <th className="px-4 py-4 text-center">Estado</th>
                      <th className="px-4 py-4 text-right">Acciones</th>
                    </tr>
                  </thead>

                  <tbody>
                    {unidades.map((unidad) => (
                      <tr key={getRecordId(unidad)}>
                        <td className="whitespace-nowrap px-4 py-4">
                          <p className="text-main font-bold">
                            {unidad.placa || "-"}
                          </p>
                        </td>

                        <td className="whitespace-nowrap px-4 py-4">
                          <TipoUnidadBadge tipo={unidad.tipoUnidad} />
                        </td>

                        <td className="text-muted whitespace-nowrap px-4 py-4">
                          {unidad.marca || "-"}
                        </td>

                        <td className="text-muted whitespace-nowrap px-4 py-4">
                          {[unidad.modelo, unidad.anio].filter(Boolean).join(" / ") || "-"}
                        </td>

                        <td className="text-muted whitespace-nowrap px-4 py-4">
                          {[
                            unidad.permisoIMO ? "IMO" : null,
                            unidad.permisoIQBF ? "IQBF" : null,
                          ]
                            .filter(Boolean)
                            .join(" / ") || "GENERAL"}
                        </td>

                        <td className="text-muted whitespace-nowrap px-4 py-4">
                          {unidad.numeroTUCE_CHV || "-"}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-center">
                          <EstadoBadge estado={unidad.estado} />
                        </td>

                        <td className="whitespace-nowrap px-4 py-4">
                          <AccionesUnidad unidad={unidad} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <TablePagination
              page={paginationUnidades.page}
              totalPages={paginationUnidades.totalPages}
              total={paginationUnidades.total}
              limit={paginationUnidades.limit}
              onPageChange={handlePageChange}
            />
          </>
        )}

        <UnidadModal
          isOpen={modalOpen}
          onClose={cerrarModal}
          onSubmit={handleSubmit}
          mode={mode}
          unidad={unidadSeleccionada}
        />
      </div>
    </div>
  );
}

export default UnidadesPage;
