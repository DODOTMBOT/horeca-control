import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getUserRole } from "@/lib/acl";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = await getUserRole(session.user.id, session.user.tenantId);
    const tenantId = session.user.tenantId;
    const pointId = session.user.pointId;

    if (!tenantId) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    // Получаем параметры запроса
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const employeeId = searchParams.get('employeeId');

    const whereClause: any = { tenantId };

    // Фильтр по точке
    if (pointId) {
      whereClause.pointId = pointId;
    }

    // Фильтр по дате
    if (date) {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
      const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1);
      
      whereClause.date = {
        gte: startOfDay,
        lt: endOfDay
      };
    }

    // Фильтр по сотруднику
    if (employeeId) {
      whereClause.employeeId = employeeId;
    }

    const employeeStatuses = await prisma.employeeStatus.findMany({
      where: whereClause,
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        point: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [
        { date: 'desc' },
        { employee: { name: 'asc' } }
      ]
    });

    const formattedStatuses = employeeStatuses.map(status => ({
      id: status.id,
      employeeId: status.employeeId,
      employeeName: status.employee.name || "Без имени",
      employeeEmail: status.employee.email,
      date: status.date.toISOString(),
      status: status.status,
      notes: status.notes,
      updatedBy: status.updatedBy,
      pointId: status.pointId,
      pointName: status.point?.name
    }));

    return NextResponse.json(formattedStatuses);

  } catch (error) {
    console.error("Error fetching employee statuses:", error);
    return NextResponse.json({ error: "Failed to fetch employee statuses" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('🔧 Employee status update request received');
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      console.log('❌ No session found');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log('✅ Session found:', { userId: session.user.id, tenantId: session.user.tenantId, pointId: session.user.pointId });

    const userRole = await getUserRole(session.user.id, session.user.tenantId);
    const tenantId = session.user.tenantId;
    const pointId = session.user.pointId;

    console.log('🎭 User role determined:', userRole);

    if (!tenantId) {
      console.log('❌ No tenant found');
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    // Проверяем права на обновление статусов
    if (!userRole || !["OWNER","PARTNER","POINT"].includes(userRole)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await req.json();
    const { employeeId, date, status, notes } = body;

    console.log('📝 Request body:', { employeeId, date, status, notes });

    if (!employeeId || !date || !status) {
      console.log('❌ Missing required fields');
      return NextResponse.json({ error: "Employee ID, date and status are required" }, { status: 400 });
    }

    // Проверяем, что статус валидный
    const validStatuses = ['healthy', 'sick', 'vacation', 'dayoff'];
    if (!validStatuses.includes(status)) {
      console.log('❌ Invalid status:', status);
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Проверяем, что сотрудник существует и принадлежит к текущей точке
    console.log('🔍 Looking for employee:', { employeeId, tenantId, pointId });
    const employee = await prisma.user.findFirst({
      where: {
        id: employeeId,
        tenantId,
        ...(pointId && { pointId })
      }
    });

    if (!employee) {
      console.log('❌ Employee not found or access denied');
      return NextResponse.json({ error: "Employee not found or access denied" }, { status: 404 });
    }

    console.log('✅ Employee found:', { id: employee.id, name: employee.name });

    // Создаем или обновляем статус сотрудника
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());

    console.log('📅 Target date:', { date, targetDate, startOfDay });

    const employeeStatus = await prisma.employeeStatus.upsert({
      where: {
        employeeId_date: {
          employeeId,
          date: startOfDay
        }
      },
      update: {
        status,
        notes: notes || null,
        updatedBy: session.user.name || session.user.email || "Unknown"
      },
      create: {
        employeeId,
        date: startOfDay,
        status,
        notes: notes || null,
        updatedBy: session.user.name || session.user.email || "Unknown",
        tenantId,
        pointId: pointId || null
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        point: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    console.log('✅ Employee status updated successfully:', { id: employeeStatus.id, status: employeeStatus.status });

    const formattedStatus = {
      id: employeeStatus.id,
      employeeId: employeeStatus.employeeId,
      employeeName: employeeStatus.employee.name || "Без имени",
      employeeEmail: employeeStatus.employee.email,
      date: employeeStatus.date.toISOString(),
      status: employeeStatus.status,
      notes: employeeStatus.notes,
      updatedBy: employeeStatus.updatedBy,
      pointId: employeeStatus.pointId,
      pointName: employeeStatus.point?.name
    };

    return NextResponse.json(formattedStatus, { status: 201 });

  } catch (error) {
    console.error("Error updating employee status:", error);
    return NextResponse.json({ error: "Failed to update employee status" }, { status: 500 });
  }
}
