import { useEffect, useState } from "react";
import { Pencil, Power, PowerOff } from "lucide-react";
import { useUsuarios } from "../context/UserContext";
import UsuarioForm from "../components/UsuarioForm";
import TablePagination from "../components/TablePagination";
import { getRecordId } from "../utils/apiData";
import {
  allMenus,
  getDefaultUserPermissions,
  getEffectiveUserPermissions,
} from "../utils/permissions";
import { notify } from "../utils/notify";

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
    actualizarPermisosUsuario,
    cargarUsuarios,
  } = useUsuarios();

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mostrarPermisos, setMostrarPermisos] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [permisosForm, setPermisosForm] = useState({ routes: {} });
  const [guardandoPermisos, setGuardandoPermisos] = useState(false);

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

  const abrirPermisos = (usuario) => {
    setUsuarioSeleccionado(usuario);
    setPermisosForm(getEffectiveUserPermissions(usuario));
    setMostrarPermisos(true);
  };

  const cerrarPermisos = () => {
    setMostrarPermisos(false);
    setUsuarioSeleccionado(null);
    setPermisosForm({ routes: {} });
  };

  const togglePermiso = (path, action) => {
    setPermisosForm((prev) => {
      const current = prev.routes?.[path] || {};
      const nextValue = !current[action];
      const nextPerms = {
        ...current,
        [action]: nextValue,
      };

      if (action !== "view" && nextValue) {
        nextPerms.view = true;
      }

      if (action === "view" && !nextValue) {
        nextPerms.create = false;
        nextPerms.edit = false;
        nextPerms.delete = false;
      }

      return {
        routes: {
          ...(prev.routes || {}),
          [path]: nextPerms,
        },
      };
    });
  };

  const resetPermisosPorRol = () => {
    setPermisosForm(getDefaultUserPermissions(usuarioSeleccionado?.role));
  };

  const guardarPermisos = async () => {
    const usuarioId = getRecordId(usuarioSeleccionado);
    if (!usuarioId) return;

    try {
      setGuardandoPermisos(true);
      await actualizarPermisosUsuario(usuarioId, permisosForm);
      notify.success("Permisos actualizados correctamente");
      cerrarPermisos();
      await recargarUsuarios();
    } catch (error) {
      notify.error(
        error.response?.data?.message || "No se pudieron actualizar permisos"
      );
    } finally {
      setGuardandoPermisos(false);
    }
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
              className="btn-primary px-3 py-2"
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
              className="btn-primary mt-4 px-3 py-2"
            >
              Crear usuario
            </button>
          </div>
        ) : (
          <div className="data-table-wrap !block w-full">
            <div className="table-scroll">
              <table className="data-table w-full min-w-[1040px] text-left text-sm">
                <thead>
                  <tr>
                    <th className="px-4 py-4">DNI</th>
                    <th className="px-4 py-4">Nombre</th>
                    <th className="px-4 py-4">Email</th>
                    <th className="px-4 py-4">Rol</th>
                    <th className="px-4 py-4">Permisos</th>
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
                          <button
                            type="button"
                            onClick={() => abrirPermisos(usuario)}
                            className="btn-secondary px-3 py-1.5 text-xs"
                          >
                            Configurar
                          </button>
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
                              } btn-icon`}
                              title={usuario.activo ? "Desactivar usuario" : "Activar usuario"}
                              aria-label={usuario.activo ? "Desactivar usuario" : "Activar usuario"}
                            >
                              {usuario.activo ? <PowerOff /> : <Power />}
                            </button>

                            <button
                              type="button"
                              onClick={() => abrirFormulario(usuario)}
                              className="btn-primary btn-icon"
                              title="Editar usuario"
                              aria-label="Editar usuario"
                            >
                              <Pencil />
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

        {mostrarPermisos && (
          <div className="modal-backdrop">
            <div className="modal-panel max-w-5xl">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">Permisos de usuario</h2>
                  <p className="text-muted text-sm">
                    {usuarioSeleccionado?.name} - {usuarioSeleccionado?.role}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={cerrarPermisos}
                  className="text-muted text-2xl hover:text-blue-500"
                >
                  ×
                </button>
              </div>

              <div className="mb-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={resetPermisosPorRol}
                  className="btn-secondary px-3 py-2"
                >
                  Restablecer por rol
                </button>
              </div>

              <div className="table-scroll max-h-[60vh]">
                <table className="data-table w-full min-w-[820px] text-sm">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left">Módulo</th>
                      <th className="px-4 py-3 text-center">Ver</th>
                      <th className="px-4 py-3 text-center">Crear</th>
                      <th className="px-4 py-3 text-center">Editar</th>
                      <th className="px-4 py-3 text-center">Eliminar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allMenus.flatMap((menu) =>
                      menu.children.map((child) => {
                        const permisos = permisosForm.routes?.[child.path] || {};

                        return (
                          <tr key={child.path}>
                            <td className="px-4 py-3">
                              <p className="text-main font-semibold">
                                {child.label}
                              </p>
                              <p className="text-faint text-xs">{menu.label}</p>
                            </td>
                            {["view", "create", "edit", "delete"].map((action) => (
                              <td key={action} className="px-4 py-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={Boolean(permisos[action])}
                                  onChange={() => togglePermiso(child.path, action)}
                                  className="h-4 w-4"
                                />
                              </td>
                            ))}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={cerrarPermisos}
                  className="btn-secondary px-4 py-2"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={guardarPermisos}
                  disabled={guardandoPermisos}
                  className="btn-primary px-4 py-2"
                >
                  {guardandoPermisos ? "Guardando..." : "Guardar permisos"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsuariosPage;
