import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getUserRole } from "@/lib/acl";
import * as XLSX from 'xlsx';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { startDate, endDate } = await req.json();
    const tenantId = session.user.tenantId;
    const pointId = session.user.pointId;

    if (!startDate || !endDate) {
      return NextResponse.json({ error: "Start date and end date are required" }, { status: 400 });
    }

    const userRole = await getUserRole(session.user.id, tenantId);

    // Проверяем права доступа
    if (userRole !== "Owner" && userRole !== "Partner" && userRole !== "Point") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // Получаем сотрудников
    const whereClause: any = { tenantId };
    if (userRole === "Point" && pointId) {
      whereClause.pointId = pointId;
    } else if (userRole === "Partner" && pointId) {
      whereClause.pointId = pointId;
    }

    const employees = await prisma.user.findMany({
      where: {
        ...whereClause,
        UserRole: {
          some: {
            role: {
              name: {
                in: ["Point", "Employee"]
              }
            }
          }
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        pointId: true,
        point: { select: { name: true } },
        UserRole: {
          select: {
        id: true,
        userId: true,
        roleId: true,
        tenantId: true,
        role: {
          select: {
            id: true,
            name: true
          }
        }
      }
        }
      },
      orderBy: { name: "asc" }
    });

    // Получаем статусы сотрудников за период
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const employeeStatuses = await prisma.employeeStatus.findMany({
      where: {
        employeeId: { in: employees.map(emp => emp.id) },
        date: {
          gte: start,
          lte: end
        },
        tenantId,
        ...(pointId && { pointId })
      },
      select: {
        employeeId: true,
        date: true,
        status: true,
        notes: true,
        updatedBy: true,
        updatedAt: true,
      },
      orderBy: [
        { employeeId: 'asc' },
        { date: 'asc' }
      ]
    });

    // Создаем массив дат для периода
    const dates = [];
    const currentDate = new Date(start);
    while (currentDate <= end) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Создаем данные для Excel
    const excelData = [];

    // Заголовки
    const headers = ['№ п/п', 'Ф.И.О. работника', 'Должность', 'Отдел'];
    dates.forEach(date => {
      headers.push(date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }));
    });
    excelData.push(headers);

    // Данные сотрудников
    employees.forEach((employee, index) => {
      const row = [
        index + 1,
        employee.name || 'Без имени',
        employee.UserRole[0]?.role?.name === "Point" ? "Сотрудник точки" : "Сотрудник",
        employee.point?.name || "Не назначен"
      ];

      // Добавляем статусы для каждой даты
      dates.forEach(date => {
        const status = employeeStatuses.find(s => 
          s.employeeId === employee.id && 
          s.date.toDateString() === date.toDateString()
        );
        
        if (status) {
          switch (status.status) {
            case 'healthy':
              row.push('зд.');
              break;
            case 'sick':
              row.push('б/л');
              break;
            case 'vacation':
              row.push('отп.');
              break;
            case 'dayoff':
              row.push('В');
              break;
            default:
              row.push('');
          }
        } else {
          row.push('');
        }
      });

      excelData.push(row);
    });

    // Создаем Excel файл
    const worksheet = XLSX.utils.aoa_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Журнал здоровья');

    // Настройка ширины колонок
    const colWidths = [
      { wch: 8 },  // № п/п
      { wch: 25 }, // Ф.И.О.
      { wch: 15 }, // Должность
      { wch: 15 }, // Отдел
    ];
    
    // Добавляем ширину для колонок дат
    dates.forEach(() => {
      colWidths.push({ wch: 8 });
    });
    
    worksheet['!cols'] = colWidths;

    // Генерируем буфер
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    // Возвращаем файл
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="journal_${startDate}_to_${endDate}.xlsx"`,
      },
    });

  } catch (error) {
    console.error('Error generating Excel file:', error);
    return NextResponse.json({ error: "Failed to generate Excel file" }, { status: 500 });
  }
}
