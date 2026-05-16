import { useState, useEffect } from "react";
import { useUsuarios } from "../context/UserContext";

const rolesDisponibles = ["User", "Administrador", "Superadministrador", "Almacen"];

const UsuarioForm = ({ usuario = null, onSuccess }) => {
  const { crearUsuario, editarUsuario } = useUsuarios();

  const [form, setForm] = useState({
    dni: "",
    name: "",
    email: "",
    password: "",
    role: "User",
  });

  const [error, setError] = useState("");

  useEffect(() => {
    if (usuario) {
      setForm({
        dni: usuario.dni || "",
        name: usuario.name || "",
        email: usuario.email || "",
        password: "",
        role: usuario.role || "User",
      });
    }
  }, [usuario]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (usuario) {
        await editarUsuario(usuario._id, form);
      } else {
        if (!form.password || form.password.length < 6) {
          setError("La contraseña debe tener al menos 6 caracteres");
          return;
        }
        await crearUsuario(form);
      }

      if (onSuccess) onSuccess(); // cerrar modal o recargar lista
      setForm({ dni: "", name: "", email: "", password: "", role: "User" });
    } catch (err) {
      setError("Error al guardar usuario");
      console.error(err);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-surface p-6 rounded-xl shadow-lg text-text-primary space-y-5"
    >
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-200">
          {usuario ? "Editar Usuario" : "Crear Usuario"}
        </h2>
        <p className="text-sm text-neutral-400">
          {usuario
            ? "Modifica los datos del usuario seleccionado."
            : "Completa la información para registrar un nuevo usuario."}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 text-red-400 text-sm p-3 rounded-lg border border-red-500/40">
          {error}
        </div>
      )}

      {/* DNI */}
      <div>
        <label className="block mb-1 text-sm text-text-secondary">DNI</label>
        <input
          type="text"
          name="dni"
          value={form.dni}
          onChange={handleChange}
          required
          className="w-full bg-input border border-neutral-700 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Nombre */}
      <div>
        <label className="block mb-1 text-sm text-text-secondary">Nombre</label>
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          required
          className="w-full bg-input border border-neutral-700 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Correo */}
      <div>
        <label className="block mb-1 text-sm text-text-secondary">Correo</label>
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          required
          className="w-full bg-input border border-neutral-700 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Contraseña solo en creación */}
      {!usuario && (
        <div>
          <label className="block mb-1 text-sm text-text-secondary">Contraseña</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            className="w-full bg-input border border-neutral-700 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Rol */}
      <div>
        <label className="block mb-1 text-sm text-text-secondary">Rol</label>
        <select
          name="role"
          value={form.role}
          onChange={handleChange}
          className="w-full bg-input border border-neutral-700 rounded-lg p-2 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500"
        >
          {rolesDisponibles.map((r) => (
            <option key={r} value={r}>
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Botón */}
      <button
        type="submit"
        className="w-full py-2 mt-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow transition transform hover:scale-105"
      >
        {usuario ? "Guardar cambios" : "Crear usuario"}
      </button>
    </form>
  );
};

export default UsuarioForm;
