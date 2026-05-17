import {
  FaUsers,
  FaUserTie,
  FaTachometerAlt,
  FaClipboardList,
  FaBuilding,
  FaTruckMoving,
  FaDatabase,
  FaIdCard,
  FaFileInvoice,
  FaUndoAlt,
} from "react-icons/fa";

const dashboardMenu = {
  id: "dashboard",
  label: "Dashboard",
  icon: FaTachometerAlt,
  children: [{ path: "/profile", label: "Perfil", icon: FaUserTie }],
};

const operacionesMenu = {
  id: "operaciones",
  label: "Operaciones",
  icon: FaClipboardList,
  children: [
    {
      path: "/ordenes-servicio",
      label: "Órdenes de Servicio",
      icon: FaClipboardList,
    },
    {
      path: "/programacion-viaje",
      label: "Programación de Viaje",
      icon: FaTruckMoving,
    },
    {
      path: "/guia-transportista",
      label: "Guías de Transportista",
      icon: FaFileInvoice,
    },
    {
      path: "/devoluciones",
      label: "Devoluciones",
      icon: FaUndoAlt,
    },
  ],
};

const datosMaestrosMenu = {
  id: "datos-maestros",
  label: "Datos Maestros",
  icon: FaDatabase,
  children: [
    {
      path: "/clientes",
      label: "Clientes",
      icon: FaBuilding,
    },
    {
      path: "/conductores",
      label: "Conductores",
      icon: FaIdCard,
    },
    {
      path: "/unidades",
      label: "Unidades",
      icon: FaTruckMoving,
    },
  ],
};

const adminMenu = {
  id: "admin",
  label: "Admin",
  icon: FaUserTie,
  children: [
    { path: "/usuarios", label: "Gestionar Usuarios", icon: FaUsers },
    { path: "/admin/usuarios", label: "Admin Usuarios", icon: FaUsers },
  ],
};

export const permissions = {
  Superadministrador: {
    routes: [dashboardMenu, operacionesMenu, datosMaestrosMenu, adminMenu],
    actions: ["view", "edit", "delete", "create"],
  },

  Administrador: {
    routes: [dashboardMenu, operacionesMenu, datosMaestrosMenu, adminMenu],
    actions: ["view", "edit", "delete", "create"],
  },

  Coordinador: {
    routes: [dashboardMenu, operacionesMenu, datosMaestrosMenu],
    actions: ["view", "edit", "create"],
  },

  User: {
    routes: [dashboardMenu, operacionesMenu, datosMaestrosMenu],
    actions: ["view"],
  },

  Almacen: {
    routes: [dashboardMenu, operacionesMenu, datosMaestrosMenu],
    actions: ["view"],
  },
};

function normalizePath(path) {
  if (!path) return "/";
  return path.replace(/\/+$/, "") || "/";
}

export function canAccess(user, path) {
  if (!user) return false;

  const allowed = permissions[user.role]?.routes || [];
  const normalizedPath = normalizePath(path);

  return allowed.some((menu) =>
    menu.children?.some((child) => normalizedPath === normalizePath(child.path))
  );
}
