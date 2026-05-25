import { useEffect, useState } from "react";
import { Eye, Pencil, Power, PowerOff } from "lucide-react";
import MaquinariaModal from "../components/modals/MaquinariaModal";
import TablePagination from "../components/TablePagination";
import { useConfirm } from "../context/ConfirmContext";
import { useMaquinarias } from "../context/MaquinariaContext";
import { getRecordId } from "../utils/apiData";
import { notify } from "../utils/notify";

const estadoStyles = {
  OPERATIVA: "border-green-500/30 bg-green-500/10 text-green-300",
  EN_MANTENIMIENTO: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  INACTIVA: "border-red-500/30 bg-red-500/10 text-red-300",
  BAJA: "border-neutral-500/30 bg-neutral-500/10 text-neutral-300",
};

const tipoStyles = {
  STACKER: "border-blue-500/30 bg-blue-500/10 text-blue-300",
  MONTACARGA: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  GRUA: "border-violet-500/30 bg-violet-500/10 text-violet-300",
  GENERADOR: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
  COMPRESORA: "border-orange-500/30 bg-orange-500/10 text-orange-300",
  OTRO: "border-neutral-500/30 bg-neutral-500/10 text-neutral-300",
};

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

function MaquinariasPage() {
  const {
    maquinarias = [],
    obtenerMaquinarias,
    crearMaquinaria,
    actualizarMaquinaria,
    cambiarEstadoMaquinaria,
    paginationMaquinarias,
  } = useMaquinarias();
  const confirm = useConfirm();

  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState("create");
  const [maquinariaSeleccionada, setMaquinariaSeleccionada] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const cargarMaquinarias = async (
    page = paginationMaquinarias.page,
    searchValue = search
  ) => {
    try {
      setLoading(true);
      await obtenerMaquinarias?.({
        page,
        limit: paginationMaquinarias.limit,
        search: searchValue.trim(),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarMaquinarias(1, "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      cargarMaquinarias(1, search);
    }, 450);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const abrirCrear = () => {
    setMode("create");
    setMaquinariaSeleccionada(null);
    setModalOpen(true);
  };

  const abrirEditar = (maquinaria) => {
    setMode("edit");
    setMaquinariaSeleccionada(maquinaria);
    setModalOpen(true);
  };

  const abrirVer = (maquinaria) => {
    setMode("view");
    setMaquinariaSeleccionada(maquinaria);
    setModalOpen(true);
  };

  const cerrarModal = () => {
    setModalOpen(false);
    setMaquinariaSeleccionada(null);
  };

  const handleSubmit = async (data) => {
    const maquinariaId = getRecordId(maquinariaSeleccionada);

    if (mode === "edit" && maquinariaId) {
      await actualizarMaquinaria(maquinariaId, data);
      notify.success("Maquinaria actualizada correctamente");
    } else {
      await crearMaquinaria(data);
      notify.success("Maquinaria registrada correctamente");
    }

    cerrarModal();
    await cargarMaquinarias(paginationMaquinarias.page);
  };

  const handleCambiarEstado = async (maquinaria) => {
    const id = getRecordId(maquinaria);
    const estadoActual = maquinaria.estado || "OPERATIVA";
    const nuevoEstado = estadoActual === "OPERATIVA" ? "INACTIVA" : "OPERATIVA";
    const confirmar = await confirm({
      title:
        nuevoEstado === "OPERATIVA"
          ? "Activar maquinaria"
          : "Inactivar maquinaria",
      message: `¿Seguro que deseas ${
        nuevoEstado === "OPERATIVA" ? "activar" : "inactivar"
      } esta maquinaria?`,
      confirmText: nuevoEstado === "OPERATIVA" ? "Activar" : "Inactivar",
      variant: nuevoEstado === "OPERATIVA" ? "primary" : "danger",
    });

    if (!confirmar) return;

    try {
      await cambiarEstadoMaquinaria(id, nuevoEstado);
      notify.success("Estado actualizado correctamente");
      await cargarMaquinarias(paginationMaquinarias.page);
    } catch (error) {
      notify.error(
        error.response?.data?.message || "Error al cambiar estado de maquinaria"
      );
    }
  };

  return (
    <div className="w-full py-4">
      <div className="page-wrap">
        <header className="page-hero">
          <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="eyebrow">Datos maestros</div>
              <h1 className="page-title">Maquinarias</h1>
              <p className="page-description">
                Registra stackers, montacargas, grúas y equipos internos para
                controlar inventario, operación y mantenimiento.
              </p>
            </div>

            <button
              type="button"
              onClick={abrirCrear}
              className="btn-primary px-3 py-2"
            >
              Nueva maquinaria
            </button>
          </div>
        </header>

        <section className="panel p-4">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="input w-full p-3"
            placeholder="Buscar por código, nombre, tipo, marca, modelo, serie o ubicación"
          />
        </section>

        {loading ? (
          <div className="panel p-8 text-center">
            <div className="mx-auto mb-3 h-9 w-9 animate-spin rounded-full border-2 border-neutral-700 border-t-blue-500" />
            <p className="text-muted text-sm">Cargando maquinarias...</p>
          </div>
        ) : maquinarias.length === 0 ? (
          <div className="empty-panel">
            <h2 className="text-main text-lg font-semibold">
              No hay maquinarias registradas
            </h2>
            <button
              type="button"
              onClick={abrirCrear}
              className="btn-primary mt-4 px-3 py-2"
            >
              Crear maquinaria
            </button>
          </div>
        ) : (
          <>
            <div className="grid gap-4 lg:hidden">
              {maquinarias.map((maquinaria) => (
                <article key={getRecordId(maquinaria)} className="mobile-card">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-faint text-xs">{maquinaria.codigo}</p>
                      <h2 className="text-main text-lg font-bold">
                        {maquinaria.nombre}
                      </h2>
                    </div>
                    <Badge className={estadoStyles[maquinaria.estado] || estadoStyles.INACTIVA}>
                      {maquinaria.estado}
                    </Badge>
                  </div>

                  <div className="grid gap-3 text-sm">
                    <div className="info-tile">
                      <p className="text-faint text-xs">Tipo</p>
                      <div className="mt-1">
                        <Badge className={tipoStyles[maquinaria.tipo] || tipoStyles.OTRO}>
                          {maquinaria.tipo}
                        </Badge>
                      </div>
                    </div>
                    <div className="info-tile">
                      <p className="text-faint text-xs">Marca / modelo</p>
                      <p className="text-main font-semibold">
                        {[maquinaria.marca, maquinaria.modelo].filter(Boolean).join(" / ") || "-"}
                      </p>
                    </div>
                    <div className="info-tile">
                      <p className="text-faint text-xs">Serie</p>
                      <p className="text-main font-semibold">
                        {maquinaria.serie || "-"}
                      </p>
                    </div>
                    <div className="info-tile">
                      <p className="text-faint text-xs">Horómetro / Km</p>
                      <p className="text-main font-semibold">
                        {formatNumber(maquinaria.horometroActual)} h / {formatNumber(maquinaria.kilometrajeActual)} km
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
                    <button type="button" onClick={() => abrirVer(maquinaria)} className="btn-secondary btn-icon" title="Ver maquinaria">
                      <Eye />
                    </button>
                    <button type="button" onClick={() => abrirEditar(maquinaria)} className="btn-primary btn-icon" title="Editar maquinaria">
                      <Pencil />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCambiarEstado(maquinaria)}
                      className={`${maquinaria.estado === "OPERATIVA" ? "btn-danger" : "btn-success"} btn-icon`}
                      title={maquinaria.estado === "OPERATIVA" ? "Inactivar maquinaria" : "Activar maquinaria"}
                    >
                      {maquinaria.estado === "OPERATIVA" ? <PowerOff /> : <Power />}
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <div className="data-table-wrap">
              <div className="table-scroll">
                <table className="data-table w-full min-w-[1180px] text-sm">
                  <thead>
                    <tr>
                      <th className="px-4 py-4 text-left">Código</th>
                      <th className="px-4 py-4 text-left">Maquinaria</th>
                      <th className="px-4 py-4 text-left">Tipo</th>
                      <th className="px-4 py-4 text-left">Marca</th>
                      <th className="px-4 py-4 text-left">Modelo</th>
                      <th className="px-4 py-4 text-left">Serie</th>
                      <th className="px-4 py-4 text-left">Ubicación</th>
                      <th className="px-4 py-4 text-left">Horómetro</th>
                      <th className="px-4 py-4 text-left">Kilometraje</th>
                      <th className="px-4 py-4 text-center">Estado</th>
                      <th className="px-4 py-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {maquinarias.map((maquinaria) => (
                      <tr key={getRecordId(maquinaria)}>
                        <td className="whitespace-nowrap px-4 py-4 font-bold text-main">
                          {maquinaria.codigo}
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-main font-semibold">{maquinaria.nombre}</p>
                          <p className="text-faint text-xs">{maquinaria.anio || "-"}</p>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">
                          <Badge className={tipoStyles[maquinaria.tipo] || tipoStyles.OTRO}>
                            {maquinaria.tipo}
                          </Badge>
                        </td>
                        <td className="text-muted whitespace-nowrap px-4 py-4">{maquinaria.marca || "-"}</td>
                        <td className="text-muted whitespace-nowrap px-4 py-4">{maquinaria.modelo || "-"}</td>
                        <td className="text-muted whitespace-nowrap px-4 py-4">{maquinaria.serie || "-"}</td>
                        <td className="text-muted whitespace-nowrap px-4 py-4">{maquinaria.ubicacion || "-"}</td>
                        <td className="text-muted whitespace-nowrap px-4 py-4">{formatNumber(maquinaria.horometroActual)}</td>
                        <td className="text-muted whitespace-nowrap px-4 py-4">{formatNumber(maquinaria.kilometrajeActual)}</td>
                        <td className="whitespace-nowrap px-4 py-4 text-center">
                          <Badge className={estadoStyles[maquinaria.estado] || estadoStyles.INACTIVA}>
                            {maquinaria.estado}
                          </Badge>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">
                          <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => abrirVer(maquinaria)} className="btn-secondary btn-icon" title="Ver maquinaria">
                              <Eye />
                            </button>
                            <button type="button" onClick={() => abrirEditar(maquinaria)} className="btn-primary btn-icon" title="Editar maquinaria">
                              <Pencil />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCambiarEstado(maquinaria)}
                              className={`${maquinaria.estado === "OPERATIVA" ? "btn-danger" : "btn-success"} btn-icon`}
                              title={maquinaria.estado === "OPERATIVA" ? "Inactivar maquinaria" : "Activar maquinaria"}
                            >
                              {maquinaria.estado === "OPERATIVA" ? <PowerOff /> : <Power />}
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
              page={paginationMaquinarias.page}
              totalPages={paginationMaquinarias.totalPages}
              total={paginationMaquinarias.total}
              limit={paginationMaquinarias.limit}
              onPageChange={(page) => cargarMaquinarias(page)}
            />
          </>
        )}

        <MaquinariaModal
          isOpen={modalOpen}
          onClose={cerrarModal}
          onSubmit={handleSubmit}
          mode={mode}
          maquinaria={maquinariaSeleccionada}
        />
      </div>
    </div>
  );
}

export default MaquinariasPage;
