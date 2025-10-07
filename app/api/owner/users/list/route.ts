import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as Record<string, unknown>)?.role as string;
  
  // Только Owner может получить список всех пользователей
  if (userRole !== "OWNER") {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      isPlatformOwner: true,
      createdAt: true,
      UserRole: { 
        select: { 
          id: true,
          roleId: true,
          tenantId: true,
          role: {
            select: {
              id: true,
              name: true
            }
          }
        } 
      },
      tenant: {
        select: { name: true }
      }
    },
    orderBy: { createdAt: "desc" },
  });

  const data = users.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    roles: u.UserRole.map(ur => ur.role?.name).filter(Boolean) as string[],
    tenant: u.tenant?.name || null,
    isPlatformOwner: u.isPlatformOwner,
  }));

  return NextResponse.json(data);
}
