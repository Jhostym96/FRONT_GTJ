import { useEffect, useState } from "react";
import { useUsuarios } from "../context/UserContext";
import UsuarioForm from "../components/UsuarioForm";

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
    desactivarUsuario,
    activarUsuario,
    cambiarRol,
    cargarUsuarios,
  } = useUsuarios();

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const handleToggleActivo = (usuario) => {
    if (usuario.activo) {
      desactivarUsuario(usuario._id);
    } else {
      activarUsuario(usuario._id);
    }
  };

  const handleCambiarRol = (usuario, nuevoRol) => {
    if (nuevoRol && nuevoRol !== usuario.role) {
      cambiarRol(usuario._id, nuevoRol);
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

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="info-tile border px-4 py-3">
                <p className="text-faint text-xs">Total usuarios</p>
                <p className="text-main text-xl font-bold">
                  {usuarios?.length || 0}
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
          <div className="data-table-wrap">
            <div className="overflow-x-auto">
              <table className="data-table min-w-full text-left text-sm">
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
                  {usuarios.map((usuario) => (
                    <tr key={usuario._id}>
                      <td className="text-muted px-4 py-4">{usuario.dni}</td>
                      <td className="text-main px-4 py-4 font-semibold">
                        {usuario.name}
                      </td>
                      <td className="text-muted px-4 py-4">{usuario.email}</td>
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {mostrarFormulario && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm">
            <div className="panel relative max-h-[90vh] w-full max-w-md overflow-y-auto p-6 animate-fade-in">
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
                  cargarUsuarios();
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
