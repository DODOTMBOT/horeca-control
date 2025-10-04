import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
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

    // Проверяем, является ли пользователь платформенным владельцем
    const isPlatformOwner = email === process.env.PLATFORM_OWNER_EMAIL
    console.log("[signup] Is platform owner:", isPlatformOwner)

    // Выполняем всё в транзакции
    await prisma.$transaction(async (tx) => {
      console.log("[signup] Starting transaction for email:", email)
      
      // Если не платформенный владелец, сначала создаем tenant
      let tenantId = null
      if (!isPlatformOwner) {
        console.log("[signup] Creating tenant for non-platform owner")
        
        // Создаем tenant
        const tenant = await tx.tenants.create({
          data: {
            id: `tenant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: `${email.split('@')[0]}-org`,
            email: email,
            updatedAt: new Date(),
          }
        })
        tenantId = tenant.id
        console.log("[signup] Tenant created with ID:", tenantId)
      }

      // Создаем пользователя
      console.log("[signup] Creating user")
      const user = await tx.user.create({
        data: {
          email,
          name: name || email.split('@')[0],
          passwordHash,
          isPlatformOwner,
          tenantId: tenantId,
        }
      })
      console.log("[signup] User created with ID:", user.id)

      // Если не платформенный владелец, назначаем роль OWNER
      if (!isPlatformOwner && tenantId) {
        console.log("[signup] Looking for OWNER role")
        
        // Находим или создаем роль OWNER
        let ownerRole = await tx.role.findUnique({
          where: { name: "OWNER" }
        })

        if (!ownerRole) {
          console.log("[signup] Creating OWNER role")
          ownerRole = await tx.role.create({
            data: {
              name: "OWNER",
              description: "Organization owner with full access",
              updatedAt: new Date()
            }
          })
        }

        console.log("[signup] Found/created OWNER role, assigning to user")
        // Назначаем роль OWNER
        await tx.userRole.create({
          data: {
            userId: user.id,
            roleId: ownerRole.id
          }
        })
        console.log("[signup] Role assigned successfully")
      }
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