import "server-only";
import { PermissionSet, DEFAULT_PERMISSIONS } from "./permission-types";

// Функция для получения разрешений пользователя
export function getUserPermissions(roleName: string, customPermissions?: any): PermissionSet {
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

// Функция для проверки конкретного разрешения
export function hasPermission(
  permissions: PermissionSet, 
  category: keyof PermissionSet, 
  permission: string
): boolean {
  const categoryPermissions = permissions[category] as any;
  return categoryPermissions?.[permission] === true;
}

// Функция для проверки доступа к странице
export function canAccessPage(permissions: PermissionSet, pagePath: string): boolean {
  // Проверяем доступ к основным страницам
  if (pagePath.startsWith('/owner/')) {
    return hasPermission(permissions, 'special', 'canAccessOwnerPages');
  }
  
  if (pagePath.startsWith('/partner/')) {
    return hasPermission(permissions, 'points', 'viewPoints');
  }
  
  // Проверяем доступ к модулям
  const moduleMap: Record<string, keyof PermissionSet['modules']> = {
    '/dashboard': 'dashboard',
    '/labeling': 'labeling',
    '/files': 'files',
    '/learning': 'learning',
    '/haccp': 'haccp',
    '/medical-books': 'medicalBooks',
    '/schedule-salary': 'scheduleSalary',
    '/employees': 'employees',
    '/equipment': 'equipment',
    '/billing': 'billing',
  };
  
  for (const [path, module] of Object.entries(moduleMap)) {
    if (pagePath.startsWith(path)) {
      return hasPermission(permissions, 'modules', module);
    }
  }
  
  return true; // По умолчанию разрешаем доступ
}

// Функция для получения видимых пунктов меню
export function getVisibleMenuItems(permissions: PermissionSet): string[] {
  const visibleItems: string[] = [];
  
  // Основные модули
  if (hasPermission(permissions, 'modules', 'dashboard')) visibleItems.push('dashboard');
  if (hasPermission(permissions, 'modules', 'labeling')) visibleItems.push('labeling');
  if (hasPermission(permissions, 'modules', 'files')) visibleItems.push('files');
  if (hasPermission(permissions, 'modules', 'learning')) visibleItems.push('learning');
  if (hasPermission(permissions, 'modules', 'haccp')) visibleItems.push('haccp');
  if (hasPermission(permissions, 'modules', 'medicalBooks')) visibleItems.push('medical-books');
  if (hasPermission(permissions, 'modules', 'scheduleSalary')) visibleItems.push('schedule-salary');
  if (hasPermission(permissions, 'modules', 'employees')) visibleItems.push('employees');
  if (hasPermission(permissions, 'modules', 'equipment')) visibleItems.push('equipment');
  if (hasPermission(permissions, 'modules', 'billing')) visibleItems.push('billing');
  
  // Управление
  if (hasPermission(permissions, 'userManagement', 'viewUsers')) visibleItems.push('owner/users');
  if (hasPermission(permissions, 'points', 'viewPoints')) visibleItems.push('partner/points');
  
  return visibleItems;
}
