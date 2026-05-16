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
      <div className="text-center mt-20 text-red-500 font-semibold text-lg">
        🚫 Acceso denegado
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 text-text-primary">
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-200">Gestión de Usuarios</h1>
        <p className="text-sm text-neutral-400">
          Visualiza y administra los roles de los usuarios registrados.
        </p>
      </header>

      {/* Tabla */}
      {users.length === 0 ? (
        <p className="text-sm text-neutral-400 italic">
          No hay usuarios registrados.
        </p>
      ) : (
        <div className="overflow-x-auto bg-surface rounded-lg shadow-lg">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-800 sticky top-0">
              <tr className="text-neutral-300">
                <th className="p-3 text-left">Nombre</th>
                <th className="p-3 text-left">DNI</th>
                <th className="p-3 text-left">Rol</th>
                <th className="p-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => {
                const rolSeleccionado = rolesEditados[u._id] || u.role;
                const cambioPendiente = rolSeleccionado !== u.role;

                return (
                  <tr
                    key={u._id}
                    className={`${
                      i % 2 === 0 ? "bg-neutral-900/40" : "bg-neutral-900/20"
                    } hover:bg-neutral-800/60 transition`}
                  >
                    <td className="p-3 font-medium">{u.name}</td>
                    <td className="p-3">{u.dni}</td>
                    <td className="p-3">
                      <select
                        value={rolSeleccionado}
                        onChange={(e) => handleRoleChange(u._id, e.target.value)}
                        className="bg-input border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {rolesDisponibles.map((rol) => (
                          <option key={rol} value={rol}>
                            {rol}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => guardarCambio(u._id)}
                        disabled={!cambioPendiente || saving[u._id]}
                        className={`px-4 py-2 rounded-lg font-semibold shadow transition transform ${
                          cambioPendiente
                            ? "bg-blue-600 hover:bg-blue-500 text-white hover:scale-105"
                            : "bg-neutral-700 text-neutral-400 cursor-not-allowed"
                        }`}
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
      )}
    </div>
  );
};

export default GestionUsuarios;
