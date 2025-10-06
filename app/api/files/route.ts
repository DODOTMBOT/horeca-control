import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get("folderId");
    const search = searchParams.get("search");

    // Проверяем, что у пользователя есть tenantId
    if (!session.user.tenantId) {
      return NextResponse.json({ error: "Пользователь не привязан к организации" }, { status: 400 });
    }

    // Получаем роли пользователя
    const userRoles = await prisma.UserRole.findMany({
      where: { userId: session.user.id },
      include: { role: true }
    });

    const roleIds = userRoles.map(ur => ur.roleId);

    // Получаем папки
    const folders = await prisma.folder.findMany({
      where: {
        tenantId: session.user.tenantId,
        parentId: folderId || null,
        ...(search && {
          name: {
            contains: search,
            mode: "insensitive"
          }
        }),
        OR: [
          { createdById: session.user.id }, // Создатель папки
          {
            accessRoles: {
              some: {
                roleId: { in: roleIds },
                canRead: true
              }
            }
          }
        ]
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
      },
      orderBy: { name: "asc" }
    });

    // Получаем файлы
    const files = await prisma.file.findMany({
      where: {
        tenantId: session.user.tenantId,
        folderId: folderId || null,
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } }
          ]
        }),
        OR: [
          { createdById: session.user.id }, // Создатель файла
          {
            accessRoles: {
              some: {
                roleId: { in: roleIds },
                canRead: true
              }
            }
          }
        ]
      },
      include: {
        accessRoles: {
          include: {
            role: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    // Форматируем файлы для фронтенда
    const formattedFiles = files.map(file => ({
      id: file.id,
      name: file.displayName || file.name, // Используем displayName если есть, иначе name
      size: file.size,
      type: file.mime,
      url: `/api/files/${file.id}/content`,
      createdAt: file.createdAt.toISOString(),
      description: file.description,
      author: {
        name: "Неизвестный автор",
        email: ""
      }
    }));

    return NextResponse.json(formattedFiles);

  } catch (error) {
    console.error("[files] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
