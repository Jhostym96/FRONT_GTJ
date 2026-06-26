import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  ErrorAlert,
  FieldMessage,
} from "../components/ui/Accessibility";

function RegisterPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const { signup, errors: registerErrors, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) navigate("/");
  }, [isAuthenticated, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="panel w-full max-w-md p-6 sm:p-8">
        <h1 className="page-title">Crear cuenta</h1>
        <p className="page-description">
          Completa tus datos para registrarte.
        </p>

        {registerErrors.length > 0 && (
          <ErrorAlert className="mt-4">
            {registerErrors.map((error) => (
              <p key={error}>{error}</p>
            ))}
          </ErrorAlert>
        )}

        <form onSubmit={handleSubmit(signup)} className="mt-5 space-y-4">
          <div>
            <label htmlFor="register-name" className="field-label">
              Nombre
            </label>
            <input
              id="register-name"
              className="input mt-1"
              autoComplete="name"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "register-name-error" : undefined}
              {...register("name", { required: "El nombre es obligatorio" })}
            />
            {errors.name && (
              <FieldMessage id="register-name-error" error>
                {errors.name.message}
              </FieldMessage>
            )}
          </div>

          <div>
            <label htmlFor="register-dni" className="field-label">
              DNI
            </label>
            <input
              id="register-dni"
              className="input mt-1"
              inputMode="numeric"
              autoComplete="off"
              aria-invalid={Boolean(errors.dni)}
              aria-describedby={errors.dni ? "register-dni-error" : undefined}
              {...register("dni", { required: "El DNI es obligatorio" })}
            />
            {errors.dni && (
              <FieldMessage id="register-dni-error" error>
                {errors.dni.message}
              </FieldMessage>
            )}
          </div>

          <div>
            <label htmlFor="register-password" className="field-label">
              Contraseña
            </label>
            <input
              id="register-password"
              type="password"
              className="input mt-1"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={
                errors.password ? "register-password-error" : undefined
              }
              {...register("password", {
                required: "La contraseña es obligatoria",
                minLength: {
                  value: 6,
                  message: "Debe tener al menos 6 caracteres",
                },
              })}
            />
            {errors.password && (
              <FieldMessage id="register-password-error" error>
                {errors.password.message}
              </FieldMessage>
            )}
          </div>

          <button className="btn-primary w-full" type="submit">
            Registrarme
          </button>
        </form>

        <p className="text-muted mt-5 text-center text-sm">
          ¿Ya tienes una cuenta?{" "}
          <Link to="/login" className="font-bold text-[var(--app-primary)]">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;
