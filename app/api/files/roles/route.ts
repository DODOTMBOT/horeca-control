import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Получаем роли для текущего tenant
    const roles = await prisma.role.findMany({
      where: {
        OR: [
          { tenantId: session.user.tenantId },
          { tenantId: null } // Системные роли
        ]
      },
      select: {
        id: true,
        name: true,
        partner: true
      },
      orderBy: { name: "asc" }
    });

    return NextResponse.json(roles);

  } catch (error) {
    console.error("[files-roles] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
