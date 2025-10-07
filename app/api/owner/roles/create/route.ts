import { ensureUser } from "@/lib/guards";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  ensureUser(session);
  const userRole = session.user?.role as string;
  
  // Только Owner может создавать роли
  if (userRole !== "OWNER") {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const { name, permissions, inheritsFrom, tenantId } = await req.json();
  
  if (!name) {
    return NextResponse.json({ error: "Role name required" }, { status: 400 });
  }

  // Проверяем, что роль с таким именем не существует
  const existingRole = await prisma.role.findUnique({ where: { name } });
  if (existingRole) {
    return NextResponse.json({ error: "Role with this name already exists" }, { status: 409 });
  }

  const role = await prisma.role.create({
    data: {
      name,
      permissions: permissions || {},
      inheritsFrom,
      tenantId: tenantId || null,
    },
  });

  return NextResponse.json({
    id: role.id,
    name: role.name,
    permissions: role.permissions,
    inheritsFrom: role.inheritsFrom,
    tenantId: role.tenantId,
    createdAt: role.createdAt,
  });
}
