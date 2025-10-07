import "server-only";
import prisma from "@/lib/prisma";
import { getUserPermissions, canAccessPage } from "@/lib/permissions";
import { PermissionSet } from "@/lib/permission-types";

export type AppRole = "OWNER" | "PARTNER" | "POINT" | "EMPLOYEE";

export async function getUserRole(userId: string, tenantId?: string | null): Promise<AppRole | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { 
      role: true
    }
  });

  if (!user) return null;

  // Возвращаем роль напрямую из поля role
  return user.role as AppRole;
}

export function hasRole(actual: AppRole | null, needed: AppRole): boolean {
  if (!actual) return false;
  
  // Иерархия ролей: OWNER > PARTNER > POINT > EMPLOYEE
  const roleHierarchy = { 
    OWNER: 4, 
    PARTNER: 3, 
    POINT: 2, 
    EMPLOYEE: 1 
  };
  return roleHierarchy[actual] >= roleHierarchy[needed];
}

/**
 * Проверяет доступ к страницам /owner (только для OWNER)
 */
export async function canAccessOwnerPages(userId: string): Promise<boolean> {
  const role = await getUserRole(userId);
  return role === "OWNER";
}

/**
 * Проверяет доступ к управлению точками (для PARTNER и выше)
 */
export async function canManagePoints(userId: string): Promise<boolean> {
  const role = await getUserRole(userId);
  return hasRole(role, "PARTNER");
}

/**
 * Получает разрешения пользователя
 */
export async function getUserPermissionsWithRole(userId: string, tenantId?: string | null): Promise<{ role: AppRole | null; permissions: PermissionSet }> {
  const role = await getUserRole(userId, tenantId);
  
  if (!role) {
    return { role: null, permissions: getUserPermissions("EMPLOYEE") };
  }
  
  const permissions = getUserPermissions(role);
  
  return { role, permissions };
}

/**
 * Проверяет доступ к странице на основе разрешений
 */
export async function canAccessPageWithPermissions(userId: string, pagePath: string, tenantId?: string | null): Promise<boolean> {
  const { permissions } = await getUserPermissionsWithRole(userId, tenantId);
  return canAccessPage(permissions, pagePath);
}

/**
 * Проверяет конкретное разрешение пользователя
 */
export async function hasUserPermission(
  userId: string, 
  category: keyof PermissionSet, 
  permission: string,
  tenantId?: string | null
): Promise<boolean> {
  const { permissions } = await getUserPermissionsWithRole(userId, tenantId);
  return permissions[category]?.[permission] === true;
}

/**
 * Получает точки партнера (заглушка для совместимости)
 */
export async function getPartnerPoints(userId: string): Promise<Array<{id: string, name: string}>> {
  // TODO: Реализовать когда будет модель Point
  return [];
}

/**
 * Получает текущую активную точку пользователя (заглушка для совместимости)
 */
export async function getCurrentPoint(userId: string): Promise<{id: string, name: string} | null> {
  // TODO: Реализовать когда будет модель Point
  return null;
}

/**
 * Проверяет и создает базовые роли при запуске системы
 */
export async function ensureBaseRoles(): Promise<void> {
  // Роли уже созданы через скрипт cleanup-roles.js
  // Эта функция больше не нужна, но оставляем для совместимости
  console.log('✅ Базовые роли уже созданы: Owner, Partner, Point');
}

// Learning Module ACL Helpers

/**
 * Проверяет, находится ли пользователь в песочнице (без tenantId)
 */
export function isSandbox(session: any): boolean {
  return !session?.user?.tenantId;
}

/**
 * Проверяет, может ли пользователь создавать/редактировать курсы
 */
export function canAuthor(session: any): boolean {
  const role = session?.user?.role;
  return role === "OWNER" || role === "PARTNER";
}

/**
 * Получает текущий tenantId из сессии
 */
export function currentTenantId(session: any): string | null {
  return session?.user?.tenantId ?? null;
}

/**
 * Проверяет лимиты песочницы для обучения
 */
export async function checkSandboxLimits(session: any, action: 'course' | 'lesson' | 'quiz' | 'assignment'): Promise<{ allowed: boolean; message?: string }> {
  if (!isSandbox(session)) {
    return { allowed: true };
  }

  const userId = session?.user?.id;
  if (!userId) return { allowed: false, message: 'Не авторизован' };
  
  switch (action) {
    case 'course':
      const courseCount = await prisma.course.count({ where: { ownerId: userId } });
      if (courseCount >= 1) {
        return { allowed: false, message: 'В песочнице можно создать только 1 курс' };
      }
      break;
      
    case 'lesson':
      // Проверяем уроки в конкретном курсе
      break;
      
    case 'quiz':
      // TODO: Реализовать когда будет модель Quiz
      break;
      
    case 'assignment':
      // TODO: Реализовать когда будет модель Assignment
      break;
  }
  
  return { allowed: true };
}
