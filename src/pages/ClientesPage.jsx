import { useEffect, useState } from "react";
import { useClientes } from "../context/ClienteContext";
import ClienteModal from "../components/modals/ClienteModal";

function ClientesPage() {
  const {
    clientes,
    getClientes,
    createCliente,
    updateCliente,
    deleteCliente,
    loadingClientes,
    errorsCliente,
  } = useClientes();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);

  useEffect(() => {
    getClientes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getClienteId = (cliente) => cliente?.id;

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
          alert("No se encontró el ID del cliente seleccionado");
          return;
        }

        res = await updateCliente(clienteId, data);
      }

      if (!res?.ok) {
        alert(res?.error || "No se pudo guardar el cliente");
        return;
      }

      cerrarModal();
      await getClientes();
    } catch (error) {
      console.error("Error inesperado al guardar cliente:", error);
      alert("Error inesperado al guardar cliente");
    }
  };

  const handleDelete = async (id) => {
    if (!id) {
      alert("No se encontró el ID del cliente");
      return;
    }

    const confirmar = window.confirm("¿Estás seguro de eliminar este cliente?");

    if (!confirmar) return;

    const res = await deleteCliente(id);

    if (!res?.ok) {
      alert(res?.error || "No se pudo eliminar el cliente");
      return;
    }

    await getClientes();
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
      return <span className="text-faint text-xs">Sin entidades registradas</span>;
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
    const clienteId = getClienteId(cliente);

    return (
      <div
        className={`flex ${
          mobile ? "w-full flex-col sm:flex-row" : "justify-end"
        } gap-2`}
      >
        <button
          type="button"
          onClick={() => abrirVer(cliente)}
          className="btn-secondary px-3 py-2 text-xs"
        >
          Ver
        </button>

        <button
          type="button"
          onClick={() => abrirEditar(cliente)}
          className="btn-primary px-3 py-2 text-xs"
        >
          Editar
        </button>

        <button
          type="button"
          onClick={() => handleDelete(clienteId)}
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
              className="btn-primary px-5 py-3"
            >
              Nuevo cliente
            </button>
          </div>
        </header>

        {errorsCliente?.length > 0 && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300 shadow-lg">
            {errorsCliente.map((error, index) => (
              <p key={index}>{error}</p>
            ))}
          </div>
        )}

        {loadingClientes ? (
          <div className="panel p-8 text-center">
            <div className="mx-auto mb-3 h-9 w-9 animate-spin rounded-full border-2 border-neutral-700 border-t-blue-500" />
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
              className="btn-primary mt-5 px-5 py-3"
            >
              Crear cliente
            </button>
          </div>
        ) : (
          <>
            {/* Cards en móvil */}
            <div className="grid gap-4 lg:hidden">
              {clientes.map((cliente) => (
                <article
                  key={getClienteId(cliente)}
                  className="mobile-card"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-faint text-xs font-medium">
                        Cliente
                      </p>

                      <h2 className="text-main text-lg font-bold">
                        {cliente.razonSocial || "-"}
                      </h2>
                    </div>

                    <EstadoBadge activo={cliente.activo} />
                  </div>

                  <div className="grid gap-3 text-sm">
                    <div className="info-tile">
                      <p className="text-faint text-xs">Documento</p>

                      <p className="text-main font-semibold">
                        {cliente.numeroDocumento || "-"}
                      </p>

                      <p className="text-faint text-xs">
                        Tipo: {cliente.tipoDocumento || "-"}
                      </p>
                    </div>

                    <div className="info-tile">
                      <p className="text-faint text-xs">
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
                  </div>

                  <div className="mt-4 border-t pt-4">
                    <AccionesCliente cliente={cliente} mobile />
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
                      <th className="px-4 py-4 text-left">Cliente</th>
                      <th className="px-4 py-4 text-left">Documento</th>
                      <th className="px-4 py-4 text-left">
                        Dirección fiscal
                      </th>
                      <th className="px-4 py-4 text-left">
                        Entidades relacionadas
                      </th>
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

                          <p className="text-faint text-xs">
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
