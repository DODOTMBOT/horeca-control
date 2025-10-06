import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as Record<string, unknown>)?.role as string;
  
  // Только Owner может удалять роли
  if (userRole !== "Owner") {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  
  if (!id) {
    return NextResponse.json({ error: "Role ID required" }, { status: 400 });
  }

  // Проверяем, что роль существует
  const existingRole = await prisma.role.findUnique({ 
    where: { id },
    include: { _count: { select: { userRoles: true } } }
  });
  
  if (!existingRole) {
    return NextResponse.json({ error: "Role not found" }, { status: 404 });
  }

  // Нельзя удалить роль, если она назначена пользователям
  if (existingRole._count.userRoles > 0) {
    return NextResponse.json({ 
      error: "Cannot delete role that is assigned to users" 
    }, { status: 400 });
  }

  // Нельзя удалить базовые роли
  const baseRoles = ["Owner", "Partner", "Point"];
  if (baseRoles.includes(existingRole.name)) {
    return NextResponse.json({ 
      error: "Cannot delete base system roles" 
    }, { status: 400 });
  }

  await prisma.role.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
