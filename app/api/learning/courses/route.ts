import { ensureUser } from "@/lib/guards";
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { canAuthor, currentTenantId, checkSandboxLimits } from '@/lib/acl';

const createCourseSchema = z.object({
  title: z.string().min(1, 'Название курса обязательно'),
  description: z.string().optional(),
});

// GET /api/learning/courses - список курсов
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
  ensureUser(session);
    if (!session.user?.id) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const tenantId = currentTenantId(session);
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Для PLATFORM_OWNER показываем все курсы, для остальных - только своего tenant
    const whereClause = session.user.isPlatformOwner 
      ? (tenantId ? { tenantId } : { tenantId: null })
      : { tenantId };

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where: whereClause,
        include: {
          owner: { select: { name: true, email: true } },
          lessons: { select: { id: true, title: true, order: true } },
          quizzes: { select: { id: true, title: true } },
          _count: {
            select: {
              assignments: true,
              progress: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.course.count({ where: whereClause })
    ]);

    return NextResponse.json({
      courses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('❌ Error fetching courses:', error);
    return NextResponse.json({ error: 'Ошибка получения курсов' }, { status: 500 });
  }
}

// POST /api/learning/courses - создание курса
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
  ensureUser(session);
    if (!session.user?.id) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    if (!canAuthor(session)) {
      return NextResponse.json({ error: 'Нет прав для создания курсов' }, { status: 403 });
    }

    // Проверяем лимиты песочницы
    const limitCheck = await checkSandboxLimits(session, 'course');
    if (!limitCheck.allowed) {
      return NextResponse.json({ error: limitCheck.message }, { status: 403 });
    }

    const body = await request.json();
    const { title, description } = createCourseSchema.parse(body);

    const tenantId = currentTenantId(session);

    const course = await prisma.course.create({
      data: {
        title,
        description,
        ownerId: session.user.id,
        tenantId
      },
      include: {
        owner: { select: { name: true, email: true } },
        lessons: true,
        quizzes: true
      }
    });

    return NextResponse.json(course, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Неверные данные', details: error.issues }, { status: 400 });
    }
    console.error('❌ Error creating course:', error);
    return NextResponse.json({ error: 'Ошибка создания курса' }, { status: 500 });
  }
}
