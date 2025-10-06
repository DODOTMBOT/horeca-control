import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as Record<string, unknown>)?.role as string;
  
  // Только Partner может получать список своих точек
  if (userRole !== "Partner") {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const tenantId = (session?.user as Record<string, unknown>)?.tenantId as string;
  if (!tenantId) {
    return NextResponse.json({ error: "No tenant found" }, { status: 400 });
  }

  try {
    const points = await prisma.point.findMany({
      where: { tenantId },
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
      },
      orderBy: { createdAt: "desc" }
    });

    const data = points.map(point => ({
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
    }));

    return NextResponse.json(data);

  } catch (error) {
    console.error("Error fetching points:", error);
    return NextResponse.json(
      { error: "Failed to fetch points" },
      { status: 500 }
    );
  }
}
