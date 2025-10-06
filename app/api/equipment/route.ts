import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserRole } from "@/lib/acl";
import prisma from "@/lib/prisma";

// GET - Получить список оборудования
export async function GET(req: NextRequest) {
  try {
    console.log('🔍 Equipment fetch request received');
    
    const session = await getServerSession(authOptions);
    console.log('📋 Session:', { userId: session?.user?.id, tenantId: session?.user?.tenantId, pointId: session?.user?.pointId });

    if (!session?.user?.id || !session?.user?.tenantId) {
      console.log('❌ No session found');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = await getUserRole(session.user.id, session.user.tenantId);
    const tenantId = session.user.tenantId;
    const pointId = session.user.pointId;
    
    console.log('🎭 User role:', userRole);

    // Проверяем права доступа
    if (userRole !== "Owner" && userRole !== "Partner" && userRole !== "Point") {
      console.log('❌ Insufficient permissions');
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // Определяем фильтры в зависимости от роли
    const whereClause: any = { tenantId };
    
    if (userRole === "Point" && pointId) {
      whereClause.pointId = pointId;
    } else if (userRole === "Partner") {
      // Партнеры видят все свое оборудование (с pointId и без)
      // Если выбрана конкретная точка, показываем только её оборудование
      if (pointId) {
        whereClause.pointId = pointId;
      }
      // Если точка не выбрана, показываем все оборудование партнера
    }
    
    console.log('🔍 Where clause:', whereClause);

    const equipment = await prisma.equipment.findMany({
      where: whereClause,
      include: {
        point: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('📋 Found equipment:', equipment.length, 'items');
    console.log('📋 Equipment details:', equipment);

    return NextResponse.json({ equipment }, { status: 200 });

  } catch (error) {
    console.error('❌ Error fetching equipment:', error);
    return NextResponse.json({ error: "Failed to fetch equipment" }, { status: 500 });
  }
}

// POST - Создать новое оборудование
export async function POST(req: NextRequest) {
  try {
    console.log('🔧 Equipment creation request received');
    
    const session = await getServerSession(authOptions);
    console.log('📋 Session:', { userId: session?.user?.id, tenantId: session?.user?.tenantId, pointId: session?.user?.pointId });

    if (!session?.user?.id || !session?.user?.tenantId) {
      console.log('❌ No session found');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = await getUserRole(session.user.id, session.user.tenantId);
    const tenantId = session.user.tenantId;
    const pointId = session.user.pointId;
    
    console.log('🎭 User role:', userRole);

    // Проверяем права доступа
    if (userRole !== "Owner" && userRole !== "Partner" && userRole !== "Point") {
      console.log('❌ Insufficient permissions');
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await req.json();
    const { type, zone, description, serialNumber } = body;
    
    console.log('📝 Request body:', { type, zone, description, serialNumber });

    if (!type || !zone) {
      console.log('❌ Missing required fields');
      return NextResponse.json({ error: "Type and zone are required" }, { status: 400 });
    }

    const equipmentData = {
      type,
      zone,
      description,
      serialNumber,
      tenantId,
      pointId: (userRole === "Point" || userRole === "Partner") ? pointId : undefined,
      status: "active"
    };
    
    console.log('💾 Creating equipment with data:', equipmentData);

    // Создаем оборудование
    const equipment = await prisma.equipment.create({
      data: equipmentData,
      include: {
        point: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    console.log('✅ Equipment created successfully:', equipment);

    return NextResponse.json({ equipment }, { status: 201 });

  } catch (error) {
    console.error('❌ Error creating equipment:', error);
    return NextResponse.json({ error: "Failed to create equipment" }, { status: 500 });
  }
}
