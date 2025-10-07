import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ensureUser } from "@/lib/guards";

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  ensureUser(session);
  ensureUser(session);
  const userRole = session.user.role ?? null;
  
  // Только ORGANIZATION_OWNER и выше может обновлять роли
  if (userRole !== "ORGANIZATION_OWNER" && userRole !== "PLATFORM_OWNER") {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const { id, name, permissions, inheritsFrom, tenantId } = await req.json();
  
  if (!id) {
    return NextResponse.json({ error: "Role ID required" }, { status: 400 });
  }

  // Проверяем, что роль существует
  const existingRole = await prisma.role.findUnique({ where: { id } });
  if (!existingRole) {
    return NextResponse.json({ error: "Role not found" }, { status: 404 });
  }

  // Если меняется имя, проверяем уникальность
  if (name && name !== existingRole.name) {
    const nameExists = await prisma.role.findUnique({ where: { name } });
    if (nameExists) {
      return NextResponse.json({ error: "Role with this name already exists" }, { status: 409 });
    }
  }

  const role = await prisma.role.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(permissions && { permissions }),
      ...(inheritsFrom !== undefined && { inheritsFrom }),
      ...(tenantId !== undefined && { tenantId }),
      lastModifiedAt: new Date(),
      lastModifiedBy: session.user?.id,
    },
  });

  return NextResponse.json({
    id: role.id,
    name: role.name,
    permissions: role.permissions,
    inheritsFrom: role.inheritsFrom,
    tenantId: role.tenantId,
    updatedAt: role.updatedAt,
  });
}
