import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ensureUser } from "@/lib/guards";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import UsersClient from "./UsersClient";

export const dynamic = "force-dynamic";

type UserDTO = { 
  id: string; 
  name?: string | null; 
  email: string; 
  roles: string[]; 
  tenant?: string | null; 
  isPlatformOwner?: boolean 
};

export default async function UsersPage() {
  const session = await getServerSession(authOptions);
  ensureUser(session);
  ensureUser(session);

  // Проверяем, что пользователь - платформенный владелец
  const isPlatformOwner = session.user?.isPlatformOwner;
  if (!isPlatformOwner) {
    redirect("/dashboard");
  }

  const currentTenantId = session.user.tenantId ?? "";

  // Загружаем пользователей с ролями из БД
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      isPlatformOwner: true,
      tenant: {
        select: {
          name: true
        }
      },
      UserRole: {
        where: currentTenantId ? { tenantId: currentTenantId } : undefined,
        select: {
          role: {
            select: {
              name: true
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  // Преобразуем в DTO
  const usersDTO: UserDTO[] = users.map(user => ({
    id: user.id,
    name: user.name,
    email: user.email,
    roles: user.UserRole.map(ur => ur.role.name),
    tenant: user.tenant?.name || null,
    isPlatformOwner: user.isPlatformOwner
  }));

  return (
    <UsersClient 
      initialUsers={usersDTO}
      currentTenantId={currentTenantId}
    />
  );
}