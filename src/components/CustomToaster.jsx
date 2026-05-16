// src/components/CustomToaster.jsx
import { Toaster } from "react-hot-toast";

export default function CustomToaster() {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      toastOptions={{
        duration: 4000, // ⏱ Tiempo en ms (por defecto 3s)
        style: {
          background: "#18181b", // Fondo oscuro elegante
          color: "#f9fafb",
          borderRadius: "12px",
          padding: "14px 18px",
          fontSize: "14px",
          fontWeight: 500,
          boxShadow: "0 8px 16px rgba(0, 0, 0, 0.35)",
        },
        success: {
          style: {
            background: "linear-gradient(135deg, #22c55e, #15803d)", // degradado verde
            color: "#fff",
          },
          iconTheme: {
            primary: "#fff",
            secondary: "#22c55e",
          },
        },
        error: {
          style: {
            background: "linear-gradient(135deg, #ef4444, #991b1b)", // degradado rojo
            color: "#fff",
          },
          iconTheme: {
            primary: "#fff",
            secondary: "#ef4444",
          },
        },
        loading: {
          style: {
            background: "linear-gradient(135deg, #0ea5e9, #0369a1)", // azul para loading
            color: "#fff",
          },
        },
      }}
    />
  );
}
