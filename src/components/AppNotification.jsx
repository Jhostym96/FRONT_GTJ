import { AlertTriangle, CheckCircle2, Info, LoaderCircle, X } from "lucide-react";
import toast from "react-hot-toast";

const notificationConfig = {
  success: {
    icon: CheckCircle2,
    tone: "border-green-500/30 bg-green-500/10 text-green-400",
    title: "Listo",
  },
  error: {
    icon: AlertTriangle,
    tone: "border-red-500/30 bg-red-500/10 text-red-400",
    title: "Error",
  },
  info: {
    icon: Info,
    tone: "border-blue-500/30 bg-blue-500/10 text-blue-400",
    title: "Aviso",
  },
  loading: {
    icon: LoaderCircle,
    tone: "border-blue-500/30 bg-blue-500/10 text-blue-400",
    title: "Procesando",
  },
};

export default function AppNotification({ id, type = "info", message, title }) {
  const config = notificationConfig[type] || notificationConfig.info;
  const Icon = config.icon;

  return (
    <div className="pointer-events-auto flex w-[min(92vw,380px)] items-start gap-3 rounded-xl border p-3 shadow-xl backdrop-blur-xl animate-fade-in"
      style={{
        background: "color-mix(in srgb, var(--app-elevated) 94%, transparent)",
        borderColor: "var(--app-border)",
        color: "var(--app-text)",
        boxShadow: "var(--app-shadow)",
      }}
    >
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${config.tone}`}>
        <Icon className={`h-5 w-5 ${type === "loading" ? "animate-spin" : ""}`} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold leading-5">
          {title || config.title}
        </p>
        <p className="text-muted mt-0.5 text-sm leading-5">
          {message}
        </p>
      </div>

      <button
        type="button"
        onClick={() => toast.dismiss(id)}
        className="text-muted rounded-md p-1 transition hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-text)]"
        aria-label="Cerrar notificación"
        title="Cerrar"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
