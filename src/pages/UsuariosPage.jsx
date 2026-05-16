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
    <div className="min-h-screen bg-gray-950 text-text-primary p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">👥 Gestión de Usuarios</h1>
        <button onClick={() => abrirFormulario()} className="btn btn-primary">
          + Nuevo Usuario
        </button>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="flex items-center justify-center py-10 text-text-secondary">
          <svg
            className="animate-spin h-6 w-6 mr-2 text-sky-500"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Cargando usuarios...
        </div>
      ) : (
        <div className="overflow-x-auto bg-surface rounded-lg shadow-md">
          <table className="min-w-full text-sm text-left border border-gray-600 rounded-md">
            <thead className="bg-navbar text-text-secondary uppercase text-xs">
              <tr>
                <th className="px-4 py-3">DNI</th>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Activo</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => (
                <tr
                  key={usuario._id}
                  className="border-t border-neutral-800 hover:bg-neutral-800/40 transition"
                >
                  <td className="px-4 py-2">{usuario.dni}</td>
                  <td className="px-4 py-2">{usuario.name}</td>
                  <td className="px-4 py-2">{usuario.email}</td>
                  <td className="px-4 py-2 capitalize">
                    <select
                      value={usuario.role}
                      onChange={(e) =>
                        handleCambiarRol(usuario, e.target.value)
                      }
                      className="bg-background border border-neutral-700 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
                    >
                      {rolesDisponibles.map((rol) => (
                        <option key={rol} value={rol}>
                          {rol}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        usuario.activo
                          ? "bg-button-success"
                          : "bg-button-danger"
                      } text-white`}
                    >
                      {usuario.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-2 space-x-2">
                    <button
                      onClick={() => handleToggleActivo(usuario)}
                      className={`btn ${
                        usuario.activo ? "btn-danger" : "btn-success"
                      } text-xs`}
                    >
                      {usuario.activo ? "Desactivar" : "Activar"}
                    </button>

                    <button
                      onClick={() => abrirFormulario(usuario)}
                      className="btn btn-primary text-xs"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal del Formulario */}
      {mostrarFormulario && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-surface p-6 rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto animate-fade-in relative">
            <button
              onClick={cerrarFormulario}
              className="absolute top-2 right-3 text-text-secondary hover:text-white text-xl"
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
  );
};

export default UsuariosPage;
