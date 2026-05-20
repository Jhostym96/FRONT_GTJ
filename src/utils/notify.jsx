import toast from "react-hot-toast";
import AppNotification from "../components/AppNotification";

const show = (type, message, options = {}) => {
  return toast.custom(
    (t) => (
      <AppNotification
        id={t.id}
        type={type}
        title={options.title}
        message={message}
      />
    ),
    {
      duration: options.duration ?? (type === "error" ? 5000 : 3500),
      id: options.id,
    }
  );
};

export const notify = {
  success: (message, options) => show("success", message, options),
  error: (message, options) => show("error", message, options),
  info: (message, options) => show("info", message, options),
  loading: (message, options) => show("loading", message, {
    duration: Infinity,
    ...options,
  }),
  dismiss: toast.dismiss,
};
