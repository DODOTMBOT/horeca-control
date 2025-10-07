"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function assignUserRoleAction(input: { 
  userId: string; 
  tenantId: string; 
  roleName: string;
}) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const { userId, tenantId, roleName } = input;

  // Проверяем авторизацию: только платформенный владелец ИЛИ владелец текущего tenant
  const isPlatformOwner = (session.user as any)?.isPlatformOwner;
  const userTenantId = (session.user as any)?.tenantId;
  
  if (!isPlatformOwner && userTenantId !== tenantId) {
    throw new Error("Access denied");
  }

  // Проверяем, что пользователь существует
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error("User not found");
  }

  // Проверяем, что роль существует
  const role = await prisma.role.findUnique({ where: { name: roleName } });
  if (!role) {
    throw new Error("Role not found");
  }

  try {
    // Транзакция: удаляем старые роли и создаем новую
    await prisma.$transaction(async (tx) => {
      // Удаляем все существующие роли пользователя для данного tenant
      await tx.userRole.deleteMany({
        where: { userId, tenantId }
      });

      // Создаем новую роль
      await tx.userRole.create({
        data: { 
          userId, 
          tenantId, 
          roleId: role.id 
        }
      });
    });

    // Обновляем кэш страницы
    revalidatePath("/owner/users");
    
    return { success: true };
  } catch (error) {
    console.error("Error assigning role:", error);
    throw new Error("Failed to assign role");
  }
}