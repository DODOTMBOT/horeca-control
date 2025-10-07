import { ensureUser } from "@/lib/guards";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  ensureUser(session);
  
  if (!session.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId, tenantId, roleName } = await req.json();
  
  if (!userId || !tenantId || !roleName) {
    return NextResponse.json({ error: "userId, tenantId and roleName are required" }, { status: 400 });
  }

  // Проверяем авторизацию: только платформенный владелец ИЛИ владелец текущего tenant
  const isPlatformOwner = session.user?.isPlatformOwner;
  const userTenantId = session.user?.tenantId;
  
  if (!isPlatformOwner && userTenantId !== tenantId) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  // Проверяем, что пользователь существует
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Проверяем, что роль существует
  const role = await prisma.role.findUnique({ where: { name: roleName } });
  if (!role) {
    return NextResponse.json({ error: "Role not found" }, { status: 404 });
  }

  try {
    // Транзакция: удаляем старые роли и создаем новую
    const _result = await prisma.$transaction(async (tx) => {
      // Удаляем все существующие роли пользователя для данного tenant
      await tx.userRole.deleteMany({
        where: { userId, tenantId }
      });

      // Создаем новую роль
      const userRoleRecord = await tx.userRole.create({
        data: { 
          userId, 
          tenantId, 
          roleId: role.id 
        }
      });

      return userRoleRecord;
    });

    // Возвращаем обновленные роли пользователя
    const updatedUserRoles = await prisma.userRole.findMany({
      where: { userId, tenantId },
      select: { 
        id: true,
        userId: true,
        roleId: true,
        tenantId: true,
        role: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      roles: updatedUserRoles.map(ur => ur.role.name)
    });

  } catch (error) {
    console.error("Error assigning role:", error);
    return NextResponse.json({ error: "Failed to assign role" }, { status: 500 });
  }
}