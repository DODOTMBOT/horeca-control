import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ensureUser } from "@/lib/guards";
import prisma from "@/lib/prisma";
import { PermissionSet } from "@/lib/permission-types";

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  ensureUser(session);
  
  const userRole = session.user?.role as string;
  
  // Только ORGANIZATION_OWNER и выше может изменять разрешения ролей
  if (userRole !== "ORGANIZATION_OWNER" && userRole !== "PLATFORM_OWNER") {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  try {
    const { roleId, permissions } = await req.json();
    
    if (!roleId || !permissions) {
      return NextResponse.json({ error: "Role ID and permissions are required" }, { status: 400 });
    }

    // Проверяем, что роль существует
    const existingRole = await prisma.role.findUnique({ where: { id: roleId } });
    if (!existingRole) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    // Обновляем разрешения роли
    const updatedRole = await prisma.role.update({
      where: { id: roleId },
      data: {
        permissions: permissions as PermissionSet,
        lastModifiedAt: new Date(),
        lastModifiedBy: session.user?.id,
      },
    });

    return NextResponse.json({
      success: true,
      role: {
        id: updatedRole.id,
        name: updatedRole.name,
        permissions: updatedRole.permissions,
        updatedAt: updatedRole.updatedAt,
      }
    });
  } catch (error: unknown) {
    console.error("Error updating role permissions:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to update role permissions";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
