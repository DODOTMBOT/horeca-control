import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, folderId } = body;

    // Если передано имя - переименовываем
    if (name && name.trim()) {
      const updatedFile = await prisma.file.update({
        where: {
          id,
          createdById: session.user.id,
        },
        data: {
          displayName: name.trim(),
        },
      });
      return NextResponse.json({ success: true, file: updatedFile });
    }

    // Если передан folderId - перемещаем
    if (folderId !== undefined) {
      const updatedFile = await prisma.file.update({
        where: {
          id,
          createdById: session.user.id,
        },
        data: {
          folderId: folderId || null,
        },
      });
      return NextResponse.json({ success: true, file: updatedFile });
    }

    return NextResponse.json({ error: "Name or folderId is required" }, { status: 400 });
  } catch (error) {
    console.error("Error updating file:", error);
    return NextResponse.json(
      { error: "Failed to update file" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Удаляем файл из базы данных
    await prisma.file.delete({
      where: {
        id,
        createdById: session.user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}