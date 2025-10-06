export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getUserRole, hasRole } from "@/lib/acl"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userRole = await getUserRole(session.user.id, session.user.tenantId!)
    
    if (!hasRole(userRole, "Владелец") && !session.user.isPlatformOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Получаем все роли
    const roles = await prisma.role.findMany({
      select: {
        id: true,
        name: true,
        permissions: true,
        createdAt: true,
        updatedAt: true,
        userRoles: {
          select: {
            id: true,
            userId: true,
            roleId: true,
            tenantId: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Форматируем данные для фронтенда
    const formattedRoles = roles.map(role => ({
      id: role.id,
      name: role.name,
      permissions: role.permissions,
      userCount: role.userRoles.length,
      users: role.userRoles.map(ur => ({
        id: ur.user.id,
        name: ur.user.name,
        email: ur.user.email
      })),
      createdAt: role.createdAt,
      updatedAt: role.updatedAt
    }))

    return NextResponse.json({ roles: formattedRoles })
  } catch (error: unknown) {
    console.error("Error fetching roles:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch roles"
    const status = (error as { status?: number })?.status || 500
    return NextResponse.json(
      { error: errorMessage },
      { status }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userRole = await getUserRole(session.user.id, session.user.tenantId!)
    
    if (!hasRole(userRole, "Владелец") && !session.user.isPlatformOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { name, permissions } = await request.json()

    if (!name) {
      return NextResponse.json({ error: "Role name is required" }, { status: 400 })
    }

    // Проверяем, что роль с таким именем не существует
    const existingRole = await prisma.role.findUnique({
      where: { name }
    })

    if (existingRole) {
      return NextResponse.json({ error: "Role with this name already exists" }, { status: 400 })
    }

    // Создаем новую роль
    const roleRecord = await prisma.role.create({
      data: {
        name,
        permissions: permissions || {}
      }
    })

    return NextResponse.json({
      success: true,
      role: {
        id: roleRecord.id,
        name: roleRecord.name,
        permissions: roleRecord.permissions,
        createdAt: roleRecord.createdAt,
        updatedAt: roleRecord.updatedAt
      }
    })
  } catch (error: unknown) {
    console.error("Error creating role:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to create role"
    const status = (error as { status?: number })?.status || 500
    return NextResponse.json(
      { error: errorMessage },
      { status }
    )
  }
}
