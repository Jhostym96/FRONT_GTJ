import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useUsuarios } from "../context/UserContext";
import { notify } from "../utils/notify";
import TablePagination from "../components/TablePagination";
import { getRecordId } from "../utils/apiData";

const rolesDisponibles = [
  "User",
  "Administrador",
  "Superadministrador",
  "Coordinador",
  "Almacen",
];

const GestionUsuarios = () => {
  const { user, isAuthenticated } = useAuth();
  const { usuarios, paginationUsuarios, cargarUsuarios, cambiarRol } =
    useUsuarios();
  const [rolesEditados, setRolesEditados] = useState({});
  const [saving, setSaving] = useState({}); // estado de carga por usuario
  const isAdmin = ["Administrador", "Superadministrador"].includes(user?.role);

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      cargarUsuarios({ page: 1, limit: 10 });
    }
  }, [cargarUsuarios, isAdmin, isAuthenticated]);

  const recargarUsuarios = (page = paginationUsuarios.page) =>
    cargarUsuarios({ page, limit: paginationUsuarios.limit });

  const handleRoleChange = (userId, newRole) => {
    setRolesEditados((prev) => ({ ...prev, [userId]: newRole }));
  };

  const guardarCambio = async (userId) => {
    const nuevoRol = rolesEditados[userId];
    if (!nuevoRol) return;

    try {
      setSaving((prev) => ({ ...prev, [userId]: true }));
      await cambiarRol(userId, nuevoRol);
      await recargarUsuarios();
      notify.success("Rol actualizado con éxito");
    } catch (error) {
      console.error("Error al actualizar rol:", error);
      notify.error(error.response?.data?.message || "Error al actualizar rol");
    } finally {
      setSaving((prev) => ({ ...prev, [userId]: false }));
    }
  };

  if (!isAuthenticated || !isAdmin) {
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

          </div>
        </header>

        {usuarios.length === 0 ? (
          <div className="empty-panel">
            <h2 className="text-main text-lg font-semibold">
              No hay usuarios registrados
            </h2>
            <p className="text-muted mt-1 text-sm">
              Cuando se creen usuarios aparecerán en esta tabla.
            </p>
          </div>
        ) : (
          <>
            <div className="data-table-wrap !block">
              <div className="table-scroll">
                <table className="data-table min-w-[760px] text-sm">
                <thead>
                  <tr>
                    <th className="px-4 py-4 text-left">Nombre</th>
                    <th className="px-4 py-4 text-left">DNI</th>
                    <th className="px-4 py-4 text-left">Rol</th>
                    <th className="px-4 py-4 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((u, index) => {
                    const userId =
                      getRecordId(u) || `${u.dni || "usuario"}-${index}`;
                    const rolSeleccionado = rolesEditados[userId] || u.role;
                    const cambioPendiente = rolSeleccionado !== u.role;

                    return (
                      <tr key={userId}>
                        <td className="text-main px-4 py-4 font-semibold">
                          {u.name}
                        </td>
                        <td className="text-muted px-4 py-4">{u.dni}</td>
                        <td className="px-4 py-4">
                          <select
                            value={rolSeleccionado}
                            onChange={(e) =>
                              handleRoleChange(userId, e.target.value)
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
                            onClick={() => guardarCambio(userId)}
                            disabled={!cambioPendiente || saving[userId]}
                            className={
                              cambioPendiente
                                ? "btn-primary px-3 py-1.5"
                                : "btn-secondary px-3 py-1.5"
                            }
                          >
                            {saving[userId] ? "Guardando..." : "Guardar"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                </table>
              </div>
            </div>

            <TablePagination
              page={paginationUsuarios.page}
              totalPages={paginationUsuarios.totalPages}
              total={paginationUsuarios.total}
              limit={paginationUsuarios.limit}
              onPageChange={recargarUsuarios}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default GestionUsuarios;
