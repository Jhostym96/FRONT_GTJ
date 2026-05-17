import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const rolesDisponibles = ["usuario", "administrador", "superadministrador"];

const GestionUsuarios = () => {
  const { user, isAuthenticated, users, getAllUsers, updateUserRole } = useAuth();
  const [rolesEditados, setRolesEditados] = useState({});
  const [saving, setSaving] = useState({}); // estado de carga por usuario

  useEffect(() => {
    if (isAuthenticated && ["administrador", "superadministrador"].includes(user.role)) {
      getAllUsers();
    }
  }, [isAuthenticated, user, getAllUsers]);

  const handleRoleChange = (userId, newRole) => {
    setRolesEditados((prev) => ({ ...prev, [userId]: newRole }));
  };

  const guardarCambio = async (userId) => {
    const nuevoRol = rolesEditados[userId];
    if (!nuevoRol) return;

    try {
      setSaving((prev) => ({ ...prev, [userId]: true }));
      await updateUserRole(userId, nuevoRol);
      toast.success("Rol actualizado con éxito");
    } catch (error) {
      console.error("Error al actualizar rol:", error);
      toast.error(error.response?.data?.message || "Error al actualizar rol");
    } finally {
      setSaving((prev) => ({ ...prev, [userId]: false }));
    }
  };

  if (!isAuthenticated || !["administrador", "superadministrador"].includes(user.role)) {
    return (
      <div className="empty-panel mx-auto mt-20 max-w-xl">
        <h2 className="text-lg font-semibold text-red-500">Acceso denegado</h2>
        <p className="text-muted mt-1 text-sm">
          No tienes permisos para administrar usuarios.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full py-4">
      <div className="page-wrap">
        <header className="page-hero">
          <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="eyebrow">Administración</div>
              <h1 className="page-title">Gestión de Usuarios</h1>
              <p className="page-description">
                Visualiza y administra los roles de los usuarios registrados.
              </p>
            </div>

            <div className="info-tile border px-4 py-3">
              <p className="text-faint text-xs">Usuarios</p>
              <p className="text-main text-xl font-bold">{users.length}</p>
            </div>
          </div>
        </header>

        {users.length === 0 ? (
          <div className="empty-panel">
            <h2 className="text-main text-lg font-semibold">
              No hay usuarios registrados
            </h2>
            <p className="text-muted mt-1 text-sm">
              Cuando se creen usuarios aparecerán en esta tabla.
            </p>
          </div>
        ) : (
          <div className="data-table-wrap">
            <div className="overflow-x-auto">
              <table className="data-table min-w-full text-sm">
                <thead>
                  <tr>
                    <th className="px-4 py-4 text-left">Nombre</th>
                    <th className="px-4 py-4 text-left">DNI</th>
                    <th className="px-4 py-4 text-left">Rol</th>
                    <th className="px-4 py-4 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const rolSeleccionado = rolesEditados[u._id] || u.role;
                    const cambioPendiente = rolSeleccionado !== u.role;

                    return (
                      <tr key={u._id}>
                        <td className="text-main px-4 py-4 font-semibold">
                          {u.name}
                        </td>
                        <td className="text-muted px-4 py-4">{u.dni}</td>
                        <td className="px-4 py-4">
                          <select
                            value={rolSeleccionado}
                            onChange={(e) =>
                              handleRoleChange(u._id, e.target.value)
                            }
                            className="input w-auto min-w-[180px] px-3 py-2 text-sm"
                          >
                            {rolesDisponibles.map((rol) => (
                              <option key={rol} value={rol}>
                                {rol}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <button
                            type="button"
                            onClick={() => guardarCambio(u._id)}
                            disabled={!cambioPendiente || saving[u._id]}
                            className={
                              cambioPendiente
                                ? "btn-primary px-4 py-2"
                                : "btn-secondary px-4 py-2"
                            }
                          >
                            {saving[u._id] ? "Guardando..." : "Guardar"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GestionUsuarios;
