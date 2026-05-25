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
  FaHistory,
  FaBoxes,
  FaCogs,
  FaTools,
} from "react-icons/fa";

export const dashboardMenu = {
  id: "dashboard",
  label: "Dashboard",
  icon: FaTachometerAlt,
  basePath: "/dashboard",
  children: [
    { path: "/dashboard", label: "Panel operativo", icon: FaTachometerAlt },
    { path: "/profile", label: "Perfil", icon: FaUserTie },
  ],
};

export const operacionesMenu = {
  id: "operaciones",
  label: "Operaciones",
  icon: FaClipboardList,
  basePath: "/operaciones",
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

export const datosMaestrosMenu = {
  id: "datos-maestros",
  label: "Datos Maestros",
  icon: FaDatabase,
  basePath: "/datos-maestros",
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
    {
      path: "/maquinarias",
      label: "Maquinarias",
      icon: FaCogs,
    },
  ],
};

export const almacenMenu = {
  id: "almacen",
  label: "Almacén",
  icon: FaBoxes,
  basePath: "/almacen",
  children: [
    { path: "/almacen", label: "Inventario", icon: FaBoxes },
  ],
};

export const mantenimientoMenu = {
  id: "mantenimiento",
  label: "Mantenimiento",
  icon: FaTools,
  basePath: "/mantenimiento",
  children: [
    { path: "/mantenimiento", label: "Órdenes", icon: FaTools },
  ],
};

export const adminMenu = {
  id: "admin",
  label: "Admin",
  icon: FaUserTie,
  basePath: "/admin",
  children: [
    { path: "/usuarios", label: "Gestionar Usuarios", icon: FaUsers },
    { path: "/auditoria", label: "Auditoría", icon: FaHistory },
  ],
};

export const permissions = {
  Superadministrador: {
    routes: [dashboardMenu, operacionesMenu, mantenimientoMenu, almacenMenu, datosMaestrosMenu, adminMenu],
    actions: ["view", "edit", "delete", "create"],
  },

  Administrador: {
    routes: [dashboardMenu, operacionesMenu, mantenimientoMenu, almacenMenu, datosMaestrosMenu, adminMenu],
    actions: ["view", "edit", "delete", "create"],
  },

  Coordinador: {
    routes: [dashboardMenu, operacionesMenu, mantenimientoMenu, almacenMenu, datosMaestrosMenu],
    actions: ["view", "edit", "create"],
  },

  User: {
    routes: [dashboardMenu, operacionesMenu, mantenimientoMenu, almacenMenu, datosMaestrosMenu],
    actions: ["view"],
  },

  Almacen: {
    routes: [dashboardMenu, mantenimientoMenu, almacenMenu, datosMaestrosMenu],
    actions: ["view", "edit", "create"],
  },
};

export const allMenus = [
  dashboardMenu,
  operacionesMenu,
  mantenimientoMenu,
  almacenMenu,
  datosMaestrosMenu,
  adminMenu,
];

function normalizePath(path) {
  if (!path) return "/";
  return path.replace(/\/+$/, "") || "/";
}

function resolveLegacyPath(path) {
  const normalizedPath = normalizePath(path);
  const legacyRoutes = {
    "/admin/usuarios": "/usuarios",
  };

  return legacyRoutes[normalizedPath] || normalizedPath;
}

export function canAccess(user, path) {
  if (!user) return false;

  const allowed = getAllowedRoutes(user);
  const normalizedPath = resolveLegacyPath(path);

  return allowed.some((menu) =>
    menu.children?.some((child) => {
      const childPath = normalizePath(child.path);
      return (
        normalizedPath === childPath ||
        normalizedPath.startsWith(`${childPath}/`)
      );
    })
  );
}

export function getDefaultUserPermissions(role = "User") {
  const roleConfig = permissions[role] || permissions.User;
  const actions = roleConfig.actions || ["view"];
  const routes = {};

  roleConfig.routes.forEach((menu) => {
    menu.children?.forEach((child) => {
      routes[normalizePath(child.path)] = {
        view: true,
        create: actions.includes("create"),
        edit: actions.includes("edit"),
        delete: actions.includes("delete"),
      };
    });
  });

  return { routes };
}

export function getEffectiveUserPermissions(user) {
  if (!user) return { routes: {} };
  if (user.role === "Superadministrador") {
    return getDefaultUserPermissions("Superadministrador");
  }
  return user.permisos?.routes ? user.permisos : getDefaultUserPermissions(user.role);
}

export function getAllowedRoutes(user) {
  if (!user) return [];

  if (user.role === "Superadministrador" && !user.permisos?.routes) {
    return permissions.Superadministrador.routes;
  }

  const effective = getEffectiveUserPermissions(user);

  return allMenus
    .map((menu) => ({
      ...menu,
      children: menu.children.filter((child) => {
        const routePerms = effective.routes?.[normalizePath(child.path)];
        return Boolean(routePerms?.view);
      }),
    }))
    .filter((menu) => menu.children.length > 0);
}

export function hasAction(user, path, action = "view") {
  if (!user) return false;
  if (user.role === "Superadministrador") return true;

  const effective = getEffectiveUserPermissions(user);
  const normalizedPath = resolveLegacyPath(path);
  const matchedPath = Object.keys(effective.routes || {}).find(
    (routePath) =>
      normalizedPath === routePath || normalizedPath.startsWith(`${routePath}/`)
  );

  return Boolean(effective.routes?.[matchedPath]?.[action]);
}
