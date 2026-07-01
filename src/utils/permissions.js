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
  FaFileSignature,
  FaFolderOpen,
  FaUndoAlt,
  FaHistory,
  FaFlask,
  FaWhatsapp,
  FaChartBar,
  FaHeartbeat,
  FaTools,
  FaSave,
  FaSortNumericUp,
} from "react-icons/fa";

export const dashboardMenu = {
  id: "dashboard",
  label: "Dashboard",
  icon: FaTachometerAlt,
  basePath: "/dashboard",
  children: [
    { path: "/dashboard", label: "Panel operativo", icon: FaTachometerAlt },
  ],
};

export const profileMenu = {
  id: "perfil",
  label: "Perfil",
  icon: FaUserTie,
  basePath: "/profile",
  children: [
    { path: "/profile", label: "Mi perfil", icon: FaUserTie },
  ],
};

export const operacionesMenu = {
  id: "operaciones",
  label: "Transporte",
  icon: FaTruckMoving,
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
    {
      path: "/documentos-facturacion",
      label: "Recepción Documentos",
      icon: FaFileSignature,
    },
  ],
};

export const facturacionOperacionesMenu = {
  ...operacionesMenu,
  children: operacionesMenu.children.filter(
    (child) => child.path === "/documentos-facturacion"
  ),
};

export const reportesMenu = {
  id: "reportes",
  label: "Reportes",
  icon: FaChartBar,
  basePath: "/reportes",
  children: [
    {
      path: "/reportes",
      label: "Detalle de Servicios",
      icon: FaChartBar,
    },
  ],
};

export const facturacionMenu = {
  id: "facturacion",
  label: "Facturación",
  icon: FaFileInvoice,
  basePath: "/facturacion",
  children: [
    {
      path: "/facturacion",
      label: "Control de Facturas",
      icon: FaFileInvoice,
    },
    {
      path: "/facturas",
      label: "Facturas Nubefact",
      icon: FaFileInvoice,
    },
  ],
};

export const documentacionMenu = {
  id: "documentacion",
  label: "Documentación",
  icon: FaFolderOpen,
  basePath: "/documentacion",
  children: [
    {
      path: "/documentacion",
      label: "Control documental",
      icon: FaFolderOpen,
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
      id: "datos-maestros-transporte",
      label: "Transporte",
      icon: FaTruckMoving,
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
    },
  ],
};

export const adminMenu = {
  id: "admin",
  label: "Admin",
  icon: FaUserTie,
  basePath: "/admin",
  children: [
    { path: "/usuarios", label: "Gestionar Usuarios", icon: FaUsers },
    { path: "/admin/empresa", label: "Datos de Empresa", icon: FaBuilding },
    { path: "/admin/whatsapp-bot", label: "Bot WhatsApp", icon: FaWhatsapp },
    { path: "/admin/backups", label: "Copias de Seguridad", icon: FaSave },
    { path: "/admin/correlativos", label: "Correlativos", icon: FaSortNumericUp },
    { path: "/admin/mantenimiento", label: "Modo Mantenimiento", icon: FaTools },
    { path: "/admin/nubefact-pruebas", label: "Prueba Nubefact", icon: FaFlask },
    { path: "/admin/salud-sistema", label: "Salud del Sistema", icon: FaHeartbeat },
    { path: "/auditoria", label: "Auditoría", icon: FaHistory },
  ],
};

export const permissions = {
  Superadministrador: {
    routes: [
      dashboardMenu,
      profileMenu,
      operacionesMenu,
      facturacionMenu,
      documentacionMenu,
      reportesMenu,
      datosMaestrosMenu,
      adminMenu,
    ],
    actions: ["view", "edit", "delete", "create"],
  },

  Administrador: {
    routes: [
      dashboardMenu,
      profileMenu,
      operacionesMenu,
      facturacionMenu,
      documentacionMenu,
      reportesMenu,
      datosMaestrosMenu,
      adminMenu,
    ],
    actions: ["view", "edit", "delete", "create"],
  },

  Coordinador: {
    routes: [
      dashboardMenu,
      profileMenu,
      operacionesMenu,
      facturacionMenu,
      documentacionMenu,
      reportesMenu,
      datosMaestrosMenu,
    ],
    actions: ["view", "edit", "create"],
  },

  User: {
    routes: [
      dashboardMenu,
      profileMenu,
      operacionesMenu,
      documentacionMenu,
      reportesMenu,
      datosMaestrosMenu,
    ],
    actions: ["view"],
  },

  Almacen: {
    routes: [dashboardMenu, profileMenu, documentacionMenu, datosMaestrosMenu],
    actions: ["view", "edit", "create"],
  },

  Facturacion: {
    routes: [dashboardMenu, profileMenu, facturacionMenu, facturacionOperacionesMenu],
    actions: ["view", "edit"],
  },
};

export const allMenus = [
  dashboardMenu,
  profileMenu,
  operacionesMenu,
  facturacionMenu,
  documentacionMenu,
  reportesMenu,
  datosMaestrosMenu,
  adminMenu,
];

function normalizePath(path) {
  if (!path) return "/";
  return path.replace(/\/+$/, "") || "/";
}

export function flattenMenuItems(items = [], parentLabels = []) {
  return items.flatMap((item) => {
    if (item.children?.length) {
      return flattenMenuItems(item.children, [...parentLabels, item.label]);
    }

    return [
      {
        ...item,
        parentLabels,
      },
    ];
  });
}

function filterMenuItemsByPermissions(items = [], routes = {}) {
  return items
    .map((item) => {
      if (item.children?.length) {
        const children = filterMenuItemsByPermissions(item.children, routes);
        return children.length > 0 ? { ...item, children } : null;
      }

      const routePerms = routes[normalizePath(item.path)];
      return routePerms?.view ? item : null;
    })
    .filter(Boolean);
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
    flattenMenuItems(menu.children).some((child) => {
      const childPath = normalizePath(child.path);
      return (
        normalizedPath === childPath ||
        normalizedPath.startsWith(`${childPath}/`)
      );
    })
  );
}

export function isAdminUser(user) {
  return ["Administrador", "Superadministrador"].includes(user?.role);
}

export function getDefaultUserPermissions(role = "User") {
  const roleConfig = permissions[role] || permissions.User;
  const actions = roleConfig.actions || ["view"];
  const routes = {};

  roleConfig.routes.forEach((menu) => {
    flattenMenuItems(menu.children).forEach((child) => {
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
  const effective = user.permisos?.routes ? user.permisos : getDefaultUserPermissions(user.role);

  return {
    ...effective,
    routes: {
      ...effective.routes,
      "/profile": {
        view: true,
        create: false,
        edit: true,
        delete: false,
        ...(effective.routes?.["/profile"] || {}),
      },
    },
  };
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
      children: filterMenuItemsByPermissions(menu.children, effective.routes),
    }))
    .filter((menu) => menu.children.length > 0);
}

export function hasAction(user, path, action = "view") {
  if (!user) return false;
  if (user.role === "Superadministrador" && !user.permisos?.routes) return true;

  const effective = getEffectiveUserPermissions(user);
  const normalizedPath = resolveLegacyPath(path);
  const matchedPath = Object.keys(effective.routes || {}).find(
    (routePath) =>
      normalizedPath === routePath || normalizedPath.startsWith(`${routePath}/`)
  );

  return Boolean(effective.routes?.[matchedPath]?.[action]);
}
