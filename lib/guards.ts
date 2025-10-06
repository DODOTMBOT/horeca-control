export const runtime = "nodejs";

import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"

export async function requireSession() {
  const session = await auth()
  
  if (!session) {
    redirect("/api/auth/signin")
  }
  
  return session
}

export async function requirePlatformOwner() {
  const session = await requireSession()
  
  if (!session.user.isPlatformOwner) {
    redirect("/")
  }
  
  return session
}

export async function requireTenant() {
  const session = await requireSession()
  
  if (!session.user.tenantId) {
    throw new Error("User must have a tenant")
  }
  
  return session
}

export async function hasRole(role: string) {
  const session = await requireTenant()
  
  const userRole = await prisma.userRole.findFirst({
    where: {
      userId: session.user.id,
      role: {
        name: role
      }
    },
    select: {
      id: true,
      userId: true,
      roleId: true,
      tenantId: true,
      role: {
        select: {
          id: true,
          name: true,
          permissions: true
        }
      }
    }
  })
  
  if (!userRole) {
    throw new Error(`User does not have role: ${role}`)
  }
  
  return { session, role: userRole.role }
}

export async function hasAnyRole(roles: string[]) {
  const session = await requireTenant()
  
  const userRoles = await prisma.userRole.findMany({
    where: {
      userId: session.user.id,
      role: {
        name: {
          in: roles
        }
      }
    },
    select: {
      id: true,
      userId: true,
      roleId: true,
      tenantId: true,
      role: {
        select: {
          id: true,
          name: true,
          permissions: true
        }
      }
    }
  })
  
  if (userRoles.length === 0) {
    throw new Error(`User does not have any of the required roles: ${roles.join(", ")}`)
  }
  
  return { session, roles: userRoles.map(ur => ur.role) }
}
