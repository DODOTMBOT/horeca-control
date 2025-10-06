import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No session" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        UserRole: { 
          include: { 
            role: true 
          } 
        },
      },
    });

    const roles = (user?.UserRole || [])
      .map((ur) => ur.role?.name)
      .filter(Boolean);

    return NextResponse.json({
      session: {
        user: session.user,
        userId: session.user.id,
        roles: (session.user as Record<string, unknown>).roles,
        tenantId: (session.user as Record<string, unknown>).tenantId,
        isPlatformOwner: (session.user as Record<string, unknown>).isPlatformOwner
      },
      dbUser: user ? {
        id: user.id,
        email: user.email,
        name: user.name,
        tenantId: user.tenantId,
        roles: roles,
        userRoles: user.UserRole.map(ur => ({
          id: ur.id,
          roleName: ur.role?.name,
          roleId: ur.roleId
        }))
      } : null,
    });
  } catch (error) {
    console.error("Error fetching user roles:", error);
    return NextResponse.json(
      { error: "Internal server error", details: (error as Error).message },
      { status: 500 }
    );
  }
}
