import { User, Role, Tenant, Point } from '@prisma/client'

// Расширенные типы для сессии
export interface SessionUser extends User {
  roles: (Role & { tenant: Tenant | null })[]
  currentTenant: Tenant | null
  currentPoint: Point | null
}

export interface SessionData {
  user: SessionUser
  isPlatformOwner: boolean
  isAuthenticated: boolean
}

// Интерфейс для провайдера сессий
export interface SessionProvider {
  getSession(): Promise<SessionData | null>
  requireSession(): Promise<SessionData>
  requirePlatformOwner(): Promise<SessionData>
  requireTenant(): Promise<SessionData & { tenant: Tenant }>
  hasRole(roleName: string): Promise<{ session: SessionData; role: Role } | null>
  hasAnyRole(roleNames: string[]): Promise<{ session: SessionData; roles: Role[] } | null>
}

// Типы для ролей
export type UserRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'EMPLOYEE'

// Типы для разрешений
export interface UserPermissions {
  all?: boolean
  manageUsers?: boolean
  manageRoles?: boolean
  manageBilling?: boolean
  labeling?: boolean
  files?: boolean
  learning?: boolean
  platformOwner?: boolean
}

// Расширенная роль с разрешениями
export interface RoleWithPermissions extends Role {
  permissions: UserPermissions
}
