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
import { AlmacenProvider } from "./context/AlmacenContext";
import { MaquinariaProvider } from "./context/MaquinariaContext";
import { MantenimientoProvider } from "./context/MantenimientoContext";

// 🔹 Componentes
import Sidebar from "./components/Sidebar";
import Navbar from "./components/NavBar";
import Footer from "./components/Footer"; // 👈 Footer agregado
import ProtectedRoute from "./ProtectedRoute";
import RouteChangeLoader from "./components/RouteChangeLoader";
import OrdenServicioFormPage from "./components/modals/OrdenServicioModal";


// 🔹 Páginas
import LoginPage from "./pages/LoginPage";
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
import DevolucionesPage from "./pages/DevolucionesPage";
import AlmacenPage from "./pages/AlmacenPage";
import MaquinariasPage from "./pages/MaquinariasPage";
import MantenimientoPage from "./pages/MantenimientoPage";





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
              <Route index element={<Navigate to="/dashboard" replace />} />
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
              <Route path="/maquinarias" element={<MaquinariasPage />} />
              <Route path="/conductores" element={<ConductoresPage />} />
              <Route path="/guia-transportista" element={<GuiaTransportistaPage />} />
              <Route path="/devoluciones" element={<DevolucionesPage />} />
              <Route path="/almacen" element={<AlmacenPage />} />
              <Route path="/mantenimiento" element={<MantenimientoPage />} />

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
                <MaquinariaProvider>
                  <MantenimientoProvider>
                    <ConductorProvider>
                      <ProgramacionViajeProvider>
                        <AlmacenProvider>
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
                        </AlmacenProvider>
                      </ProgramacionViajeProvider>
                    </ConductorProvider>
                  </MantenimientoProvider>
                </MaquinariaProvider>
              </UnidadProvider>
            </ClienteProvider>
          </OrdenServicioProvider>
        </UserProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
