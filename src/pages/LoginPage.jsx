import { useForm } from "react-hook-form";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import logo from "/tj.png";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";
import { Moon, Sun } from "lucide-react";

function LoginPage() {
  const { register, handleSubmit } = useForm();
  const { signin, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = handleSubmit(async (data) => {
    setIsSubmitting(true);
    try {
      await signin(data);
    } finally {
      setIsSubmitting(false);
    }
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/"); // redirección si está autenticado
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="app-shell flex min-h-screen items-center justify-center px-4 py-8">
      <button
        type="button"
        onClick={toggleTheme}
        className="btn-secondary fixed right-5 top-5 h-10 w-10 px-0"
        aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
        title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      >
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <div className="panel w-full max-w-md p-8">
        {/* Logo + Título */}
        <div className="flex flex-col items-center mb-6">
          <img src={logo} alt="Logo" className="w-24 h-24 mb-2" />
          <h1 className="page-title">Iniciar sesión</h1>
          <p className="text-muted mt-2 text-center text-sm">
            Accede al panel de gestión de Transportes J.
          </p>
        </div>


        <form onSubmit={onSubmit} className="space-y-4">
          {/* DNI */}
          <div>
            <input
              type="text"
              {...register("dni")}
              className="input px-4 py-3"
              placeholder="DNI"
              autoComplete="username"
            />
          </div>

          {/* Contraseña */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              {...register("password")}
              className="input px-4 py-3 pr-10"
              placeholder="Contraseña"
              autoComplete="current-password"
            />
            <button
              type="button"
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              onClick={() => setShowPassword(!showPassword)}
              className="text-muted absolute right-3 top-3.5 hover:text-blue-500"
              tabIndex={-1}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          {/* Botón */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full py-3"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-4 w-4 text-white"
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
                Ingresando...
              </div>
            ) : (
              "Ingresar"
            )}
          </button>
        </form>

        {/* Futuro: Recuperación de contraseña */}
        <div className="mt-4 text-center">
          <button
            type="button"
            className="text-sm font-medium text-blue-500 hover:underline"
            onClick={() => alert("Funcionalidad en desarrollo")}
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
