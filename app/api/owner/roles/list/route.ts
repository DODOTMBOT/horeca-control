import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as Record<string, unknown>)?.role as string;
  
  // Только Owner может получить список всех ролей
  if (userRole !== "Owner") {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const roles = await prisma.role.findMany({
    include: {
      userRoles: {
        include: {
          user: {
            select: { id: true, email: true, name: true }
          }
        }
      },
      _count: {
        select: { userRoles: true }
      }
    },
    orderBy: { name: "asc" },
  });

  const data = roles.map(role => ({
    id: role.id,
    name: role.name,
    permissions: role.permissions,
    inheritsFrom: role.inheritsFrom,
    tenantId: role.tenantId,
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
    userCount: role._count.userRoles,
    users: role.userRoles.map(ur => ({
      id: ur.user.id,
      email: ur.user.email,
      name: ur.user.name
    }))
  }));

  return NextResponse.json(data);
}