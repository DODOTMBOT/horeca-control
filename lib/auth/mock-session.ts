import { SessionProvider, SessionData, SessionUser, RoleWithPermissions } from './session'
import { Role, Tenant, Point, User } from '@prisma/client'

// Мок-данные для демонстрации
const mockTenant: Tenant = {
  id: 'mock-tenant-id',
  name: 'Demo Organization',
  email: 'owner@demo.local',
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockPoint: Point = {
  id: 'mock-point-id',
  name: 'Demo Point',
  address: 'Demo Address',
  tenantId: mockTenant.id,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockRole: RoleWithPermissions = {
  id: 'mock-role-id',
  name: 'OWNER',
  permissions: {
    all: true,
    manageUsers: true,
    manageRoles: true,
    manageBilling: true,
    labeling: true,
    files: true,
    learning: true,
    platformOwner: true,
  },
  tenantId: mockTenant.id,
  partner: 'Demo Partner',
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockUser: SessionUser = {
  id: 'mock-user-id',
  email: 'owner@demo.local',
  name: 'Demo Owner',
  passwordHash: 'mock-hash',
  tenantId: mockTenant.id,
  pointId: mockPoint.id,
  createdAt: new Date(),
  updatedAt: new Date(),
  roles: [mockRole],
  currentTenant: mockTenant,
  currentPoint: mockPoint,
}

const mockSession: SessionData = {
  user: mockUser,
  isPlatformOwner: true,
  isAuthenticated: true,
}

export class MockSessionProvider implements SessionProvider {
  async getSession(): Promise<SessionData | null> {
    return mockSession
  }

  async requireSession(): Promise<SessionData> {
    return mockSession
  }

  async requirePlatformOwner(): Promise<SessionData> {
    if (!mockSession.isPlatformOwner) {
      throw new Error('Platform owner access required')
    }
    return mockSession
  }

  async requireTenant(): Promise<SessionData & { tenant: Tenant }> {
    if (!mockSession.user.currentTenant) {
      throw new Error('Tenant access required')
    }
    return {
      ...mockSession,
      tenant: mockSession.user.currentTenant,
    }
  }

  async hasRole(roleName: string): Promise<{ session: SessionData; role: Role } | null> {
    const role = mockSession.user.roles.find(r => r.name === roleName)
    if (!role) {
      return null
    }
    return {
      session: mockSession,
      role: role,
    }
  }

  async hasAnyRole(roleNames: string[]): Promise<{ session: SessionData; roles: Role[] } | null> {
    const roles = mockSession.user.roles.filter(r => roleNames.includes(r.name))
    if (roles.length === 0) {
      return null
    }
    return {
      session: mockSession,
      roles: roles,
    }
  }
}
