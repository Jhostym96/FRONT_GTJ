import { useState, useEffect } from "react";
import { useUsuarios } from "../context/UserContext";
import { getRecordId } from "../utils/apiData";

const rolesDisponibles = [
  "User",
  "Administrador",
  "Superadministrador",
  "Coordinador",
  "Almacen",
];

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
        await editarUsuario(getRecordId(usuario), form);
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
    <form onSubmit={handleSubmit} className="space-y-5 pt-4">
      {/* Header */}
      <div>
        <h2 className="text-main text-2xl font-bold">
          {usuario ? "Editar Usuario" : "Crear Usuario"}
        </h2>
        <p className="text-muted text-sm">
          {usuario
            ? "Modifica los datos del usuario seleccionado."
            : "Completa la información para registrar un nuevo usuario."}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* DNI */}
      <div>
        <label className="text-muted mb-1 block text-sm">DNI</label>
        <input
          type="text"
          name="dni"
          value={form.dni}
          onChange={handleChange}
          required
          placeholder="Ingrese el DNI del usuario"
          className="input p-2"
        />
      </div>

      {/* Nombre */}
      <div>
        <label className="text-muted mb-1 block text-sm">Nombre</label>
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          required
          placeholder="Ingrese el nombre del usuario"
          className="input p-2"
        />
      </div>

      {/* Correo */}
      <div>
        <label className="text-muted mb-1 block text-sm">Correo</label>
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          required
          placeholder="Ingrese el correo del usuario"
          className="input p-2"
        />
      </div>

      {/* Contraseña solo en creación */}
      {!usuario && (
        <div>
          <label className="text-muted mb-1 block text-sm">Contraseña</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            placeholder="Ingrese una contraseña segura"
            className="input p-2"
          />
        </div>
      )}

      {/* Rol */}
      <div>
        <label className="text-muted mb-1 block text-sm">Rol</label>
        <select
          name="role"
          value={form.role}
          onChange={handleChange}
          className="input p-2"
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
        className="btn-primary mt-2 w-full py-2"
      >
        {usuario ? "Guardar cambios" : "Crear usuario"}
      </button>
    </form>
  );
};

export default UsuarioForm;
