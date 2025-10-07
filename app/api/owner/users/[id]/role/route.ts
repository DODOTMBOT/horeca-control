export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getUserRole, hasRole } from "@/lib/acl"
import prisma from "@/lib/prisma"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userRole = await getUserRole(session.user.id, session.user.tenantId!)
    
    if (!hasRole(userRole, "OWNER") && !session.user.isPlatformOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { roleName } = await request.json()
    const { id: userId } = await params

    if (!roleName) {
      return NextResponse.json({ error: "Role name is required" }, { status: 400 })
    }

    // Проверяем, что роль существует
    const roleRecord = await prisma.role.findUnique({
      where: { name: roleName }
    })

    if (!roleRecord) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 })
    }

    // Проверяем, что пользователь существует
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Получаем пользователя для получения его tenantId
    const userRecord = await prisma.user.findUnique({
      where: { id: userId },
      select: { tenantId: true }
    })

    if (!userRecord) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Удаляем все существующие роли пользователя
    await prisma.userRole.deleteMany({
      where: { 
        userId,
        tenantId: userRecord.tenantId
      }
    })

    // Добавляем новую роль
    await prisma.userRole.create({
      data: {
        userId,
        roleId: roleRecord.id,
        tenantId: userRecord.tenantId
      }
    })

    return NextResponse.json({
      success: true,
      message: "User role updated successfully"
    })
  } catch (error: unknown) {
    console.error("Error updating user role:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to update user role"
    const status = (error as { status?: number })?.status || 500
    return NextResponse.json(
      { error: errorMessage },
      { status }
    )
  }
}
