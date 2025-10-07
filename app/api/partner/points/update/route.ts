import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as Record<string, unknown>)?.role as string;
  
  // Только Partner может обновлять свои точки
  if (userRole !== "PARTNER") {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const { id, name, address, phone, email, isActive } = await req.json();
  
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
      where: { id, tenantId }
    });

    if (!existingPoint) {
      return NextResponse.json({ error: "Point not found" }, { status: 404 });
    }

    const point = await prisma.point.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(address !== undefined && { address }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            name: true,
            UserRole: {
              include: { role: true }
            }
          }
        },
        _count: {
          select: { users: true }
        }
      }
    });

    const data = {
      id: point.id,
      name: point.name,
      address: point.address,
      phone: point.phone,
      email: point.email,
      isActive: point.isActive,
      createdAt: point.createdAt,
      updatedAt: point.updatedAt,
      userCount: point._count.users,
      users: point.users.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.UserRole.map(ur => ur.role?.name).filter(Boolean)
      }))
    };

    return NextResponse.json(data);

  } catch (error) {
    console.error("Error updating point:", error);
    return NextResponse.json(
      { error: "Failed to update point" },
      { status: 500 }
    );
  }
}
