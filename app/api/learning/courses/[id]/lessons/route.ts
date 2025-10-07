import { ensureUser } from "@/lib/guards";
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { canAuthor, currentTenantId, checkSandboxLimits } from '@/lib/acl';

const createLessonSchema = z.object({
  title: z.string().min(1, 'Название урока обязательно'),
  content: z.any().optional(), // JSON content
  order: z.number().int().min(0).optional(),
});

// GET /api/learning/courses/[id]/lessons - список уроков курса
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
  ensureUser(session);
    if (!session.user?.id) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { id: courseId } = await params;
    const tenantId = currentTenantId(session);

    // Проверяем, что курс существует и доступен
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        ...(session.user.isPlatformOwner 
          ? (tenantId ? { tenantId } : { tenantId: null })
          : { tenantId }
        )
      }
    });

    if (!course) {
      return NextResponse.json({ error: 'Курс не найден' }, { status: 404 });
    }

    const lessons = await prisma.lesson.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        title: true,
        content: true,
        order: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return NextResponse.json(lessons);

  } catch (error) {
    console.error('❌ Error fetching lessons:', error);
    return NextResponse.json({ error: 'Ошибка получения уроков' }, { status: 500 });
  }
}

// POST /api/learning/courses/[id]/lessons - создание урока
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
  ensureUser(session);
    if (!session.user?.id) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { id: courseId } = await params;
    const tenantId = currentTenantId(session);

    // Проверяем, что курс существует и пользователь может его редактировать
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        ...(session.user.isPlatformOwner 
          ? (tenantId ? { tenantId } : { tenantId: null })
          : { tenantId }
        )
      }
    });

    if (!course) {
      return NextResponse.json({ error: 'Курс не найден' }, { status: 404 });
    }

    // Проверяем права на редактирование
    if (!canAuthor(session) && course.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Нет прав для редактирования курса' }, { status: 403 });
    }

    // Проверяем лимиты песочницы для уроков
    const limitCheck = await checkSandboxLimits(session, 'lesson');
    if (!limitCheck.allowed) {
      return NextResponse.json({ error: limitCheck.message }, { status: 403 });
    }

    // Дополнительная проверка лимита уроков в курсе для песочницы
    if (!session.user.tenantId) {
      const lessonCount = await prisma.lesson.count({ where: { courseId } });
      if (lessonCount >= 3) {
        return NextResponse.json({ error: 'В песочнице можно создать только 3 урока в курсе' }, { status: 403 });
      }
    }

    const body = await request.json();
    const { title, content, order } = createLessonSchema.parse(body);

    // Если order не указан, ставим в конец
    let lessonOrder = order;
    if (lessonOrder === undefined) {
      const lastLesson = await prisma.lesson.findFirst({
        where: { courseId },
        orderBy: { order: 'desc' }
      });
      lessonOrder = (lastLesson?.order || 0) + 1;
    }

    const lesson = await prisma.lesson.create({
      data: {
        title,
        content,
        order: lessonOrder,
        courseId
      }
    });

    return NextResponse.json(lesson, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Неверные данные', details: error.issues }, { status: 400 });
    }
    console.error('❌ Error creating lesson:', error);
    return NextResponse.json({ error: 'Ошибка создания урока' }, { status: 500 });
  }
}
