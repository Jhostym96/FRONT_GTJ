import { Search, X } from "lucide-react";

export const ListSearchInput = ({
  value,
  onChange,
  onClear,
  placeholder,
  ariaLabel,
  className = "",
}) => (
  <div className={`relative w-full ${className}`}>
    <Search className="text-faint pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
    <input
      type="search"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="input pl-9 pr-9"
      placeholder={placeholder}
      aria-label={ariaLabel}
    />
    {value && (
      <button
        type="button"
        onClick={onClear}
        className="text-faint absolute right-3 top-1/2 -translate-y-1/2 hover:text-[var(--app-text)]"
        aria-label="Limpiar búsqueda"
      >
        <X className="h-4 w-4" />
      </button>
    )}
  </div>
);

export const FilterButtonGroup = ({
  options,
  value,
  onChange,
  className = "",
}) => (
  <div className={`flex gap-2 overflow-x-auto ${className}`}>
    {options.map((option) => (
      <button
        type="button"
        key={option.value}
        onClick={() => onChange(option.value)}
        className={`shrink-0 ${
          value === option.value ? "btn-primary" : "btn-secondary"
        }`}
      >
        {option.label}
      </button>
    ))}
  </div>
);

export const SummaryIndicator = ({
  icon: Icon,
  label,
  value,
  tone = "bg-blue-500/10 text-blue-600 dark:text-blue-300",
}) => (
  <div className="panel flex items-center gap-3 p-4">
    <span
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${tone}`}
    >
      <Icon className="h-5 w-5" />
    </span>
    <div>
      <p className="text-faint text-[10px] font-extrabold uppercase tracking-wide">
        {label}
      </p>
      <p className="text-main text-xl font-extrabold">{value}</p>
    </div>
  </div>
);

const badgeTones = {
  success:
    "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-300",
  danger: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300",
  warning:
    "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  info: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  neutral:
    "border-slate-500/30 bg-slate-500/10 text-slate-700 dark:text-slate-300",
};

export const StatusBadge = ({ children, tone = "neutral", className = "" }) => (
  <span
    className={`inline-flex items-center justify-center rounded-full border px-3 py-1 text-[11px] font-bold tracking-wide ${
      badgeTones[tone] || tone
    } ${className}`}
  >
    {children}
  </span>
);
