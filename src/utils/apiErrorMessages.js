const PRIORITY_KEYS = [
  "message",
  "mensaje",
  "error",
  "errors",
  "errores",
  "detalle",
  "detalles",
  "description",
  "descripcion",
  "nubefact",
  "nubefactResponse",
  "respuesta",
  "response",
  "data",
];

const IGNORED_KEYS = new Set([
  "stack",
  "config",
  "request",
  "headers",
  "trace",
  "traceId",
  "timestamp",
  "status",
  "statusCode",
]);

const addMessage = (messages, value) => {
  if (typeof value !== "string") return;

  const message = value.trim();
  if (!message || messages.includes(message)) return;

  messages.push(message);
};

const collectMessages = (value, messages, seen, depth = 0) => {
  if (messages.length >= 8 || depth > 5 || value == null) return;

  if (typeof value === "string") {
    addMessage(messages, value);
    return;
  }

  if (typeof value !== "object") return;
  if (seen.has(value)) return;

  seen.add(value);

  if (Array.isArray(value)) {
    value.forEach((item) => collectMessages(item, messages, seen, depth + 1));
    return;
  }

  const messagesCount = messages.length;

  PRIORITY_KEYS.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(value, key)) {
      collectMessages(value[key], messages, seen, depth + 1);
    }
  });

  if (messages.length > messagesCount) return;

  Object.entries(value).forEach(([key, item]) => {
    if (IGNORED_KEYS.has(key) || PRIORITY_KEYS.includes(key)) return;
    collectMessages(item, messages, seen, depth + 1);
  });
};

export const obtenerMensajesErrorApi = (errorOrData, fallback) => {
  const data = errorOrData?.response?.data ?? errorOrData;
  const messages = [];

  collectMessages(data, messages, new WeakSet());

  return messages.length ? messages : [fallback];
};

export const obtenerMensajeErrorApi = (errorOrData, fallback) =>
  obtenerMensajesErrorApi(errorOrData, fallback)[0];
