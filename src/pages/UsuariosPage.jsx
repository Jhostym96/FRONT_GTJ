import { useEffect, useState } from "react";
import { useUsuarios } from "../context/UserContext";
import UsuarioForm from "../components/UsuarioForm";
import TablePagination from "../components/TablePagination";
import { getRecordId } from "../utils/apiData";

// 👇 Definimos los roles igual que en el modelo Employee
const rolesDisponibles = [
  "User",
  "Administrador",
  "Superadministrador",
  "Coordinador",
  "Almacen",
];

const UsuariosPage = () => {
  const {
    usuarios,
    loading,
    paginationUsuarios,
    desactivarUsuario,
    activarUsuario,
    cambiarRol,
    cargarUsuarios,
  } = useUsuarios();

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);

  useEffect(() => {
    cargarUsuarios({ page: 1, limit: 10 });
  }, [cargarUsuarios]);

  const recargarUsuarios = (page = paginationUsuarios.page) =>
    cargarUsuarios({ page, limit: paginationUsuarios.limit });

  const handleToggleActivo = async (usuario) => {
    const usuarioId = getRecordId(usuario);

    if (!usuarioId) return;

    if (usuario.activo) {
      await desactivarUsuario(usuarioId);
    } else {
      await activarUsuario(usuarioId);
    }

    await recargarUsuarios();
  };

  const handleCambiarRol = async (usuario, nuevoRol) => {
    const usuarioId = getRecordId(usuario);

    if (!usuarioId) return;

    if (nuevoRol && nuevoRol !== usuario.role) {
      await cambiarRol(usuarioId, nuevoRol);
      await recargarUsuarios();
    }
  };

  const abrirFormulario = (usuario = null) => {
    setUsuarioSeleccionado(usuario);
    setMostrarFormulario(true);
  };

  const cerrarFormulario = () => {
    setUsuarioSeleccionado(null);
    setMostrarFormulario(false);
  };

  const handlePageChange = (page) => {
    recargarUsuarios(page);
  };

  return (
    <div className="w-full py-4">
      <div className="page-wrap">
        <header className="page-hero">
          <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="eyebrow">Administración</div>
              <h1 className="page-title">Gestión de Usuarios</h1>
              <p className="page-description">
                Administra accesos, roles y estado de los usuarios del sistema.
              </p>
            </div>

            <button
              type="button"
              onClick={() => abrirFormulario()}
              className="btn-primary px-5 py-3"
            >
              Nuevo usuario
            </button>
          </div>
        </header>

        {loading ? (
          <div className="panel p-8 text-center">
            <div className="mx-auto mb-3 h-9 w-9 animate-spin rounded-full border-2 border-[var(--app-border)] border-t-blue-500" />
            <p className="text-muted text-sm">Cargando usuarios...</p>
          </div>
        ) : usuarios.length === 0 ? (
          <div className="empty-panel">
            <h2 className="text-main text-lg font-semibold">
              No hay usuarios registrados
            </h2>
            <p className="text-muted mt-1 text-sm">
              Crea el primer usuario para asignarle acceso al sistema.
            </p>
            <button
              type="button"
              onClick={() => abrirFormulario()}
              className="btn-primary mt-5 px-5 py-3"
            >
              Crear usuario
            </button>
          </div>
        ) : (
          <div className="data-table-wrap !block">
            <div className="table-scroll">
              <table className="data-table min-w-[900px] text-left text-sm">
                <thead>
                  <tr>
                    <th className="px-4 py-4">DNI</th>
                    <th className="px-4 py-4">Nombre</th>
                    <th className="px-4 py-4">Email</th>
                    <th className="px-4 py-4">Rol</th>
                    <th className="px-4 py-4">Activo</th>
                    <th className="px-4 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((usuario, index) => {
                    const usuarioId =
                      getRecordId(usuario) ||
                      `${usuario.dni || "usuario"}-${index}`;

                    return (
                      <tr key={usuarioId}>
                        <td className="text-muted px-4 py-4">{usuario.dni}</td>
                        <td className="text-main px-4 py-4 font-semibold">
                          {usuario.name}
                        </td>
                        <td className="text-muted px-4 py-4">
                          {usuario.email}
                        </td>
                        <td className="px-4 py-4 capitalize">
                          <select
                            value={usuario.role}
                            onChange={(e) =>
                              handleCambiarRol(usuario, e.target.value)
                            }
                            className="input w-auto min-w-[170px] px-2 py-1 text-xs"
                          >
                            {rolesDisponibles.map((rol) => (
                              <option key={rol} value={rol}>
                                {rol}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-bold tracking-wide ${
                              usuario.activo
                                ? "border-green-500/30 bg-green-500/10 text-green-400"
                                : "border-red-500/30 bg-red-500/10 text-red-400"
                            }`}
                          >
                            {usuario.activo ? "Activo" : "Inactivo"}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleToggleActivo(usuario)}
                              className={`${
                                usuario.activo ? "btn-danger" : "btn-success"
                              } px-3 py-2 text-xs`}
                            >
                              {usuario.activo ? "Desactivar" : "Activar"}
                            </button>

                            <button
                              type="button"
                              onClick={() => abrirFormulario(usuario)}
                              className="btn-primary px-3 py-2 text-xs"
                            >
                              Editar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && usuarios.length > 0 && (
          <TablePagination
            page={paginationUsuarios.page}
            totalPages={paginationUsuarios.totalPages}
            total={paginationUsuarios.total}
            limit={paginationUsuarios.limit}
            onPageChange={handlePageChange}
          />
        )}

        {mostrarFormulario && (
          <div className="modal-backdrop">
            <div className="modal-panel relative max-w-md animate-fade-in">
              <button
                type="button"
                onClick={cerrarFormulario}
                className="text-muted absolute right-4 top-3 text-2xl hover:text-blue-500"
                aria-label="Cerrar formulario"
              >
                ×
              </button>

              <UsuarioForm
                usuario={usuarioSeleccionado}
                onSuccess={() => {
                  cerrarFormulario();
                  recargarUsuarios();
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsuariosPage;
