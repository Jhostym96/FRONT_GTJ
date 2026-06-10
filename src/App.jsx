import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy, useState } from "react";

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
import { MaintenanceProvider } from "./context/MaintenanceContext";

// 🔹 Componentes
import Sidebar from "./components/Sidebar";
import Navbar from "./components/NavBar";
import Footer from "./components/Footer"; // 👈 Footer agregado
import ProtectedRoute from "./ProtectedRoute";
import RouteChangeLoader from "./components/RouteChangeLoader";


// 🔹 Páginas
const LoginPage = lazy(() => import("./pages/LoginPage"));
const HomePage = lazy(() => import("./pages/HomePage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const AuditoriaPage = lazy(() => import("./pages/AuditoriaPage"));
const ProfileTask = lazy(() => import("./pages/ProfilePage"));
const UsuariosPage = lazy(() => import("./pages/UsuariosPage"));
const UnauthorizedPage = lazy(() => import("./pages/UnauthorizedPage"));
const OrdenesServicioPage = lazy(() => import("./pages/OrdenesServicioPage"));
const OrdenServicioFormPage = lazy(() => import("./components/modals/OrdenServicioModal"));
const ClientesPage = lazy(() => import("./pages/ClientesPage"));
const ProgramacionViajePage = lazy(() => import("./pages/ProgramacionViajePage"));
const UnidadesPage = lazy(() => import("./pages/UnidadesPage"));
const ConductoresPage = lazy(() => import("./pages/ConductoresPage"));
const GuiaTransportistaPage = lazy(() => import("./pages/GuiaTransportistaPage"));
const DocumentosFacturacionPage = lazy(() => import("./pages/DocumentosFacturacionPage"));
const DocumentacionPage = lazy(() => import("./pages/DocumentacionPage"));
const NubefactPruebasPage = lazy(() => import("./pages/NubefactPruebasPage"));
const DevolucionesPage = lazy(() => import("./pages/DevolucionesPage"));
const EmpresaConfigPage = lazy(() => import("./pages/EmpresaConfigPage"));
const WhatsappBotConfigPage = lazy(() => import("./pages/WhatsappBotConfigPage"));
const ReportesPage = lazy(() => import("./pages/ReportesPage"));
const FacturacionPage = lazy(() => import("./pages/FacturacionPage"));
const SistemaSaludPage = lazy(() => import("./pages/SistemaSaludPage"));
const BackupsPage = lazy(() => import("./pages/BackupsPage"));
const CorrelativosPage = lazy(() => import("./pages/CorrelativosPage"));
const MantenimientoPage = lazy(() => import("./pages/MantenimientoPage"));





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
            <Suspense fallback={<RouteFallback />}>
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
                <Route path="/documentacion" element={<DocumentacionPage />} />
                <Route path="/admin/nubefact-pruebas" element={<NubefactPruebasPage />} />
                <Route path="/admin/empresa" element={<EmpresaConfigPage />} />
                <Route path="/admin/whatsapp-bot" element={<WhatsappBotConfigPage />} />
                <Route path="/admin/backups" element={<BackupsPage />} />
                <Route path="/admin/correlativos" element={<CorrelativosPage />} />
                <Route path="/admin/mantenimiento" element={<MantenimientoPage />} />
                <Route path="/admin/salud-sistema" element={<SistemaSaludPage />} />
                <Route path="/devoluciones" element={<DevolucionesPage />} />
                <Route path="/reportes" element={<ReportesPage />} />
                <Route path="/facturacion" element={<FacturacionPage />} />
              </Routes>
            </Suspense>
          </main>

          {/* Footer fijo en la parte inferior */}
          <Footer collapsed={collapsed} />
        </div>
      </div>
    </div>
  );
}

function RouteFallback() {
  return (
    <div className="page-wrap py-4">
      <div className="panel p-4 sm:p-5">
        <div className="h-4 w-32 rounded bg-[var(--app-surface-muted)]" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="info-tile h-24 animate-pulse" />
          ))}
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
                          <MaintenanceProvider>
                            <Router>
                              <RouteChangeLoader />
                              <GuiaTransportistaProvider>
                                <Suspense fallback={<RouteFallback />}>
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
                                </Suspense>
                              </GuiaTransportistaProvider>
                            </Router>
                          </MaintenanceProvider>
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
