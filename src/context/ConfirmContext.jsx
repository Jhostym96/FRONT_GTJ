import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";

const ConfirmContext = createContext(null);

const defaultOptions = {
  title: "Confirmar acción",
  message: "¿Deseas continuar?",
  confirmText: "Confirmar",
  cancelText: "Cancelar",
  variant: "danger",
};

function ConfirmDialog({ options, onCancel, onConfirm }) {
  const isDanger = options.variant === "danger";
  const Icon = isDanger ? AlertTriangle : CheckCircle2;

  return (
    <div className="modal-backdrop z-[70]" role="presentation">
      <div
        className="modal-panel max-w-md animate-fade-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${
                isDanger
                  ? "border-red-500/30 bg-red-500/10 text-red-400"
                  : "border-blue-500/30 bg-blue-500/10 text-blue-400"
              }`}
            >
              <Icon className="h-5 w-5" />
            </div>

            <div>
              <h2 id="confirm-dialog-title" className="text-main text-lg font-bold">
                {options.title}
              </h2>
              <p className="text-muted mt-1 text-sm leading-5">
                {options.message}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary btn-icon h-8 w-8 min-w-8"
            aria-label="Cerrar confirmación"
            title="Cerrar"
          >
            <X />
          </button>
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} className="btn-secondary">
            {options.cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={isDanger ? "btn-danger" : "btn-primary"}
          >
            {options.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null);

  const close = useCallback(
    (result) => {
      dialog?.resolve(result);
      setDialog(null);
    },
    [dialog]
  );

  const confirm = useCallback((options = {}) => {
    return new Promise((resolve) => {
      setDialog({
        options: { ...defaultOptions, ...options },
        resolve,
      });
    });
  }, []);

  const value = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {dialog && (
        <ConfirmDialog
          options={dialog.options}
          onCancel={() => close(false)}
          onConfirm={() => close(true)}
        />
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);

  if (!context) {
    throw new Error("useConfirm debe usarse dentro de ConfirmProvider");
  }

  return context.confirm;
}
