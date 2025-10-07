import { SessionProvider, SessionData } from './session'
import { Role, Tenant, Point, Prisma } from '@prisma/client'

// Мок-данные для демонстрации
const mockTenant: Tenant = {
  id: "t_dev", 
  name: "Dev Tenant", 
  email: "tenant@example.com",
  isActive: true, 
  region: null, 
  createdAt: new Date(), 
  updatedAt: new Date()
};

const mockPoint: Point = {
  id: "p_dev", 
  name: "Dev Point", 
  email: null, 
  phone: null,
  address: null, 
  tenantId: mockTenant.id, 
  isActive: true,
  createdAt: new Date(), 
  updatedAt: new Date()
};

const mockRole: Role = {
  id: "r_owner", 
  name: "OWNER", 
  tenantId: mockTenant.id,
  permissions: {} as Prisma.JsonValue, 
  inheritsFrom: null, 
  partner: null,
  lastModifiedAt: null, 
  lastModifiedBy: null,
  createdAt: new Date(), 
  updatedAt: new Date()
};

const mockSessionData: SessionData = {
  user: {
    id: "u_dev",
    name: "Dev",
    email: "owner@demo.local",
    passwordHash: "mock-hash",
    tenantId: mockTenant.id,
    pointId: mockPoint.id,
    isPlatformOwner: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    roles: [{ ...mockRole, tenant: mockTenant }],
    currentTenant: mockTenant,
    currentPoint: mockPoint,
  },
  isPlatformOwner: true,
  isAuthenticated: true,
};

export class MockSessionProvider implements SessionProvider {
  async getSession(): Promise<SessionData | null> {
    return mockSessionData
  }

  async requireSession(): Promise<SessionData> {
    return mockSessionData
  }

  async requirePlatformOwner(): Promise<SessionData> {
    if (!mockSessionData.isPlatformOwner) {
      throw new Error('Platform owner access required')
    }
    return mockSessionData
  }

  async requireTenant(): Promise<SessionData & { tenant: Tenant }> {
    if (!mockSessionData.user.currentTenant) {
      throw new Error('Tenant access required')
    }
    return {
      ...mockSessionData,
      tenant: mockSessionData.user.currentTenant,
    }
  }

  async hasRole(roleName: string): Promise<{ session: SessionData; role: Role } | null> {
    const role = mockSessionData.user.roles.find((r: any) => r.name === roleName)
    if (!role) {
      return null
    }
    return {
      session: mockSessionData,
      role: role,
    }
  }

  async hasAnyRole(roleNames: string[]): Promise<{ session: SessionData; roles: Role[] } | null> {
    const roles = mockSessionData.user.roles.filter((r: any) => roleNames.includes(r.name))
    if (roles.length === 0) {
      return null
    }
    return {
      session: mockSessionData,
      roles: roles,
    }
  }
}
