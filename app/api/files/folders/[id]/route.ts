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
    const { name, parentId } = body;

    // Если передано имя - переименовываем
    if (name && name.trim()) {
      const updatedFolder = await prisma.folder.update({
        where: {
          id,
          createdById: session.user.id,
        },
        data: {
          name: name.trim(),
        },
      });
      return NextResponse.json({ success: true, folder: updatedFolder });
    }

    // Если передан parentId - перемещаем
    if (parentId !== undefined) {
      const updatedFolder = await prisma.folder.update({
        where: {
          id,
          createdById: session.user.id,
        },
        data: {
          parentId: parentId || null,
        },
      });
      return NextResponse.json({ success: true, folder: updatedFolder });
    }

    return NextResponse.json({ error: "Name or parentId is required" }, { status: 400 });
  } catch (error) {
    console.error("Error updating folder:", error);
    return NextResponse.json(
      { error: "Failed to update folder" },
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

    // Удаляем папку из базы данных
    await prisma.folder.delete({
      where: {
        id,
        createdById: session.user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting folder:", error);
    return NextResponse.json(
      { error: "Failed to delete folder" },
      { status: 500 }
    );
  }
}