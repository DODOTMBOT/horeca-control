import "server-only";
import prisma from "@/lib/prisma";
import { getUserPermissions, canAccessPage } from "@/lib/permissions";
import { PermissionSet } from "@/lib/permission-types";

export type AppRole = "PLATFORM_OWNER" | "ORGANIZATION_OWNER" | "MANAGER" | "POINT_MANAGER" | "EMPLOYEE";

export async function getUserRole(userId: string, tenantId?: string | null): Promise<AppRole | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { 
      isPlatformOwner: true,
      UserRole: {
        where: tenantId ? { tenantId } : undefined,
        select: {
          role: {
            select: {
              name: true
            }
          }
        }
      }
    }
  });

  if (!user) return null;

  // Определяем роль по записи в UserRole
  const userRole = user.UserRole[0]?.role?.name;
  
  // Определяем роль по новому стандарту
  if (user.isPlatformOwner || userRole === "PLATFORM_OWNER") {
    return "PLATFORM_OWNER";
  } else if (userRole === "ORGANIZATION_OWNER") {
    return "ORGANIZATION_OWNER";
  } else if (userRole === "MANAGER") {
    return "MANAGER";
  } else if (userRole === "POINT_MANAGER") {
    return "POINT_MANAGER";
  } else if (userRole === "EMPLOYEE") {
    return "EMPLOYEE";
  }
  
  // Обратная совместимость со старыми ролями
  if (userRole === "OWNER" || userRole === "Owner" || userRole === "Владелец") {
    return "ORGANIZATION_OWNER";
  } else if (userRole === "PARTNER" || userRole === "Partner" || userRole === "Партнер") {
    return "MANAGER";
  } else if (userRole === "POINT" || userRole === "Point" || userRole === "Точка") {
    return "POINT_MANAGER";
  } else if (userRole === "PERSONAL" || userRole === "Personal" || userRole === "Персональный") {
    return "EMPLOYEE";
  }

  return null;
}

export function hasRole(actual: AppRole | null, needed: AppRole): boolean {
  if (!actual) return false;
  
  // Иерархия ролей: PLATFORM_OWNER > ORGANIZATION_OWNER > MANAGER > POINT_MANAGER > EMPLOYEE
  const roleHierarchy = { 
    PLATFORM_OWNER: 5, 
    ORGANIZATION_OWNER: 4, 
    MANAGER: 3, 
    POINT_MANAGER: 2, 
    EMPLOYEE: 1 
  };
  return roleHierarchy[actual] >= roleHierarchy[needed];
}

/**
 * Проверяет доступ к страницам /owner (только для PLATFORM_OWNER и ORGANIZATION_OWNER)
 */
export async function canAccessOwnerPages(userId: string): Promise<boolean> {
  const role = await getUserRole(userId);
  return role === "PLATFORM_OWNER" || role === "ORGANIZATION_OWNER";
}

/**
 * Проверяет доступ к управлению точками (для MANAGER и выше)
 */
export async function canManagePoints(userId: string): Promise<boolean> {
  const role = await getUserRole(userId);
  return hasRole(role, "MANAGER");
}

/**
 * Получает разрешения пользователя
 */
export async function getUserPermissionsWithRole(userId: string, tenantId?: string | null): Promise<{ role: AppRole | null; permissions: PermissionSet }> {
  const role = await getUserRole(userId, tenantId);
  
  if (!role) {
    return { role: null, permissions: getUserPermissions("EMPLOYEE") };
  }
  
  // Получаем кастомные разрешения из базы данных
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      UserRole: {
        where: tenantId ? { tenantId } : undefined,
        select: {
          role: {
            select: {
              name: true,
              permissions: true
            }
          }
        }
      }
    }
  });
  
  const userRole = user?.UserRole[0]?.role;
  const customPermissions = userRole?.permissions;
  
  const permissions = getUserPermissions(role, customPermissions);
  
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
 * Получает точки партнера
 */
export async function getPartnerPoints(userId: string): Promise<Array<{id: string, name: string}>> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { 
      tenant: {
        select: {
          points: {
            select: { id: true, name: true },
            where: { isActive: true }
          }
        }
      }
    }
  });

  return user?.tenant?.points || [];
}

/**
 * Получает текущую активную точку пользователя
 */
export async function getCurrentPoint(userId: string): Promise<{id: string, name: string} | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { 
      point: {
        select: { id: true, name: true }
      }
    }
  });

  return user?.point || null;
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
  const roles: string[] = session?.user?.roles ?? [];
  return roles.includes("OWNER") || roles.includes("PARTNER") || roles.includes("PLATFORM_OWNER");
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

  const tenantId = currentTenantId(session);
  
  switch (action) {
    case 'course':
      const courseCount = await prisma.course.count({ where: { tenantId } });
      if (courseCount >= 1) {
        return { allowed: false, message: 'В песочнице можно создать только 1 курс' };
      }
      break;
      
    case 'lesson':
      // Проверяем уроки в конкретном курсе
      break;
      
    case 'quiz':
      const quizCount = await prisma.quiz.count({ 
        where: { 
          course: { tenantId } 
        } 
      });
      if (quizCount >= 1) {
        return { allowed: false, message: 'В песочнице можно создать только 1 тест' };
      }
      break;
      
    case 'assignment':
      const assignmentCount = await prisma.assignment.count({ where: { tenantId } });
      if (assignmentCount >= 5) {
        return { allowed: false, message: 'В песочнице можно создать только 5 назначений' };
      }
      break;
  }
  
  return { allowed: true };
}
