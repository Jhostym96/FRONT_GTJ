import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";

// 🔹 Contextos y Providers
import { AuthProvider } from "./context/AuthContext";
import { UserProvider } from "./context/UserContext";
import { OrdenServicioProvider } from "./context/OrdenServicioContext";
import { ClienteProvider } from "./context/ClienteContext";
import { UnidadProvider } from "./context/UnidadContext";
import { ConductorProvider } from "./context/ConductorContext";
import { ProgramacionViajeProvider } from "./context/ProgramacionViajeContext";
import { GuiaTransportistaProvider } from "./context/GuiaTransportistaContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ConfirmProvider } from "./context/ConfirmContext";
import { AuditoriaProvider } from "./context/AuditoriaContext";
import { EmpresaConfigProvider } from "./context/EmpresaConfigContext";

// 🔹 Componentes
import Sidebar from "./components/Sidebar";
import Navbar from "./components/NavBar";
import Footer from "./components/Footer"; // 👈 Footer agregado
import ProtectedRoute from "./ProtectedRoute";
import RouteChangeLoader from "./components/RouteChangeLoader";
import OrdenServicioFormPage from "./components/modals/OrdenServicioModal";


// 🔹 Páginas
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import DashboardPage from "./pages/DashboardPage";
import AuditoriaPage from "./pages/AuditoriaPage";
import ProfileTask from "./pages/ProfilePage";
import UsuariosPage from "./pages/UsuariosPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import OrdenesServicioPage from "./pages/OrdenesServicioPage";
import ClientesPage from "./pages/ClientesPage";
import ProgramacionViajePage from "./pages/ProgramacionViajePage";
import UnidadesPage from "./pages/UnidadesPage";
import ConductoresPage from "./pages/ConductoresPage";
import GuiaTransportistaPage from "./pages/GuiaTransportistaPage";
import DocumentosFacturacionPage from "./pages/DocumentosFacturacionPage";
import NubefactPruebasPage from "./pages/NubefactPruebasPage";
import DevolucionesPage from "./pages/DevolucionesPage";
import EmpresaConfigPage from "./pages/EmpresaConfigPage";
import WhatsappBotConfigPage from "./pages/WhatsappBotConfigPage";
import ReportesPage from "./pages/ReportesPage";
import FacturacionPage from "./pages/FacturacionPage";





// 🔹 Layout con Sidebar + Navbar + Footer sticky
function Layout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="app-shell flex">
      {/* Sidebar */}
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* Contenedor derecho */}
      <div className="flex flex-col flex-1 min-h-screen">
        {/* Navbar fijo */}
        <Navbar collapsed={collapsed} />

        {/* Contenido principal + footer dentro del mismo fondo */}
        <div className="flex flex-col flex-1">
          <main
            className={`app-main ${collapsed ? "md:ml-20" : "md:ml-64"
              }`}
          >
            <Routes>
              <Route index element={<HomePage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/profile" element={<ProfileTask />} />
              <Route path="/admin/usuarios" element={<Navigate to="/usuarios" replace />} />
              <Route path="/auditoria" element={<AuditoriaPage />} />
              <Route path="/usuarios" element={<UsuariosPage />} />
              <Route path="/ordenes-servicio" element={<OrdenesServicioPage />} />
              <Route path="/ordenes-servicio/nueva" element={<OrdenServicioFormPage />} />
              <Route path="/clientes" element={<ClientesPage />} />
              <Route path="/programacion-viaje" element={<ProgramacionViajePage />} />
              <Route path="/unidades" element={<UnidadesPage />} />
              <Route path="/conductores" element={<ConductoresPage />} />
              <Route path="/guia-transportista" element={<GuiaTransportistaPage />} />
              <Route path="/documentos-facturacion" element={<DocumentosFacturacionPage />} />
              <Route path="/admin/nubefact-pruebas" element={<NubefactPruebasPage />} />
              <Route path="/admin/empresa" element={<EmpresaConfigPage />} />
              <Route path="/admin/whatsapp-bot" element={<WhatsappBotConfigPage />} />
              <Route path="/devoluciones" element={<DevolucionesPage />} />
              <Route path="/reportes" element={<ReportesPage />} />
              <Route path="/facturacion" element={<FacturacionPage />} />

            </Routes>
          </main>

          {/* Footer fijo en la parte inferior */}
          <Footer />
        </div>
      </div>
    </div>
  );
}

// 🔹 App principal
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <UserProvider>
          <OrdenServicioProvider>
            <ClienteProvider>
              <UnidadProvider>
                <ConductorProvider>
                  <ProgramacionViajeProvider>
                    <EmpresaConfigProvider>
                      <AuditoriaProvider>
                        <ConfirmProvider>
                          <Router>
                            <RouteChangeLoader />
                            <GuiaTransportistaProvider>
                              <Routes>
                                {/* Rutas públicas */}
                                <Route
                                  path="/unauthorized"
                                  element={<UnauthorizedPage />}
                                />
                                <Route path="/login" element={<LoginPage />} />
                                {/* Rutas protegidas */}
                                <Route element={<ProtectedRoute />}>
                                  <Route path="/*" element={<Layout />} />
                                </Route>
                              </Routes>
                            </GuiaTransportistaProvider>
                          </Router>
                        </ConfirmProvider>
                      </AuditoriaProvider>
                    </EmpresaConfigProvider>
                  </ProgramacionViajeProvider>
                </ConductorProvider>
              </UnidadProvider>
            </ClienteProvider>
          </OrdenServicioProvider>
        </UserProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
