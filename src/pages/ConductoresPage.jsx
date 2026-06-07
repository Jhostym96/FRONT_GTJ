import { useEffect, useState } from "react";
import { notify } from "../utils/notify";
import { Pencil, Power, PowerOff } from "lucide-react";
import { useConductores } from "../context/ConductorContext";
import { useConfirm } from "../context/ConfirmContext";
import ConductorModal from "../components/modals/ConductorModal";
import TablePagination from "../components/TablePagination";
import { getRecordId } from "../utils/apiData";

function ConductoresPage() {
  const {
    conductores,
    errors,
    obtenerConductores,
    crearConductor,
    actualizarConductor,
    cambiarEstadoConductor,
    limpiarErrores,
    paginationConductores,
  } = useConductores();
  const confirm = useConfirm();

  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState("create");
  const [selectedConductor, setSelectedConductor] = useState(null);
  const [loading, setLoading] = useState(false);

  const cargarConductores = async (page = paginationConductores.page) => {
    try {
      setLoading(true);
      await obtenerConductores({ page, limit: paginationConductores.limit });
    } catch (error) {
      console.error("Error al cargar conductores:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarConductores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const abrirCrear = () => {
    limpiarErrores();
    setMode("create");
    setSelectedConductor(null);
    setModalOpen(true);
  };

  const abrirEditar = (conductor) => {
    limpiarErrores();
    setMode("edit");
    setSelectedConductor(conductor);
    setModalOpen(true);
  };

  const cerrarModal = () => {
    limpiarErrores();
    setModalOpen(false);
    setSelectedConductor(null);
  };

  const handleSubmit = async (form) => {
    try {
      if (mode === "create") {
        await crearConductor(form);
      } else {
        await actualizarConductor(getRecordId(selectedConductor), form);
      }

      cerrarModal();
      await cargarConductores(paginationConductores.page);
    } catch (error) {
      console.error("Error al guardar conductor:", error);
    }
  };

  const handlePageChange = (page) => {
    cargarConductores(page);
  };

  const handleCambiarEstado = async (conductor) => {
    const conductorId = getRecordId(conductor);
    const estadoActual = conductor.estado || "ACTIVO";
    const nuevoEstado = estadoActual === "ACTIVO" ? "INACTIVO" : "ACTIVO";
    const accion = nuevoEstado === "ACTIVO" ? "activar" : "desactivar";

    if (!conductorId) {
      notify.error("No se encontró el ID del conductor");
      return;
    }

    const confirmar = await confirm({
      title: nuevoEstado === "ACTIVO" ? "Activar conductor" : "Desactivar conductor",
      message: `¿Seguro que deseas ${accion} este conductor?`,
      confirmText: nuevoEstado === "ACTIVO" ? "Activar" : "Desactivar",
      variant: nuevoEstado === "ACTIVO" ? "primary" : "danger",
    });

    if (!confirmar) return;

    try {
      await cambiarEstadoConductor(conductorId, nuevoEstado);
      notify.success(
        nuevoEstado === "ACTIVO"
          ? "Conductor activado correctamente"
          : "Conductor desactivado correctamente"
      );
      await cargarConductores(paginationConductores.page);
    } catch (error) {
      notify.error(
        error.response?.data?.message || "Error al cambiar estado de conductor"
      );
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

  const AccionesConductor = ({ conductor, mobile = false }) => {
    return (
      <div
        className={`flex ${
          mobile ? "w-full flex-col sm:flex-row" : "justify-end"
        } gap-2`}
      >
        <button
          type="button"
          onClick={() => abrirEditar(conductor)}
          className="btn-primary btn-icon"
          title="Editar conductor"
          aria-label="Editar conductor"
        >
          <Pencil />
        </button>
        <button
          type="button"
          onClick={() => handleCambiarEstado(conductor)}
          className={`${
            conductor.estado === "ACTIVO" ? "btn-danger" : "btn-success"
          } btn-icon`}
          title={
            conductor.estado === "ACTIVO"
              ? "Desactivar conductor"
              : "Activar conductor"
          }
          aria-label={
            conductor.estado === "ACTIVO"
              ? "Desactivar conductor"
              : "Activar conductor"
          }
        >
          {conductor.estado === "ACTIVO" ? <PowerOff /> : <Power />}
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
                Conductores
              </h1>

              <p className="page-description">
                Administra los datos de los conductores para la programación de
                viajes y emisión de guías de transportista.
              </p>
            </div>

            <button
              type="button"
              onClick={abrirCrear}
              className="btn-primary px-3 py-2"
            >
              Nuevo conductor
            </button>
          </div>
        </header>

        {errors?.length > 0 && (
          <div className="alert-panel">
            {errors.map((error, index) => (
              <p key={index}>{error}</p>
            ))}
          </div>
        )}

        {loading ? (
          <div className="loading-panel">
            <div className="loading-spinner" />
            <p className="text-muted text-sm">
              Cargando conductores...
            </p>
          </div>
        ) : conductores.length === 0 ? (
          <div className="empty-panel">
            <h2 className="text-main text-lg font-semibold">
              No hay conductores registrados
            </h2>

            <p className="text-muted mt-1 text-sm">
              Registra tu primer conductor para poder asignarlo en una
              programación de viaje.
            </p>

            <button
              type="button"
              onClick={abrirCrear}
              className="btn-primary mt-4 px-3 py-2"
            >
              Crear conductor
            </button>
          </div>
        ) : (
          <>
            {/* Cards en móvil */}
            <div className="mobile-list">
              {conductores.map((conductor) => (
                <article
                  key={getRecordId(conductor)}
                  className="mobile-card"
                >
                  <div className="mobile-card-header">
                    <div>
                      <p className="text-faint text-xs font-medium">
                        Conductor
                      </p>

                      <h2 className="mobile-card-title">
                        {conductor.nombres || "-"} {conductor.apellidos || ""}
                      </h2>
                    </div>

                    <EstadoBadge estado={conductor.estado} />
                  </div>

                  <div className="mobile-detail-grid">
                    <div className="info-tile">
                      <p className="mobile-card-subtitle">Documento</p>

                      <p className="text-main font-semibold">
                        {conductor.numeroDocumento || "-"}
                      </p>

                      <p className="mobile-card-subtitle">
                        Tipo:{" "}
                        {obtenerTipoDocumentoTexto(conductor.tipoDocumento)}
                      </p>
                    </div>

                    <div className="info-tile">
                      <p className="mobile-card-subtitle">Licencia</p>

                      <p className="text-main font-semibold">
                        {conductor.numeroLicencia || "-"}
                      </p>
                    </div>

                    <div className="info-tile">
                      <p className="mobile-card-subtitle">Permisos</p>
                      <p className="text-main font-semibold">
                        {[
                          conductor.permisoIMO ? "IMO" : null,
                          conductor.permisoIQBF ? "IQBF" : null,
                        ]
                          .filter(Boolean)
                          .join(" / ") || "GENERAL"}
                      </p>
                    </div>

                    <div className="info-tile">
                      <p className="mobile-card-subtitle">Teléfono</p>

                      <p className="text-main font-semibold">
                        {conductor.telefono || "-"}
                      </p>
                    </div>

                    {conductor.observaciones && (
                      <div className="info-tile">
                        <p className="mobile-card-subtitle">
                          Observaciones
                        </p>

                        <p className="text-muted mt-1">
                          {conductor.observaciones}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mobile-card-actions">
                    <AccionesConductor conductor={conductor} mobile />
                  </div>
                </article>
              ))}
            </div>

            {/* Tabla en desktop */}
            <div className="data-table-wrap">
              <div className="table-scroll">
                <table className="data-table dense-table w-full min-w-[1000px] text-sm">
                  <thead>
                    <tr>
                      <th className="px-4 py-4 text-left">Conductor</th>
                      <th className="px-4 py-4 text-left">Documento</th>
                      <th className="px-4 py-4 text-left">Licencia</th>
                      <th className="px-4 py-4 text-left">Permisos</th>
                      <th className="px-4 py-4 text-left">Teléfono</th>
                      <th className="px-4 py-4 text-left">Observaciones</th>
                      <th className="px-4 py-4 text-center">Estado</th>
                      <th className="px-4 py-4 text-right">Acciones</th>
                    </tr>
                  </thead>

                  <tbody>
                    {conductores.map((conductor) => (
                      <tr
                        key={getRecordId(conductor)}
                      >
                        <td className="min-w-[230px] px-4 py-4">
                          <p className="text-main max-w-[260px] truncate font-bold">
                            {conductor.nombres || "-"}{" "}
                            {conductor.apellidos || ""}
                          </p>
                        </td>

                        <td className="text-muted whitespace-nowrap px-4 py-4">
                          <p className="font-semibold">
                            {conductor.numeroDocumento || "-"}
                          </p>

                          <p className="mobile-card-subtitle">
                            Tipo:{" "}
                            {obtenerTipoDocumentoTexto(
                              conductor.tipoDocumento
                            )}
                          </p>
                        </td>

                        <td className="text-muted whitespace-nowrap px-4 py-4">
                          <p className="font-semibold">
                            {conductor.numeroLicencia || "-"}
                          </p>
                        </td>

                        <td className="text-muted whitespace-nowrap px-4 py-4">
                          {[
                            conductor.permisoIMO ? "IMO" : null,
                            conductor.permisoIQBF ? "IQBF" : null,
                          ]
                            .filter(Boolean)
                            .join(" / ") || "GENERAL"}
                        </td>

                        <td className="text-muted whitespace-nowrap px-4 py-4">
                          {conductor.telefono || "-"}
                        </td>

                        <td className="text-muted min-w-[260px] px-4 py-4">
                          <p className="max-w-[320px] truncate">
                            {conductor.observaciones || "-"}
                          </p>
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-center">
                          <EstadoBadge estado={conductor.estado} />
                        </td>

                        <td className="whitespace-nowrap px-4 py-4">
                          <AccionesConductor conductor={conductor} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <TablePagination
              page={paginationConductores.page}
              totalPages={paginationConductores.totalPages}
              total={paginationConductores.total}
              limit={paginationConductores.limit}
              onPageChange={handlePageChange}
            />
          </>
        )}

        <ConductorModal
          open={modalOpen}
          onClose={cerrarModal}
          mode={mode}
          data={selectedConductor}
          onSubmit={handleSubmit}
          errors={errors}
        />
      </div>
    </div>
  );
}

const obtenerTipoDocumentoTexto = (tipoDocumento) => {
  const tipos = {
    1: "DNI",
    4: "Carnet de extranjería",
    6: "RUC",
    7: "Pasaporte",
    A: "Cédula diplomática",
    0: "Sin documento",
  };

  return tipos[tipoDocumento] || tipoDocumento || "-";
};

export default ConductoresPage;
