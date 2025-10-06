import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as Record<string, unknown>)?.role as string;
  
  // Только Owner может назначать роли
  if (userRole !== "Owner") {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const { userId, roleName, tenantId } = await req.json();
  
  if (!userId || !roleName) {
    return NextResponse.json({ error: "User ID and role name required" }, { status: 400 });
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

  // Удаляем все существующие роли пользователя
  await prisma.userRole.deleteMany({
    where: { userId }
  });

  // Назначаем новую роль
  const userRoleRecord = await prisma.userRole.create({
    data: {
      userId,
      roleId: role.id,
      tenantId: tenantId || user.tenantId,
    },
    include: {
      role: true,
      user: {
        select: { id: true, email: true, name: true }
      }
    }
  });

  return NextResponse.json({
    id: userRoleRecord.id,
    user: userRoleRecord.user,
    role: userRoleRecord.role,
    tenantId: userRoleRecord.tenantId,
  });
}