import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as Record<string, unknown>)?.role as string;
  
  // Только Owner может создавать пользователей
  if (userRole !== "Owner") {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const { email, name, role, tenantId } = await req.json();
  
  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return NextResponse.json({ error: "User exists" }, { status: 409 });
  }

  const tempPass = randomBytes(6).toString("base64url");
  const hash = await bcrypt.hash(tempPass, 10);

  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash: hash,
      tenantId: tenantId || null,
      UserRole: {
        create: [{ 
          role: { connect: { name: role || "Point" } }, 
          tenantId: tenantId || null
        }],
      },
    },
    include: { 
      UserRole: { include: { role: true } } 
    },
  });

  // TODO: опционально отправить tempPass по email владельцу/сотруднику
  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: user.name,
    roles: user.UserRole.map(ur => ur.role?.name).filter(Boolean),
  });
}
