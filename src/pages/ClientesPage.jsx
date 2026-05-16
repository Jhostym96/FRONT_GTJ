import { useEffect, useMemo, useState } from "react";
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

  const totalClientes = useMemo(() => clientes?.length || 0, [clientes]);

  const clientesActivos = useMemo(
    () => clientes?.filter((cliente) => cliente.activo).length || 0,
    [clientes]
  );

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

  const CountBadge = ({ value, color = "blue" }) => {
    const colors = {
      blue: "border-blue-500/30 bg-blue-500/10 text-blue-300",
      purple: "border-purple-500/30 bg-purple-500/10 text-purple-300",
    };

    return (
      <span
        className={`inline-flex min-w-10 items-center justify-center rounded-full border px-3 py-1 text-xs font-bold ${
          colors[color] || colors.blue
        }`}
      >
        {value || 0}
      </span>
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
          className="rounded-lg bg-neutral-700/80 px-3 py-2 text-xs font-semibold text-neutral-100 transition hover:bg-neutral-600"
        >
          Ver
        </button>

        <button
          type="button"
          onClick={() => abrirEditar(cliente)}
          className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-500"
        >
          Editar
        </button>

        <button
          type="button"
          onClick={() => handleDelete(clienteId)}
          className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-red-500"
        >
          Eliminar
        </button>
      </div>
    );
  };

  return (
    <div className="w-full px-2 py-4 text-text-primary sm:px-4 lg:px-4">
      <div className="mx-auto flex w-full max-w-[98%] flex-col gap-5">
        <header className="overflow-hidden rounded-2xl border border-neutral-800 bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 shadow-xl">
          <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 inline-flex rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300">
                Gestión de transporte
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-gray-100 sm:text-3xl">
                Clientes
              </h1>

              <p className="mt-1 max-w-2xl text-sm text-neutral-400">
                Administra los clientes, sus remitentes, destinatarios y
                direcciones para la emisión de órdenes y guías.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-neutral-800 bg-neutral-950/50 px-4 py-3">
                  <p className="text-xs text-neutral-500">Total clientes</p>
                  <p className="text-xl font-bold text-gray-100">
                    {totalClientes}
                  </p>
                </div>

                <div className="rounded-xl border border-neutral-800 bg-neutral-950/50 px-4 py-3">
                  <p className="text-xs text-neutral-500">Activos</p>
                  <p className="text-xl font-bold text-green-300">
                    {clientesActivos}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={abrirCrear}
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-950/30 transition hover:bg-blue-500 active:scale-[0.98]"
              >
                Nuevo cliente
              </button>
            </div>
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
          <div className="rounded-2xl border border-neutral-800 bg-surface p-8 text-center shadow-lg">
            <div className="mx-auto mb-3 h-9 w-9 animate-spin rounded-full border-2 border-neutral-700 border-t-blue-500" />
            <p className="text-sm text-neutral-400">Cargando clientes...</p>
          </div>
        ) : clientes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-700 bg-surface p-8 text-center shadow-lg">
            <h2 className="text-lg font-semibold text-gray-200">
              No hay clientes registrados
            </h2>

            <p className="mt-1 text-sm text-neutral-400">
              Registra tu primer cliente para asociar remitentes,
              destinatarios y direcciones.
            </p>

            <button
              type="button"
              onClick={abrirCrear}
              className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-500"
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
                  className="rounded-2xl border border-neutral-800 bg-surface p-4 shadow-lg"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium text-neutral-500">
                        Cliente
                      </p>

                      <h2 className="text-lg font-bold text-gray-100">
                        {cliente.razonSocial || "-"}
                      </h2>
                    </div>

                    <EstadoBadge activo={cliente.activo} />
                  </div>

                  <div className="grid gap-3 text-sm">
                    <div className="rounded-xl bg-neutral-900/60 p-3">
                      <p className="text-xs text-neutral-500">Documento</p>

                      <p className="font-semibold text-neutral-200">
                        {cliente.numeroDocumento || "-"}
                      </p>

                      <p className="text-xs text-neutral-500">
                        Tipo: {cliente.tipoDocumento || "-"}
                      </p>
                    </div>

                    <div className="rounded-xl bg-neutral-900/60 p-3">
                      <p className="text-xs text-neutral-500">
                        Dirección fiscal
                      </p>

                      <p className="mt-1 text-neutral-300">
                        {cliente.direccionFiscal || "-"}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-neutral-900/60 p-3">
                        <p className="text-xs text-neutral-500">Remitentes</p>

                        <div className="mt-2">
                          <CountBadge
                            value={getTotalRemitentes(cliente)}
                            color="blue"
                          />
                        </div>
                      </div>

                      <div className="rounded-xl bg-neutral-900/60 p-3">
                        <p className="text-xs text-neutral-500">
                          Destinatarios
                        </p>

                        <div className="mt-2">
                          <CountBadge
                            value={getTotalDestinatarios(cliente)}
                            color="purple"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-neutral-800 pt-4">
                    <AccionesCliente cliente={cliente} mobile />
                  </div>
                </article>
              ))}
            </div>

            {/* Tabla en desktop */}
            <div className="hidden overflow-hidden rounded-2xl border border-neutral-800 bg-surface shadow-xl lg:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px] text-sm">
                  <thead className="bg-neutral-900">
                    <tr className="border-b border-neutral-800 text-xs uppercase tracking-wide text-neutral-400">
                      <th className="px-4 py-4 text-left">Cliente</th>
                      <th className="px-4 py-4 text-left">Documento</th>
                      <th className="px-4 py-4 text-left">
                        Dirección fiscal
                      </th>
                      <th className="px-4 py-4 text-center">Remitentes</th>
                      <th className="px-4 py-4 text-center">Destinatarios</th>
                      <th className="px-4 py-4 text-center">Estado</th>
                      <th className="px-4 py-4 text-right">Acciones</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-neutral-800">
                    {clientes.map((cliente) => (
                      <tr
                        key={getClienteId(cliente)}
                        className="bg-neutral-950/20 transition hover:bg-neutral-800/50"
                      >
                        <td className="min-w-[230px] px-4 py-4">
                          <p className="max-w-[260px] truncate font-bold text-gray-100">
                            {cliente.razonSocial || "-"}
                          </p>
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-neutral-300">
                          <p className="font-semibold">
                            {cliente.numeroDocumento || "-"}
                          </p>

                          <p className="text-xs text-neutral-500">
                            Tipo: {cliente.tipoDocumento || "-"}
                          </p>
                        </td>

                        <td className="min-w-[300px] px-4 py-4 text-neutral-300">
                          <p className="max-w-[420px] truncate">
                            {cliente.direccionFiscal || "-"}
                          </p>
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-center">
                          <CountBadge
                            value={getTotalRemitentes(cliente)}
                            color="blue"
                          />
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-center">
                          <CountBadge
                            value={getTotalDestinatarios(cliente)}
                            color="purple"
                          />
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