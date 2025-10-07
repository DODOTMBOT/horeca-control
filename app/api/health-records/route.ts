import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getUserRole } from "@/lib/acl";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const _userRole = await getUserRole(session.user.id, session.user.tenantId);
    const tenantId = session.user.tenantId;
    const pointId = session.user.pointId;

    if (!tenantId) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    // Получаем записи здоровья для текущей точки
    const healthRecords = await prisma.healthRecord.findMany({
      where: {
        tenantId,
        ...(pointId && { pointId })
      },
      include: {
        point: true
      },
      orderBy: { createdAt: "desc" }
    });

    const formattedRecords = healthRecords.map(record => ({
      id: record.id,
      employeeName: record.employeeName,
      position: record.position,
      date: record.date.toISOString(),
      temperature: record.temperature,
      symptoms: record.symptoms,
      healthStatus: record.healthStatus,
      notes: record.notes,
      responsible: record.responsible,
      pointId: record.pointId,
      pointName: record.point?.name
    }));

    return NextResponse.json(formattedRecords);

  } catch (error) {
    console.error("Error fetching health records:", error);
    return NextResponse.json({ error: "Failed to fetch health records" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const _userRole = await getUserRole(session.user.id, session.user.tenantId);
    const tenantId = session.user.tenantId;
    const pointId = session.user.pointId;

    if (!tenantId) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    // Проверяем права на создание записей
    if (_userRole !== "OWNER" && _userRole !== "PARTNER" && _userRole !== "POINT") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await req.json();
    const { employeeName, position, temperature, symptoms, healthStatus, notes, responsible } = body;

    if (!employeeName || !temperature || !responsible) {
      return NextResponse.json({ error: "Employee name, temperature and responsible are required" }, { status: 400 });
    }

    // Создаем запись здоровья
    const healthRecord = await prisma.healthRecord.create({
      data: {
        employeeName,
        position: position || "Сотрудник",
        date: new Date(),
        temperature: parseFloat(temperature),
        symptoms: symptoms || [],
        healthStatus: healthStatus || "healthy",
        notes: notes || "",
        responsible,
        tenantId,
        pointId: pointId || null
      },
      include: {
        point: true
      }
    });

    const formattedRecord = {
      id: healthRecord.id,
      employeeName: healthRecord.employeeName,
      position: healthRecord.position,
      date: healthRecord.date.toISOString(),
      temperature: healthRecord.temperature,
      symptoms: healthRecord.symptoms,
      healthStatus: healthRecord.healthStatus,
      notes: healthRecord.notes,
      responsible: healthRecord.responsible,
      pointId: healthRecord.pointId,
      pointName: healthRecord.point?.name
    };

    return NextResponse.json(formattedRecord, { status: 201 });

  } catch (error) {
    console.error("Error creating health record:", error);
    return NextResponse.json({ error: "Failed to create health record" }, { status: 500 });
  }
}
