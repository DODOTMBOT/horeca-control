import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import * as XLSX from 'xlsx';
import { getUserRole } from '@/lib/acl';

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

    // Определяем фильтры в зависимости от роли
    const whereClause: any = { tenantId };

    if (userRole === "POINT" && pointId) {
      whereClause.pointId = pointId;
    } else if (userRole === "PARTNER") {
      if (pointId) {
        whereClause.pointId = pointId;
      } else {
        return NextResponse.json({ error: "Partner must select a point to export data" }, { status: 400 });
      }
    }

    // Добавляем фильтр по дате
    whereClause.date = {
      gte: new Date(startDate),
      lte: new Date(endDate)
    };

    // Получаем температурные записи
    const temperatureRecords = await prisma.temperatureRecord.findMany({
      where: whereClause,
      include: {
        equipment: {
          select: {
            type: true,
            zone: true
          }
        }
      },
      orderBy: {
        date: 'asc'
      }
    });

    // Подготавливаем данные для Excel
    const header = [
      '№ п/п',
      'Дата',
      'Время',
      'Оборудование',
      'Зона',
      'Температура (°C)',
      'Заметки',
      'Записал'
    ];

    const data = temperatureRecords.map((record, index) => [
      index + 1,
      record.date.toLocaleDateString('ru-RU'),
      record.time || '-',
      record.equipment.type,
      record.equipment.zone,
      record.temperature,
      record.notes || '-',
      record.recordedBy || '-'
    ]);

    const ws = XLSX.utils.aoa_to_sheet([header, ...data]);

    // Устанавливаем ширину колонок
    const wscols = [
      { wch: 5 },  // № п/п
      { wch: 12 }, // Дата
      { wch: 8 },  // Время
      { wch: 20 }, // Оборудование
      { wch: 15 }, // Зона
      { wch: 12 }, // Температура
      { wch: 30 }, // Заметки
      { wch: 15 }  // Записал
    ];
    ws['!cols'] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Журнал температур');

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

    // Возвращаем файл
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="temperature_journal_${startDate}_to_${endDate}.xlsx"`,
      },
    });

  } catch (error) {
    console.error('Error generating temperature Excel file:', error);
    return NextResponse.json({ error: "Failed to generate Excel file" }, { status: 500 });
  }
}
