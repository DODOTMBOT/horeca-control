import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get("parentId");

    if (!session.user.tenantId) {
      return NextResponse.json({ error: "Пользователь не привязан к организации" }, { status: 400 });
    }

    // Получаем папки для текущего tenant
    const folders = await prisma.folder.findMany({
      where: {
        tenantId: session.user.tenantId,
        parentId: parentId || null
      },
      include: {
        creator: {
          select: { name: true, email: true }
        },
        _count: {
          select: {
            files: true,
            children: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    // Преобразуем данные в формат для фронтенда
    const formattedFolders = folders.map(folder => ({
      id: folder.id,
      name: folder.name,
      fileCount: folder._count.files,
      category: folder.name.includes("Customer") || folder.name.includes("Клиент") ? "Customer" : "Teammate",
      createdAt: folder.createdAt.toISOString(),
      description: folder.description,
      creator: folder.creator
    }));

    return NextResponse.json(formattedFolders);

  } catch (error) {
    console.error("[files-folders] GET Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

const createFolderSchema = z.object({
  name: z.string().min(1, "Название папки обязательно"),
  description: z.string().optional(),
  parentId: z.string().nullable().optional(),
  accessRoles: z.array(z.object({
    roleId: z.string(),
    canRead: z.boolean().default(true),
    canWrite: z.boolean().default(false),
    canDelete: z.boolean().default(false)
  })).optional()
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.error("[files-folders] Failed to parse JSON:", error);
      return NextResponse.json({ error: "Неверный формат JSON" }, { status: 400 });
    }

    let validatedData;
    try {
      validatedData = createFolderSchema.parse(body);
    } catch (error) {
      console.error("[files-folders] Validation error:", error);
      return NextResponse.json({ 
        error: "Ошибка валидации", 
        details: error instanceof z.ZodError ? error.issues : "Неизвестная ошибка валидации"
      }, { status: 400 });
    }

    const { name, description, parentId, accessRoles } = validatedData;

    // Проверяем, что родительская папка существует и принадлежит тому же tenant
    if (parentId && session.user.tenantId) {
      const parentFolder = await prisma.folder.findFirst({
        where: {
          id: parentId,
          tenantId: session.user.tenantId
        }
      });

      if (!parentFolder) {
        return NextResponse.json({ error: "Родительская папка не найдена" }, { status: 404 });
      }
    }

    // Проверяем, что у пользователя есть tenantId
    if (!session.user.tenantId) {
      return NextResponse.json({ error: "Пользователь не привязан к организации" }, { status: 400 });
    }

    // Создаем папку
    const folder = await prisma.folder.create({
      data: {
        name,
        description,
        parentId,
        tenantId: session.user.tenantId,
        createdById: session.user.id,
        accessRoles: accessRoles ? {
          create: accessRoles.map(role => ({
            roleId: role.roleId,
            canRead: role.canRead,
            canWrite: role.canWrite,
            canDelete: role.canDelete
          }))
        } : undefined
      },
      include: {
        creator: {
          select: { name: true, email: true }
        },
        accessRoles: {
          include: {
            role: {
              select: { name: true }
            }
          }
        },
        _count: {
          select: {
            files: true,
            children: true
          }
        }
      }
    });

    return NextResponse.json(folder);

  } catch (error) {
    console.error("[files-folders] Error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
