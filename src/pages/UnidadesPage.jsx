import { useEffect, useState } from "react";
import { useUnidades } from "../context/UnidadContext";
import UnidadModal from "../components/modals/UnidadModal";

function UnidadesPage() {
  const {
    unidades = [],
    obtenerUnidades,
    crearUnidad,
    actualizarUnidad,
    eliminarUnidad,
  } = useUnidades();

  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState("create");
  const [unidadSeleccionada, setUnidadSeleccionada] = useState(null);
  const [loading, setLoading] = useState(false);

  const cargarUnidades = async () => {
    try {
      setLoading(true);
      await obtenerUnidades?.();
    } catch (error) {
      console.error("Error al cargar unidades:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarUnidades();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      if (mode === "edit" && unidadSeleccionada?.id) {
        await actualizarUnidad(unidadSeleccionada.id, data);
      } else {
        await crearUnidad(data);
      }

      cerrarModal();
      await cargarUnidades();
    } catch (error) {
      console.error("Error al guardar unidad:", error);
    }
  };

  const handleEliminar = async (id) => {
    const confirmar = confirm("¿Seguro que deseas eliminar esta unidad?");
    if (!confirmar) return;

    try {
      await eliminarUnidad(id);
      await cargarUnidades();
    } catch (error) {
      console.error("Error al eliminar unidad:", error);
    }
  };

  const EstadoBadge = ({ estado }) => {
    if (estado === "ACTIVO") {
      return (
        <span className="inline-flex items-center justify-center rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-[11px] font-bold tracking-wide text-green-300">
          ACTIVO
        </span>
      );
    }

    return (
      <span className="inline-flex items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-[11px] font-bold tracking-wide text-red-300">
        {estado || "INACTIVO"}
      </span>
    );
  };

  const TipoUnidadBadge = ({ tipo }) => {
    const isTracto = tipo === "TRACTO";

    return (
      <span
        className={`inline-flex items-center justify-center rounded-full border px-3 py-1 text-[11px] font-bold tracking-wide ${
          isTracto
            ? "border-blue-500/30 bg-blue-500/10 text-blue-300"
            : "border-amber-500/30 bg-amber-500/10 text-amber-300"
        }`}
      >
        {tipo || "UNIDAD"}
      </span>
    );
  };

  const AccionesUnidad = ({ unidad, mobile = false }) => {
    return (
      <div
        className={`flex gap-2 ${
          mobile ? "w-full flex-col sm:flex-row" : "justify-end"
        }`}
      >
        <button
          type="button"
          onClick={() => abrirVer(unidad)}
          className="btn-secondary px-3 py-2 text-xs"
        >
          Ver
        </button>

        <button
          type="button"
          onClick={() => abrirEditar(unidad)}
          className="btn-primary px-3 py-2 text-xs"
        >
          Editar
        </button>

        <button
          type="button"
          onClick={() => handleEliminar(unidad.id)}
          className="btn-danger px-3 py-2 text-xs"
        >
          Eliminar
        </button>
      </div>
    );
  };

  return (
    <div className="w-full py-4">
      <div className="page-wrap">
        <header className="page-hero">
          <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
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
              className="btn-primary px-5 py-3"
            >
              Nueva unidad
            </button>
          </div>
        </header>

        {loading ? (
          <div className="panel p-8 text-center">
            <div className="mx-auto mb-3 h-9 w-9 animate-spin rounded-full border-2 border-neutral-700 border-t-blue-500" />
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
              className="btn-primary mt-5 px-5 py-3"
            >
              Crear unidad
            </button>
          </div>
        ) : (
          <>
            {/* Cards en móvil */}
            <div className="grid gap-4 lg:hidden">
              {unidades.map((unidad) => (
                <article
                  key={unidad.id}
                  className="mobile-card"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
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

                  <div className="grid gap-3 text-sm">
                    <div className="info-tile">
                      <p className="text-faint text-xs">Tipo de unidad</p>

                      <div className="mt-1">
                        <TipoUnidadBadge tipo={unidad.tipoUnidad} />
                      </div>
                    </div>

                    <div className="info-tile">
                      <p className="text-faint text-xs">Marca</p>

                      <p className="text-main font-semibold">
                        {unidad.marca || "-"}
                      </p>
                    </div>

                    <div className="info-tile">
                      <p className="text-faint text-xs">Modelo</p>

                      <p className="text-main font-semibold">
                        {unidad.modelo || "-"}
                      </p>
                    </div>

                    <div className="info-tile">
                      <p className="text-faint text-xs">Permisos</p>
                      <p className="text-main font-semibold">
                        {[
                          unidad.permisoIMO ? "IMO" : null,
                          unidad.permisoIQBF ? "IQBF" : null,
                        ]
                          .filter(Boolean)
                          .join(" / ") || "GENERAL"}
                      </p>
                    </div>

                    {unidad.tuc && (
                      <div className="info-tile">
                        <p className="text-faint text-xs">TUCE / CHV</p>

                        <p className="text-main font-semibold">
                          {unidad.tuc}
                        </p>
                      </div>
                    )}

                    {unidad.observaciones && (
                      <div className="info-tile">
                        <p className="text-faint text-xs">
                          Observaciones
                        </p>

                        <p className="text-muted mt-1">
                          {unidad.observaciones}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 border-t pt-4">
                    <AccionesUnidad unidad={unidad} mobile />
                  </div>
                </article>
              ))}
            </div>

            {/* Tabla en desktop */}
            <div className="data-table-wrap">
              <div className="overflow-x-auto">
                <table className="data-table w-full min-w-[1000px] text-sm">
                  <thead>
                    <tr>
                      <th className="px-4 py-4 text-left">Placa</th>
                      <th className="px-4 py-4 text-left">Tipo</th>
                      <th className="px-4 py-4 text-left">Marca</th>
                      <th className="px-4 py-4 text-left">Modelo</th>
                      <th className="px-4 py-4 text-left">Permisos</th>
                      <th className="px-4 py-4 text-left">TUCE / CHV</th>
                      <th className="px-4 py-4 text-left">Observaciones</th>
                      <th className="px-4 py-4 text-center">Estado</th>
                      <th className="px-4 py-4 text-right">Acciones</th>
                    </tr>
                  </thead>

                  <tbody>
                    {unidades.map((unidad) => (
                      <tr key={unidad.id}>
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
                          {unidad.modelo || "-"}
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
                          {unidad.tuc || "-"}
                        </td>

                        <td className="text-muted min-w-[260px] px-4 py-4">
                          <p className="max-w-[320px] truncate">
                            {unidad.observaciones || "-"}
                          </p>
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
