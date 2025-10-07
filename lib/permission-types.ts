// Типы разрешений для системы (можно использовать в клиентских компонентах)

export interface PermissionSet {
  // Основные модули
  modules: {
    dashboard: boolean;
    labeling: boolean;
    files: boolean;
    learning: boolean;
    haccp: boolean;
    medicalBooks: boolean;
    scheduleSalary: boolean;
    employees: boolean;
    equipment: boolean;
    billing: boolean;
  };
  
  // Управление пользователями
  userManagement: {
    viewUsers: boolean;
    createUsers: boolean;
    editUsers: boolean;
    deleteUsers: boolean;
    assignRoles: boolean;
  };
  
  // Управление ролями
  roleManagement: {
    viewRoles: boolean;
    createRoles: boolean;
    editRoles: boolean;
    deleteRoles: boolean;
  };
  
  // Управление организацией
  organization: {
    viewSettings: boolean;
    editSettings: boolean;
    viewReports: boolean;
    manageTenants: boolean;
  };
  
  // Управление точками
  points: {
    viewPoints: boolean;
    createPoints: boolean;
    editPoints: boolean;
    deletePoints: boolean;
  };
  
  // Специальные права
  special: {
    isPlatformOwner: boolean;
    canAccessOwnerPages: boolean;
    canManageBilling: boolean;
    canViewAllData: boolean;
  };
}

// Стандартные наборы разрешений для базовых ролей
export const DEFAULT_PERMISSIONS: Record<string, PermissionSet> = {
  PLATFORM_OWNER: {
    modules: {
      dashboard: true,
      labeling: true,
      files: true,
      learning: true,
      haccp: true,
      medicalBooks: true,
      scheduleSalary: true,
      employees: true,
      equipment: true,
      billing: true,
    },
    userManagement: {
      viewUsers: true,
      createUsers: true,
      editUsers: true,
      deleteUsers: true,
      assignRoles: true,
    },
    roleManagement: {
      viewRoles: true,
      createRoles: true,
      editRoles: true,
      deleteRoles: true,
    },
    organization: {
      viewSettings: true,
      editSettings: true,
      viewReports: true,
      manageTenants: true,
    },
    points: {
      viewPoints: true,
      createPoints: true,
      editPoints: true,
      deletePoints: true,
    },
    special: {
      isPlatformOwner: true,
      canAccessOwnerPages: true,
      canManageBilling: true,
      canViewAllData: true,
    },
  },
  
  ORGANIZATION_OWNER: {
    modules: {
      dashboard: true,
      labeling: true,
      files: true,
      learning: true,
      haccp: true,
      medicalBooks: true,
      scheduleSalary: true,
      employees: true,
      equipment: true,
      billing: true,
    },
    userManagement: {
      viewUsers: true,
      createUsers: true,
      editUsers: true,
      deleteUsers: true,
      assignRoles: true,
    },
    roleManagement: {
      viewRoles: true,
      createRoles: true,
      editRoles: true,
      deleteRoles: true,
    },
    organization: {
      viewSettings: true,
      editSettings: true,
      viewReports: true,
      manageTenants: false,
    },
    points: {
      viewPoints: true,
      createPoints: true,
      editPoints: true,
      deletePoints: true,
    },
    special: {
      isPlatformOwner: false,
      canAccessOwnerPages: true,
      canManageBilling: true,
      canViewAllData: false,
    },
  },
  
  MANAGER: {
    modules: {
      dashboard: true,
      labeling: true,
      files: true,
      learning: true,
      haccp: true,
      medicalBooks: true,
      scheduleSalary: true,
      employees: true,
      equipment: true,
      billing: false,
    },
    userManagement: {
      viewUsers: false,
      createUsers: false,
      editUsers: false,
      deleteUsers: false,
      assignRoles: false,
    },
    roleManagement: {
      viewRoles: false,
      createRoles: false,
      editRoles: false,
      deleteRoles: false,
    },
    organization: {
      viewSettings: false,
      editSettings: false,
      viewReports: true,
      manageTenants: false,
    },
    points: {
      viewPoints: true,
      createPoints: true,
      editPoints: true,
      deletePoints: false,
    },
    special: {
      isPlatformOwner: false,
      canAccessOwnerPages: false,
      canManageBilling: false,
      canViewAllData: false,
    },
  },
  
  POINT_MANAGER: {
    modules: {
      dashboard: true,
      labeling: true,
      files: true,
      learning: true,
      haccp: true,
      medicalBooks: true,
      scheduleSalary: true,
      employees: true,
      equipment: true,
      billing: false,
    },
    userManagement: {
      viewUsers: false,
      createUsers: false,
      editUsers: false,
      deleteUsers: false,
      assignRoles: false,
    },
    roleManagement: {
      viewRoles: false,
      createRoles: false,
      editRoles: false,
      deleteRoles: false,
    },
    organization: {
      viewSettings: false,
      editSettings: false,
      viewReports: true,
      manageTenants: false,
    },
    points: {
      viewPoints: true,
      createPoints: false,
      editPoints: true,
      deletePoints: false,
    },
    special: {
      isPlatformOwner: false,
      canAccessOwnerPages: false,
      canManageBilling: false,
      canViewAllData: false,
    },
  },
  
  EMPLOYEE: {
    modules: {
      dashboard: true,
      labeling: true,
      files: false,
      learning: true,
      haccp: true,
      medicalBooks: false,
      scheduleSalary: false,
      employees: false,
      equipment: false,
      billing: false,
    },
    userManagement: {
      viewUsers: false,
      createUsers: false,
      editUsers: false,
      deleteUsers: false,
      assignRoles: false,
    },
    roleManagement: {
      viewRoles: false,
      createRoles: false,
      editRoles: false,
      deleteRoles: false,
    },
    organization: {
      viewSettings: false,
      editSettings: false,
      viewReports: false,
      manageTenants: false,
    },
    points: {
      viewPoints: false,
      createPoints: false,
      editPoints: false,
      deletePoints: false,
    },
    special: {
      isPlatformOwner: false,
      canAccessOwnerPages: false,
      canManageBilling: false,
      canViewAllData: false,
    },
  },
};
