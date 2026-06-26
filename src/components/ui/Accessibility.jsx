import { useId } from "react";

export const FieldMessage = ({ children, error = false, id }) => (
  <p
    id={id}
    className={`mt-1.5 text-xs font-medium ${
      error
        ? "text-red-700 dark:text-red-300"
        : "text-muted"
    }`}
    {...(error ? { role: "alert", "aria-live": "polite" } : {})}
  >
    {children}
  </p>
);

export const ErrorAlert = ({ children, className = "" }) => (
  <div
    className={`alert-panel ${className}`}
    role="alert"
    aria-live="assertive"
  >
    {children}
  </div>
);

export const Tooltip = ({ label, children, position = "bottom" }) => {
  const tooltipId = useId();

  return (
    <span className="app-tooltip-trigger">
      {typeof children === "function"
        ? children({ "aria-describedby": tooltipId })
        : children}
      <span
        id={tooltipId}
        role="tooltip"
        className={`app-tooltip app-tooltip-${position}`}
      >
        {label}
      </span>
    </span>
  );
};
