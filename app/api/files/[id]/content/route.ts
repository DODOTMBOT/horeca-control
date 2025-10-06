import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import { lookup } from "mime-types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: fileId } = await params;
    console.log(`[content-route] Serving file content for ID: ${fileId}`);

    // Находим файл в базе данных
    const file = await prisma.file.findFirst({
      where: {
        id: fileId
      }
    });

    if (!file) {
      console.log(`[content-route] File not found: ${fileId}`);
      return new NextResponse("File not found", { status: 404 });
    }

    console.log(`[content-route] Found file: ${file.originalName}, storageKey: ${file.storageKey}`);

    // Строим путь к файлу
    const filePath = `uploads/${file.storageKey}`;
    console.log(`[content-route] File path: ${filePath}`);

    // Проверяем, что файл существует
    if (!existsSync(filePath)) {
      console.log(`[content-route] File not found on disk: ${filePath}`);
      return new NextResponse("File not found on disk", { status: 404 });
    }

    // Читаем файл
    const fileBuffer = await readFile(filePath);
    console.log(`[content-route] File size: ${fileBuffer.length} bytes`);

    // Определяем MIME тип
    let mimeType = file.mime;
    if (!mimeType) {
      mimeType = lookup(file.originalName) || 'application/octet-stream';
    }
    console.log(`[content-route] MIME type: ${mimeType}`);

    // Возвращаем файл как Buffer
    const headers = new Headers();
    headers.set('Content-Type', mimeType);
    headers.set('Content-Length', fileBuffer.length.toString());
    
    // Кодируем имя файла для поддержки кириллицы
    const encodedFileName = encodeURIComponent(file.originalName);
    headers.set('Content-Disposition', `attachment; filename*=UTF-8''${encodedFileName}`);
    headers.set('Cache-Control', 'public, max-age=86400');
    headers.set('Accept-Ranges', 'bytes');
    
    return new NextResponse(fileBuffer as any, { headers });

  } catch (error) {
    console.error("[content-route] Error serving file content:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function HEAD(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: fileId } = await params;
    console.log(`[content-route] HEAD request for file ID: ${fileId}`);

    // Находим файл в базе данных
    const file = await prisma.file.findFirst({
      where: {
        id: fileId
      }
    });

    if (!file) {
      console.log(`[content-route] File not found for HEAD: ${fileId}`);
      return new NextResponse("File not found", { status: 404 });
    }

    // Определяем MIME тип
    let mimeType = file.mime;
    if (!mimeType) {
      mimeType = lookup(file.originalName) || 'application/octet-stream';
    }
    console.log(`[content-route] HEAD MIME type: ${mimeType}`);

    // Кодируем имя файла для поддержки кириллицы
    const encodedFileName = encodeURIComponent(file.originalName);
    
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Length': file.size.toString(),
        'Content-Disposition': `attachment; filename*=UTF-8''${encodedFileName}`,
        'Cache-Control': 'public, max-age=86400',
        'Accept-Ranges': 'bytes',
      },
    });

  } catch (error) {
    console.error("[content-route] Error serving file HEAD:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}