// Клиентские функции для работы с разрешениями (без server-only)

import { PermissionSet, DEFAULT_PERMISSIONS } from "./permission-types";

// Функция для получения разрешений пользователя (клиентская версия)
export function getUserPermissionsClient(roleName: string, customPermissions?: any): PermissionSet {
  // Если есть кастомные разрешения, используем их
  if (customPermissions) {
    try {
      const parsed = typeof customPermissions === 'string' 
        ? JSON.parse(customPermissions) 
        : customPermissions;
      return parsed as PermissionSet;
    } catch (error) {
      console.error('Error parsing custom permissions:', error);
    }
  }
  
  // Иначе используем стандартные разрешения
  return DEFAULT_PERMISSIONS[roleName] || DEFAULT_PERMISSIONS.EMPLOYEE;
}

// Функция для проверки конкретного разрешения (клиентская версия)
export function hasPermissionClient(
  permissions: PermissionSet, 
  category: keyof PermissionSet, 
  permission: string
): boolean {
  const categoryPermissions = permissions[category] as any;
  return categoryPermissions?.[permission] === true;
}

// Функция для получения видимых пунктов меню (клиентская версия)
export function getVisibleMenuItemsClient(permissions: PermissionSet): string[] {
  const visibleItems: string[] = [];
  
  // Основные модули
  if (hasPermissionClient(permissions, 'modules', 'dashboard')) visibleItems.push('dashboard');
  if (hasPermissionClient(permissions, 'modules', 'labeling')) visibleItems.push('labeling');
  if (hasPermissionClient(permissions, 'modules', 'files')) visibleItems.push('files');
  if (hasPermissionClient(permissions, 'modules', 'learning')) visibleItems.push('learning');
  if (hasPermissionClient(permissions, 'modules', 'haccp')) visibleItems.push('haccp');
  if (hasPermissionClient(permissions, 'modules', 'medicalBooks')) visibleItems.push('medical-books');
  if (hasPermissionClient(permissions, 'modules', 'scheduleSalary')) visibleItems.push('schedule-salary');
  if (hasPermissionClient(permissions, 'modules', 'employees')) visibleItems.push('employees');
  if (hasPermissionClient(permissions, 'modules', 'equipment')) visibleItems.push('equipment');
  if (hasPermissionClient(permissions, 'modules', 'billing')) visibleItems.push('billing');
  
  // Управление
  if (hasPermissionClient(permissions, 'userManagement', 'viewUsers')) visibleItems.push('owner/users');
  if (hasPermissionClient(permissions, 'points', 'viewPoints')) visibleItems.push('partner/points');
  
  return visibleItems;
}
