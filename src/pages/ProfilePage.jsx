import { useAuth } from "../context/AuthContext";
import { useUsuarios } from "../context/UserContext"; // 👈 usamos el contexto
import { useState } from "react";
import { notify } from "../utils/notify";
import { FieldMessage } from "../components/ui/Accessibility";

function ProfilePage() {
  const { user } = useAuth();
  const { actualizarPerfil } = useUsuarios(); // 👈 obtenemos la función del contexto

  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.email) {
      notify.error("El correo no puede estar vacío");
      return;
    }

    try {
      setLoading(true);

      // 👉 Ahora usamos el endpoint /usuarios/perfil a través del contexto
      await actualizarPerfil({
        email: form.email,
        password: form.password || undefined,
      });

      notify.success("Perfil actualizado correctamente");
      setForm({ ...form, password: "" }); // limpiar campo contraseña
    } catch (err) {
      console.error(err);
      notify.error(
        err.response?.data?.error || "No se pudo actualizar el perfil"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrap py-4">
      <div className="mx-auto w-full max-w-xl card animate-fade-in">
        <h1 className="card-header">Mi perfil</h1>
        <p className="page-description">
          Actualiza tus datos de acceso de forma segura.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Nombre (solo lectura, pero lo puedes habilitar si quieres editarlo) */}
          <div>
            <label htmlFor="profile-name" className="field-label">
              Nombre
            </label>
            <input
              id="profile-name"
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="input"
              disabled
            />
          </div>

          {/* Correo editable */}
          <div>
            <label htmlFor="profile-email" className="field-label">
              Correo
            </label>
            <input
              id="profile-email"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="input"
              required
            />
          </div>

          {/* Contraseña */}
          <div>
            <label htmlFor="profile-password" className="field-label">
              Nueva contraseña
            </label>
            <input
              id="profile-password"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="input"
              aria-describedby="profile-password-help"
            />
            <FieldMessage id="profile-password-help">
              Deja en blanco si no quieres cambiarla.
            </FieldMessage>
          </div>

          {/* Botón */}
          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={loading}
          >
            {loading ? "Guardando..." : "Guardar cambios"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ProfilePage;
