import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

const uploadSchema = z.object({
  name: z.string().min(1, "Название файла обязательно"),
  displayName: z.string().min(1, "Отображаемое название файла обязательно"),
  description: z.string().optional(),
  folderId: z.string().nullable().optional(),
  accessRoles: z.array(z.object({
    roleId: z.string(),
    canRead: z.boolean().default(true),
    canWrite: z.boolean().default(false),
    canDelete: z.boolean().default(false)
  })).optional()
});

export async function POST(request: NextRequest) {
  try {
    console.log("[files-upload] Starting file upload process");
    const session = await auth();
    if (!session?.user?.id) {
      console.error("[files-upload] No session or user ID");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    console.log("[files-upload] User session:", {
      userId: session.user.id,
      tenantId: session.user.tenantId,
      email: session.user.email
    });

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const metadata = formData.get("metadata") as string;

    if (!file) {
      console.error("[files-upload] No file provided");
      return NextResponse.json({ error: "Файл не найден" }, { status: 400 });
    }

    if (!metadata) {
      console.error("[files-upload] No metadata provided");
      return NextResponse.json({ error: "Метаданные не найдены" }, { status: 400 });
    }

    let parsedMetadata;
    try {
      parsedMetadata = JSON.parse(metadata);
    } catch (error) {
      console.error("[files-upload] Failed to parse metadata:", error);
      return NextResponse.json({ error: "Неверный формат метаданных" }, { status: 400 });
    }

    let validatedData;
    try {
      validatedData = uploadSchema.parse(parsedMetadata);
    } catch (error) {
      console.error("[files-upload] Validation error:", error);
      return NextResponse.json({ 
        error: "Ошибка валидации", 
        details: error instanceof z.ZodError ? error.issues : "Неизвестная ошибка валидации"
      }, { status: 400 });
    }

    const { name, displayName, description, folderId, accessRoles } = validatedData;

    // Проверяем, что у пользователя есть tenantId
    if (!session.user.tenantId) {
      console.error("[files-upload] User has no tenantId:", session.user);
      return NextResponse.json({ 
        error: "Пользователь не привязан к организации",
        message: "Для загрузки файлов необходимо быть привязанным к организации"
      }, { status: 400 });
    }

    // Проверяем, что папка существует и принадлежит тому же tenant
    if (folderId) {
      const folder = await prisma.folder.findFirst({
        where: {
          id: folderId,
          tenantId: session.user.tenantId
        }
      });

      if (!folder) {
        return NextResponse.json({ error: "Папка не найдена" }, { status: 404 });
      }
    }

    // Генерируем уникальное имя файла и storageKey
    const fileExtension = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`;
    const storageKey = `${session.user.tenantId}/${fileName}`;
    const filePath = join(process.cwd(), "uploads", storageKey);

    // Создаем директорию для файлов
    const uploadDir = join(process.cwd(), "uploads", session.user.tenantId);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Сохраняем файл
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Сохраняем информацию о файле в базу данных
    const savedFile = await prisma.file.create({
      data: {
        name: displayName, // Используем displayName как основное название
        displayName,
        originalName: file.name,
        size: file.size,
        mime: file.type,
        description,
        folderId,
        tenantId: session.user.tenantId,
        createdById: session.user.id,
        storageKey,
        ext: fileExtension,
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
        accessRoles: {
          include: {
            role: {
              select: { name: true }
            }
          }
        }
      }
    });

    return NextResponse.json({
      id: savedFile.id,
      url: `/api/files/${savedFile.id}/content`
    });

  } catch (error) {
    console.error("[files-upload] Error:", error);
    console.error("[files-upload] Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: "Validation error", 
        details: error.issues 
      }, { status: 400 });
    }
    
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error occurred"
      },
      { status: 500 }
    );
  }
}
