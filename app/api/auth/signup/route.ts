export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

const signupSchema = z.object({
  email: z.string().email("Неверный формат email").transform(v => v.trim().toLowerCase()),
  password: z.string().min(8, "Пароль должен содержать минимум 8 символов").max(72, "Пароль слишком длинный"),
  name: z.string().trim().max(120, "Имя слишком длинное").optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name } = signupSchema.parse(body)

    console.log("[signup] Starting registration for:", email)

    // Быстрая проверка соединения с БД
    await prisma.$queryRaw`SELECT 1`
    console.log("[db] url tail:", process.env.DATABASE_URL?.slice(-30))

    // Проверяем уникальность email
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      console.log("[signup] Email already exists:", email)
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 409 }
      )
    }

    // Хешируем пароль
    const passwordHash = await bcrypt.hash(password, 12)
    console.log("[signup] Password hashed successfully")

    // Проверяем, есть ли уже owner пользователь в системе
    const existingOwner = await prisma.user.findFirst({
      where: { isPlatformOwner: true }
    })
    const isFirstUser = !existingOwner
    console.log("[signup] Is first user (owner):", isFirstUser)

    // Получаем или создаем tenant
    let tenantId: string | null = null
    if (isFirstUser) {
      // Для первого пользователя (owner) создаем новый tenant
      const tenant = await prisma.tenant.create({
        data: {
          name: `${email.split('@')[0]}-org`,
          email: email,
        }
      })
      tenantId = tenant.id
      console.log("[signup] Created new tenant with ID:", tenantId)
    } else {
      // Для остальных пользователей создаем новый tenant (они будут Partner)
      const tenant = await prisma.tenant.create({
        data: {
          name: `${email.split('@')[0]}-org`,
          email: email,
        }
      })
      tenantId = tenant.id
      console.log("[signup] Created new tenant for partner with ID:", tenantId)
    }

    // Выполняем всё в транзакции
    await prisma.$transaction(async (tx) => {
      console.log("[signup] Starting transaction for email:", email)
      
      // Создаем пользователя
      console.log("[signup] Creating user")
      const user = await tx.user.create({
        data: {
          email,
          name: name || email.split('@')[0],
          passwordHash,
          isPlatformOwner: isFirstUser, // Первый пользователь становится платформенным владельцем
          tenantId: tenantId, // Обязательное поле tenantId
        }
      })
      console.log("[signup] User created with ID:", user.id)

      // Определяем роль для назначения
      const roleName = isFirstUser ? "Owner" : "Partner"

      console.log("[signup] Looking for role:", roleName)
      
      // Находим роль
      const role = await tx.role.findUnique({
        where: { name: roleName }
      })

      if (!role) {
        console.log("[signup] Role not found:", roleName)
        throw new Error(`Role ${roleName} not found`)
      }

      console.log("[signup] Found role, assigning to user")
      // Назначаем роль с обязательным tenantId
      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: role.id,
          tenantId: tenantId // Обязательное поле tenantId
        }
      })
      console.log("[signup] Role assigned successfully")
    })

    console.log("✅ Auth working - User registered:", email)
    return NextResponse.json({ ok: true }, { status: 201 })

  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: "Validation failed", 
          issues: error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        },
        { status: 400 }
      )
    }

    // Подробное логирование ошибки
    console.error("[signup] Detailed error:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      code: (error as { code?: string })?.code,
      meta: (error as { meta?: unknown })?.meta,
      stack: error instanceof Error ? error.stack : undefined
    })

    // Обработка специфичных ошибок Prisma
    const prismaError = error as { code?: string; meta?: { target?: string } }
    if (prismaError.code === 'P2002') {
      const target = prismaError.meta?.target
      if (target?.includes('email')) {
        return NextResponse.json(
          { error: "Email already in use" },
          { status: 409 }
        )
      }
      if (target?.includes('tenantId')) {
        return NextResponse.json(
          { error: "Tenant already exists for this user" },
          { status: 409 }
        )
      }
    }

    if (prismaError.code === 'P2025') {
      return NextResponse.json(
        { error: "Required record not found" },
        { status: 400 }
      )
    }

    if (prismaError.code === 'P1001') {
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 503 }
      )
    }

    console.error("[signup] Unexpected error:", error)
    return NextResponse.json(
      { error: "Signup failed" },
      { status: 500 }
    )
  }
}