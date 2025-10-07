import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as Record<string, unknown>)?.role as string;
  
  // Только Partner может удалять свои точки
  if (userRole !== "PARTNER") {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  
  if (!id) {
    return NextResponse.json({ error: "Point ID required" }, { status: 400 });
  }

  const tenantId = (session?.user as Record<string, unknown>)?.tenantId as string;
  if (!tenantId) {
    return NextResponse.json({ error: "No tenant found" }, { status: 400 });
  }

  try {
    // Проверяем, что точка принадлежит партнеру
    const existingPoint = await prisma.point.findFirst({
      where: { id, tenantId },
      include: {
        _count: { select: { users: true } }
      }
    });

    if (!existingPoint) {
      return NextResponse.json({ error: "Point not found" }, { status: 404 });
    }

    // Если в точке есть пользователи, не удаляем, а деактивируем
    if (existingPoint._count.users > 0) {
      const point = await prisma.point.update({
        where: { id },
        data: { isActive: false }
      });

      return NextResponse.json({
        success: true,
        message: "Point deactivated (has users)",
        point
      });
    }

    // Если пользователей нет, удаляем точку
    await prisma.point.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: "Point deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting point:", error);
    return NextResponse.json(
      { error: "Failed to delete point" },
      { status: 500 }
    );
  }
}
