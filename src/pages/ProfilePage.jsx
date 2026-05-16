import { useAuth } from "../context/AuthContext";
import { useUsuarios } from "../context/UserContext"; // 👈 usamos el contexto
import { useState } from "react";
import toast from "react-hot-toast";

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
      toast.error("El correo no puede estar vacío");
      return;
    }

    try {
      setLoading(true);

      // 👉 Ahora usamos el endpoint /usuarios/perfil a través del contexto
      await actualizarPerfil({
        email: form.email,
        password: form.password || undefined,
      });

      toast.success("✅ Perfil actualizado correctamente");
      setForm({ ...form, password: "" }); // limpiar campo contraseña
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.error || "❌ No se pudo actualizar el perfil"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 flex justify-center">
      <div className="w-full max-w-xl card animate-fade-in">
        <h1 className="card-header">👤 Mi perfil</h1>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Nombre (solo lectura, pero lo puedes habilitar si quieres editarlo) */}
          <div>
            <label className="block text-sm text-text-secondary">Nombre</label>
            <input
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
            <label className="block text-sm text-text-secondary">Correo</label>
            <input
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
            <label className="block text-sm text-text-secondary">
              Nueva contraseña
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="input"
            />
            <p className="text-xs text-text-secondary mt-1">
              Deja en blanco si no quieres cambiarla.
            </p>
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
