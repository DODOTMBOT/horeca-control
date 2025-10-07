import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as Record<string, unknown>)?.role as string;
  
  // Только Partner может создавать точки
  if (userRole !== "PARTNER") {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const { name, address, phone, email } = await req.json();
  
  if (!name) {
    return NextResponse.json({ error: "Point name required" }, { status: 400 });
  }

  const tenantId = (session?.user as Record<string, unknown>)?.tenantId as string;
  if (!tenantId) {
    return NextResponse.json({ error: "No tenant found" }, { status: 400 });
  }

  try {
    // Выполняем всё в транзакции
    const result = await prisma.$transaction(async (tx) => {
      // 1. Создаем точку
      const point = await tx.point.create({
        data: {
          name,
          address: address || null,
          phone: phone || null,
          email: email || null,
          tenantId,
        }
      });

      // 2. Генерируем логин и пароль для точки
      const pointLogin = `point_${point.id.slice(-8)}`;
      const pointPassword = randomBytes(8).toString("base64url");
      const passwordHash = await bcrypt.hash(pointPassword, 12);

      // 3. Создаем пользователя для точки
      const pointUser = await tx.user.create({
        data: {
          email: `${pointLogin}@point.local`, // Временный email
          name: `${name} (Point User)`,
          passwordHash,
          tenantId,
          pointId: point.id,
          UserRole: {
            create: [{
              role: { connect: { name: "POINT" } },
              tenantId
            }]
          }
        },
        include: {
          UserRole: {
            include: { role: true }
          }
        }
      });

      return {
        point,
        user: {
          id: pointUser.id,
          login: pointLogin,
          password: pointPassword,
          email: pointUser.email,
          name: pointUser.name,
          roles: pointUser.UserRole.map(ur => ur.role?.name).filter(Boolean)
        }
      };
    });

    return NextResponse.json({
      success: true,
      point: result.point,
      credentials: {
        login: result.user.login,
        password: result.user.password,
        email: result.user.email
      },
      message: "Point created successfully with user credentials"
    });

  } catch (error) {
    console.error("Error creating point:", error);
    return NextResponse.json(
      { error: "Failed to create point" },
      { status: 500 }
    );
  }
}
