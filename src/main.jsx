import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";

// 🧩 Estilos globales
import "./index.css";
import "./styles/ui.css";

// 🔔 Toaster global (notificaciones)
import CustomToaster from "./components/CustomToaster.jsx";

// 🧠 Render principal
const rootElement = document.getElementById("root");
const root = createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
    <CustomToaster /> {/* Toaster global para toda la app */}
  </React.StrictMode>
);
