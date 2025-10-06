import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No session" }, { status: 401 });
    }

    // Получаем пользователя с ролями из базы данных
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        UserRole: {
          include: {
            role: true
          }
        }
      }
    });

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
        roles: user.UserRole.map(ur => ur.role.name),
        tenantId: user.tenantId
      } : null
    });

  } catch (error) {
    console.error("[debug-session] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}