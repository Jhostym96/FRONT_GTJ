import { useEffect, useState } from "react";
import { notify } from "../utils/notify";
import { Eye, Pencil, Power, PowerOff } from "lucide-react";
import { useClientes } from "../context/ClienteContext";
import { useConfirm } from "../context/ConfirmContext";
import ClienteModal from "../components/modals/ClienteModal";
import TablePagination from "../components/TablePagination";
import { getRecordId } from "../utils/apiData";

function ClientesPage() {
  const {
    clientes,
    getClientes,
    createCliente,
    updateCliente,
    deleteCliente,
    loadingClientes,
    errorsCliente,
    paginationClientes,
  } = useClientes();
  const confirm = useConfirm();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);

  useEffect(() => {
    getClientes({ page: 1, limit: 10 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getClienteId = getRecordId;

  const getEntidadesPorTipo = (cliente, tipo) => {
    if (!cliente) return [];

    const entidades = cliente.entidadesRelacionadas || [];

    if (!Array.isArray(entidades)) return [];

    return entidades.filter((entidad) => entidad.tipo === tipo);
  };

  const getTotalRemitentes = (cliente) => {
    return getEntidadesPorTipo(cliente, "REMITENTE").length;
  };

  const getTotalDestinatarios = (cliente) => {
    return getEntidadesPorTipo(cliente, "DESTINATARIO").length;
  };

  const abrirCrear = () => {
    setClienteSeleccionado(null);
    setModalMode("create");
    setModalOpen(true);
  };

  const abrirVer = (cliente) => {
    setClienteSeleccionado(cliente);
    setModalMode("view");
    setModalOpen(true);
  };

  const abrirEditar = (cliente) => {
    setClienteSeleccionado(cliente);
    setModalMode("edit");
    setModalOpen(true);
  };

  const cerrarModal = () => {
    setModalOpen(false);
    setClienteSeleccionado(null);
  };

  const handleSubmitModal = async (data) => {
    try {
      let res = null;

      if (modalMode === "create") {
        res = await createCliente(data);
      }

      if (modalMode === "edit") {
        const clienteId = getClienteId(clienteSeleccionado);

        if (!clienteId) {
          notify.error("No se encontró el ID del cliente seleccionado");
          return;
        }

        res = await updateCliente(clienteId, data);
      }

      if (!res?.ok) {
        notify.error(res?.error || "No se pudo guardar el cliente");
        return;
      }

      cerrarModal();
      await getClientes({ page: paginationClientes.page, limit: paginationClientes.limit });
    } catch (error) {
      console.error("Error inesperado al guardar cliente:", error);
      notify.error("Error inesperado al guardar cliente");
    }
  };

  const handleCambiarEstado = async (cliente) => {
    const id = getClienteId(cliente);
    const nuevoEstado = !cliente.activo;
    const accion = nuevoEstado ? "activar" : "desactivar";

    if (!id) {
      notify.error("No se encontró el ID del cliente");
      return;
    }

    const confirmar = await confirm({
      title: nuevoEstado ? "Activar cliente" : "Desactivar cliente",
      message: `¿Estás seguro de ${accion} este cliente?`,
      confirmText: nuevoEstado ? "Activar" : "Desactivar",
      variant: nuevoEstado ? "primary" : "danger",
    });

    if (!confirmar) return;

    const res = nuevoEstado
      ? await updateCliente(id, { activo: true })
      : await deleteCliente(id);

    if (!res?.ok) {
      notify.error(res?.error || "No se pudo cambiar el estado del cliente");
      return;
    }

    notify.success(
      nuevoEstado
        ? "Cliente activado correctamente"
        : "Cliente desactivado correctamente"
    );
    await getClientes({
      page: paginationClientes.page,
      limit: paginationClientes.limit,
    });
  };

  const handlePageChange = (page) => {
    getClientes({ page, limit: paginationClientes.limit });
  };

  const EstadoBadge = ({ activo }) => {
    if (activo) {
      return (
        <span className="inline-flex items-center justify-center rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-[11px] font-bold tracking-wide text-green-300">
          ACTIVO
        </span>
      );
    }

    return (
      <span className="inline-flex items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-[11px] font-bold tracking-wide text-red-300">
        INACTIVO
      </span>
    );
  };

  const EntidadesResumen = ({ cliente }) => {
    const remitentes = getTotalRemitentes(cliente);
    const destinatarios = getTotalDestinatarios(cliente);

    if (remitentes === 0 && destinatarios === 0) {
      return <span className="mobile-card-subtitle">Sin entidades registradas</span>;
    }

    return (
      <div className="flex flex-wrap gap-2">
        {remitentes > 0 && (
          <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300">
            {remitentes} remitente{remitentes === 1 ? "" : "s"}
          </span>
        )}

        {destinatarios > 0 && (
          <span className="rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-300">
            {destinatarios} destinatario{destinatarios === 1 ? "" : "s"}
          </span>
        )}
      </div>
    );
  };

  const AccionesCliente = ({ cliente, mobile = false }) => {
    return (
      <div
        className={`flex ${
          mobile ? "flex-wrap" : "justify-end"
        } gap-2`}
      >
        <button
          type="button"
          onClick={() => abrirVer(cliente)}
          className="btn-secondary btn-icon"
          title="Ver cliente"
          aria-label="Ver cliente"
        >
          <Eye />
        </button>

        <button
          type="button"
          onClick={() => abrirEditar(cliente)}
          className="btn-primary btn-icon"
          title="Editar cliente"
          aria-label="Editar cliente"
        >
          <Pencil />
        </button>

        <button
          type="button"
          onClick={() => handleCambiarEstado(cliente)}
          className={`${
            cliente.activo ? "btn-danger" : "btn-success"
          } btn-icon`}
          title={cliente.activo ? "Desactivar cliente" : "Activar cliente"}
          aria-label={cliente.activo ? "Desactivar cliente" : "Activar cliente"}
        >
          {cliente.activo ? <PowerOff /> : <Power />}
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
                Clientes
              </h1>

              <p className="page-description">
                Administra los datos comerciales de tus clientes y sus entidades
                relacionadas para órdenes de servicio y guías.
              </p>
            </div>

            <button
              type="button"
              onClick={abrirCrear}
              className="btn-primary px-3 py-2"
            >
              Nuevo cliente
            </button>
          </div>
        </header>

        {errorsCliente?.length > 0 && (
          <div className="alert-panel">
            {errorsCliente.map((error, index) => (
              <p key={index}>{error}</p>
            ))}
          </div>
        )}

        {loadingClientes ? (
          <div className="loading-panel">
            <div className="loading-spinner" />
            <p className="text-muted text-sm">Cargando clientes...</p>
          </div>
        ) : clientes.length === 0 ? (
          <div className="empty-panel">
            <h2 className="text-main text-lg font-semibold">
              No hay clientes registrados
            </h2>

            <p className="text-muted mt-1 text-sm">
              Registra tu primer cliente para asociar remitentes,
              destinatarios y direcciones.
            </p>

            <button
              type="button"
              onClick={abrirCrear}
              className="btn-primary mt-4 px-3 py-2"
            >
              Crear cliente
            </button>
          </div>
        ) : (
          <>
            {/* Cards en móvil */}
            <div className="mobile-list">
              {clientes.map((cliente) => (
                <article
                  key={getClienteId(cliente)}
                  className="mobile-card"
                >
                  <div className="mobile-card-header">
                    <div>
                      <p className="text-faint text-xs font-medium">
                        Cliente
                      </p>

                      <h2 className="mobile-card-title">
                        {cliente.razonSocial || "-"}
                      </h2>
                    </div>

                    <EstadoBadge activo={cliente.activo} />
                  </div>

                  <div className="mobile-detail-grid">
                    <div className="info-tile">
                      <p className="mobile-card-subtitle">Documento</p>

                      <p className="text-main font-semibold">
                        {cliente.numeroDocumento || "-"}
                      </p>

                      <p className="mobile-card-subtitle">
                        Tipo: {cliente.tipoDocumento || "-"}
                      </p>
                    </div>

                    <div className="info-tile">
                      <p className="mobile-card-subtitle">
                        Dirección fiscal
                      </p>

                      <p className="text-muted mt-1">
                        {cliente.direccionFiscal || "-"}
                      </p>
                    </div>

                    <div className="info-tile">
                      <p className="text-faint mb-2 text-xs">
                        Entidades relacionadas
                      </p>

                      <EntidadesResumen cliente={cliente} />
                    </div>

                    <div className="info-tile">
                      <p className="mobile-card-subtitle">Crédito</p>
                      <p className="text-main font-semibold">
                        {cliente.diasCredito || 0} días
                      </p>
                    </div>
                  </div>

                  <div className="mobile-card-actions">
                    <AccionesCliente cliente={cliente} mobile />
                  </div>
                </article>
              ))}
            </div>

            {/* Tabla en desktop */}
            <div className="data-table-wrap">
              <div className="table-scroll">
                <table className="data-table dense-table w-full min-w-[1100px] text-sm">
                  <thead>
                    <tr>
                      <th className="px-4 py-4 text-left">Cliente</th>
                      <th className="px-4 py-4 text-left">Documento</th>
                      <th className="px-4 py-4 text-left">
                        Dirección fiscal
                      </th>
                      <th className="px-4 py-4 text-left">
                        Entidades relacionadas
                      </th>
                      <th className="px-4 py-4 text-left">Crédito</th>
                      <th className="px-4 py-4 text-center">Estado</th>
                      <th className="px-4 py-4 text-right">Acciones</th>
                    </tr>
                  </thead>

                  <tbody>
                    {clientes.map((cliente) => (
                      <tr key={getClienteId(cliente)}>
                        <td className="min-w-[230px] px-4 py-4">
                          <p className="text-main max-w-[260px] truncate font-bold">
                            {cliente.razonSocial || "-"}
                          </p>
                        </td>

                        <td className="text-muted whitespace-nowrap px-4 py-4">
                          <p className="font-semibold">
                            {cliente.numeroDocumento || "-"}
                          </p>

                          <p className="mobile-card-subtitle">
                            Tipo: {cliente.tipoDocumento || "-"}
                          </p>
                        </td>

                        <td className="text-muted min-w-[300px] px-4 py-4">
                          <p className="max-w-[420px] truncate">
                            {cliente.direccionFiscal || "-"}
                          </p>
                        </td>

                        <td className="min-w-[240px] px-4 py-4">
                          <EntidadesResumen cliente={cliente} />
                        </td>

                        <td className="text-muted whitespace-nowrap px-4 py-4">
                          {cliente.diasCredito || 0} días
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-center">
                          <EstadoBadge activo={cliente.activo} />
                        </td>

                        <td className="whitespace-nowrap px-4 py-4">
                          <AccionesCliente cliente={cliente} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <TablePagination
              page={paginationClientes.page}
              totalPages={paginationClientes.totalPages}
              total={paginationClientes.total}
              limit={paginationClientes.limit}
              onPageChange={handlePageChange}
            />
          </>
        )}

        <ClienteModal
          isOpen={modalOpen}
          mode={modalMode}
          clienteSeleccionado={clienteSeleccionado}
          onClose={cerrarModal}
          onSubmit={handleSubmitModal}
          loading={loadingClientes}
        />
      </div>
    </div>
  );
}

export default ClientesPage;
