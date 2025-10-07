export const runtime = "nodejs";

import { NextResponse } from "next/server"
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
    
    if (!hasRole(userRole, "OWNER") && !session.user.isPlatformOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Получаем всех пользователей с их ролями
    const users = await prisma.user.findMany({
      include: {
        tenant: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Форматируем данные для фронтенда
    const formattedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      isPlatformOwner: user.isPlatformOwner,
      tenantName: user.tenant?.name || null,
      roleName: user.isPlatformOwner ? "OWNER" : "Нет роли",
      createdAt: user.createdAt
    }))

    return NextResponse.json({ users: formattedUsers })
  } catch (error: unknown) {
    console.error("Error fetching users:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch users"
    const status = (error as { status?: number })?.status || 500
    return NextResponse.json(
      { error: errorMessage },
      { status }
    )
  }
}
