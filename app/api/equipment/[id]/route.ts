import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserRole } from "@/lib/acl";
import prisma from "@/lib/prisma";

// DELETE - Удалить оборудование
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: equipmentId } = await params;
    const userRole = await getUserRole(session.user.id, session.user.tenantId);
    const tenantId = session.user.tenantId;
    const pointId = session.user.pointId;

    // Проверяем права доступа
    if (userRole !== "OWNER" && userRole !== "PARTNER" && userRole !== "POINT") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // Проверяем, что оборудование существует и принадлежит пользователю
    const existingEquipment = await prisma.equipment.findFirst({
      where: {
        id: equipmentId,
        tenantId,
        ...(userRole === "POINT" && pointId && { pointId })
      }
    });

    if (!existingEquipment) {
      return NextResponse.json({ error: "Equipment not found or access denied" }, { status: 404 });
    }

    // Удаляем оборудование
    await prisma.equipment.delete({
      where: {
        id: equipmentId
      }
    });

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('Error deleting equipment:', error);
    return NextResponse.json({ error: "Failed to delete equipment" }, { status: 500 });
  }
}

// PUT - Обновить оборудование
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: equipmentId } = await params;
    const userRole = await getUserRole(session.user.id, session.user.tenantId);
    const tenantId = session.user.tenantId;
    const pointId = session.user.pointId;

    // Проверяем права доступа
    if (userRole !== "OWNER" && userRole !== "PARTNER" && userRole !== "POINT") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // equipmentId уже определен выше
    const body = await req.json();
    const { type, zone, description, serialNumber, status } = body;

    // Проверяем, что оборудование существует и принадлежит пользователю
    const existingEquipment = await prisma.equipment.findFirst({
      where: {
        id: equipmentId,
        tenantId,
        ...(userRole === "POINT" && pointId && { pointId })
      }
    });

    if (!existingEquipment) {
      return NextResponse.json({ error: "Equipment not found or access denied" }, { status: 404 });
    }

    // Обновляем оборудование
    const updatedEquipment = await prisma.equipment.update({
      where: {
        id: equipmentId
      },
      data: {
        ...(type && { type }),
        ...(zone && { zone }),
        ...(description !== undefined && { description }),
        ...(serialNumber !== undefined && { serialNumber }),
        ...(status && { status }),
        updatedAt: new Date()
      },
      include: {
        point: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json({ equipment: updatedEquipment }, { status: 200 });

  } catch (error) {
    console.error('Error updating equipment:', error);
    return NextResponse.json({ error: "Failed to update equipment" }, { status: 500 });
  }
}
