import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserRole } from '@/lib/acl';
import prisma from '@/lib/prisma';

// GET - Получить температурные записи
export async function GET(req: NextRequest) {
  try {
    console.log('🌡️ Temperature records fetch request received');
    
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

    // Получаем параметры запроса
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const equipmentId = searchParams.get('equipmentId');

    // Определяем фильтры в зависимости от роли
    const whereClause: any = { tenantId };
    
    if (userRole === "Point" && pointId) {
      whereClause.pointId = pointId;
    } else if (userRole === "Partner") {
      if (pointId) {
        whereClause.pointId = pointId;
      }
    }

    // Добавляем фильтры по дате и оборудованию
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      whereClause.date = {
        gte: startDate,
        lt: endDate
      };
    }

    if (equipmentId) {
      whereClause.equipmentId = equipmentId;
    }
    
    console.log('🔍 Where clause:', whereClause);

    const temperatureRecords = await prisma.temperatureRecord.findMany({
      where: whereClause,
      include: {
        equipment: {
          select: {
            id: true,
            type: true,
            zone: true,
            status: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('📋 Found temperature records:', temperatureRecords.length, 'items');

    return NextResponse.json({ temperatureRecords }, { status: 200 });

  } catch (error) {
    console.error('❌ Error fetching temperature records:', error);
    return NextResponse.json({ error: "Failed to fetch temperature records" }, { status: 500 });
  }
}

// POST - Создать новую температурную запись
export async function POST(req: NextRequest) {
  try {
    console.log('🌡️ Temperature record creation request received');
    
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
    const { equipmentId, temperature, date, time, notes, period } = body;
    
    console.log('📝 Request body:', { equipmentId, temperature, date, time, notes, period });

    if (!equipmentId || temperature === undefined || !date) {
      console.log('❌ Missing required fields');
      return NextResponse.json({ error: "Equipment ID, temperature and date are required" }, { status: 400 });
    }

    // Проверяем, что оборудование принадлежит пользователю
    const equipment = await prisma.equipment.findFirst({
      where: {
        id: equipmentId,
        tenantId: tenantId,
        ...(userRole === "Point" && pointId ? { pointId } : {}),
        ...(userRole === "Partner" && pointId ? { pointId } : {})
      }
    });

    if (!equipment) {
      console.log('❌ Equipment not found or access denied');
      return NextResponse.json({ error: "Equipment not found or access denied" }, { status: 404 });
    }

    const recordData = {
      equipmentId,
      temperature: parseFloat(temperature),
      date: new Date(date),
      time: period === 'morning' ? '08:00' : period === 'evening' ? '20:00' : time,
      period: period || 'morning', // По умолчанию утро
      notes,
      recordedBy: session.user.name || session.user.email || 'Unknown',
      tenantId,
      pointId: (userRole === "Point" || userRole === "Partner") ? pointId : undefined
    };
    
    console.log('💾 Upserting temperature record with data:', recordData);

    // Сначала ищем существующую запись
    const existingRecord = await prisma.temperatureRecord.findFirst({
      where: {
        equipmentId,
        date: new Date(date),
        period: period || 'morning'
      }
    });

    let temperatureRecord;
    if (existingRecord) {
      // Обновляем существующую запись
      temperatureRecord = await prisma.temperatureRecord.update({
        where: { id: existingRecord.id },
        data: {
          temperature: parseFloat(temperature),
          time: period === 'morning' ? '08:00' : period === 'evening' ? '20:00' : time,
          notes,
          recordedBy: session.user.name || session.user.email || 'Unknown',
          updatedAt: new Date()
        },
        include: {
          equipment: {
            select: {
              id: true,
              type: true,
              zone: true,
              status: true
            }
          }
        }
      });
    } else {
      // Создаем новую запись
      temperatureRecord = await prisma.temperatureRecord.create({
        data: recordData,
        include: {
          equipment: {
            select: {
              id: true,
              type: true,
              zone: true,
              status: true
            }
          }
        }
      });
    }

    console.log('✅ Temperature record upserted successfully:', temperatureRecord);

    return NextResponse.json({ temperatureRecord }, { status: 201 });

  } catch (error) {
    console.error('❌ Error creating temperature record:', error);
    return NextResponse.json({ error: "Failed to create temperature record" }, { status: 500 });
  }
}
