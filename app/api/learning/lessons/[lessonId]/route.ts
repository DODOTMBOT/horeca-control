import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { canAuthor, currentTenantId } from '@/lib/acl';

const updateLessonSchema = z.object({
  title: z.string().min(1, 'Название урока обязательно').optional(),
  content: z.any().optional(),
  order: z.number().int().min(0).optional(),
});

// GET /api/learning/lessons/[lessonId] - получение урока
export async function GET(
  request: NextRequest,
  { params }: { params: { lessonId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const lessonId = params.lessonId;
    const tenantId = currentTenantId(session);

    const lesson = await prisma.lesson.findFirst({
      where: {
        id: lessonId,
        course: {
          ...(session.user.isPlatformOwner 
            ? (tenantId ? { tenantId } : { tenantId: null })
            : { tenantId }
          )
        }
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            ownerId: true,
            tenantId: true
          }
        }
      }
    });

    if (!lesson) {
      return NextResponse.json({ error: 'Урок не найден' }, { status: 404 });
    }

    return NextResponse.json(lesson);

  } catch (error) {
    console.error('❌ Error fetching lesson:', error);
    return NextResponse.json({ error: 'Ошибка получения урока' }, { status: 500 });
  }
}

// PUT /api/learning/lessons/[lessonId] - обновление урока
export async function PUT(
  request: NextRequest,
  { params }: { params: { lessonId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const lessonId = params.lessonId;
    const tenantId = currentTenantId(session);

    // Проверяем, что урок существует и пользователь может его редактировать
    const existingLesson = await prisma.lesson.findFirst({
      where: {
        id: lessonId,
        course: {
          ...(session.user.isPlatformOwner 
            ? (tenantId ? { tenantId } : { tenantId: null })
            : { tenantId }
          )
        }
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            ownerId: true
          }
        }
      }
    });

    if (!existingLesson) {
      return NextResponse.json({ error: 'Урок не найден' }, { status: 404 });
    }

    // Проверяем права на редактирование
    if (!canAuthor(session) && existingLesson.course.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Нет прав для редактирования урока' }, { status: 403 });
    }

    const body = await request.json();
    const updateData = updateLessonSchema.parse(body);

    const lesson = await prisma.lesson.update({
      where: { id: lessonId },
      data: {
        ...updateData,
        updatedAt: new Date()
      }
    });

    return NextResponse.json(lesson);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Неверные данные', details: error.errors }, { status: 400 });
    }
    console.error('❌ Error updating lesson:', error);
    return NextResponse.json({ error: 'Ошибка обновления урока' }, { status: 500 });
  }
}

// DELETE /api/learning/lessons/[lessonId] - удаление урока
export async function DELETE(
  request: NextRequest,
  { params }: { params: { lessonId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const lessonId = params.lessonId;
    const tenantId = currentTenantId(session);

    // Проверяем, что урок существует и пользователь может его удалить
    const existingLesson = await prisma.lesson.findFirst({
      where: {
        id: lessonId,
        course: {
          ...(session.user.isPlatformOwner 
            ? (tenantId ? { tenantId } : { tenantId: null })
            : { tenantId }
          )
        }
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            ownerId: true
          }
        }
      }
    });

    if (!existingLesson) {
      return NextResponse.json({ error: 'Урок не найден' }, { status: 404 });
    }

    // Проверяем права на удаление
    if (!canAuthor(session) && existingLesson.course.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Нет прав для удаления урока' }, { status: 403 });
    }

    await prisma.lesson.delete({
      where: { id: lessonId }
    });

    return NextResponse.json({ message: 'Урок удален' });

  } catch (error) {
    console.error('❌ Error deleting lesson:', error);
    return NextResponse.json({ error: 'Ошибка удаления урока' }, { status: 500 });
  }
}
