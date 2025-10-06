import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readFile } from "fs/promises";
import { lookup } from "mime-types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log(`[preview-route] Serving file preview for ID: ${id}`);

    // Находим файл в базе данных
    const file = await prisma.file.findUnique({
      where: { id },
    });

    if (!file) {
      console.log(`[preview-route] File not found: ${id}`);
      return new NextResponse("File not found", { status: 404 });
    }

    console.log(`[preview-route] Found file: ${file.originalName}, storageKey: ${file.storageKey}`);

    // Читаем файл с диска
    const filePath = `uploads/${file.storageKey}`;
    console.log(`[preview-route] File path: ${filePath}`);

    const fileBuffer = await readFile(filePath);
    console.log(`[preview-route] File size: ${fileBuffer.length} bytes`);

    // Определяем MIME тип
    let mimeType = file.mime;
    if (!mimeType) {
      mimeType = lookup(file.originalName) || 'application/octet-stream';
    }
    console.log(`[preview-route] MIME type: ${mimeType}`);

    // Возвращаем файл как Buffer с inline заголовком для превью
    const headers = new Headers();
    headers.set('Content-Type', mimeType);
    headers.set('Content-Length', fileBuffer.length.toString());
    
    // Для превью используем inline, чтобы браузер отображал файл
    const encodedFileName = encodeURIComponent(file.originalName);
    headers.set('Content-Disposition', `inline; filename*=UTF-8''${encodedFileName}`);
    headers.set('Cache-Control', 'public, max-age=86400');
    headers.set('Accept-Ranges', 'bytes');
    
    return new NextResponse(fileBuffer, { headers });

  } catch (error) {
    console.error("[preview-route] Error serving file preview:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}