import { ensureUser } from "@/lib/guards";
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { canAuthor, currentTenantId } from '@/lib/acl';

const updateCourseSchema = z.object({
  title: z.string().min(1, 'Название курса обязательно').optional(),
  description: z.string().optional(),
});

// GET /api/learning/courses/[id] - получение курса
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

    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        ...(session.user.isPlatformOwner 
          ? (tenantId ? { tenantId } : { tenantId: null })
          : { tenantId }
        )
      },
      include: {
        owner: { select: { name: true, email: true } },
        modules: { 
          include: { 
            lessons: { 
              select: { 
                id: true, 
                title: true, 
                type: true,
                content: true,
                order: true 
              },
              orderBy: { order: 'asc' }
            }
          },
          orderBy: { order: 'asc' }
        },
        lessons: { 
          select: { 
            id: true, 
            title: true, 
            order: true, 
            createdAt: true 
          },
          orderBy: { order: 'asc' }
        },
        quizzes: { 
          select: { 
            id: true, 
            title: true, 
            createdAt: true,
            questions: {
              select: {
                id: true,
                text: true,
                kind: true,
                answers: {
                  select: {
                    id: true,
                    text: true,
                    isCorrect: true
                  }
                }
              }
            }
          } 
        },
        assignments: {
          include: {
            progress: {
              where: { userId: session.user.id },
              select: { status: true, lessonsDone: true, score: true }
            }
          }
        },
        _count: {
          select: {
            assignments: true,
            progress: true
          }
        }
      }
    });

    if (!course) {
      return NextResponse.json({ error: 'Курс не найден' }, { status: 404 });
    }

    return NextResponse.json(course);

  } catch (error) {
    console.error('❌ Error fetching course:', error);
    return NextResponse.json({ error: 'Ошибка получения курса' }, { status: 500 });
  }
}

// PUT /api/learning/courses/[id] - обновление курса
export async function PUT(
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
    const existingCourse = await prisma.course.findFirst({
      where: {
        id: courseId,
        ...(session.user.isPlatformOwner 
          ? (tenantId ? { tenantId } : { tenantId: null })
          : { tenantId }
        )
      }
    });

    if (!existingCourse) {
      return NextResponse.json({ error: 'Курс не найден' }, { status: 404 });
    }

    // Проверяем права на редактирование
    if (!canAuthor(session) && existingCourse.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Нет прав для редактирования курса' }, { status: 403 });
    }

    const body = await request.json();
    const updateData = updateCourseSchema.parse(body);

    const course = await prisma.course.update({
      where: { id: courseId },
      data: {
        ...updateData,
        updatedAt: new Date()
      },
      include: {
        owner: { select: { name: true, email: true } },
        lessons: true,
        quizzes: true
      }
    });

    return NextResponse.json(course);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Неверные данные', details: error.issues }, { status: 400 });
    }
    console.error('❌ Error updating course:', error);
    return NextResponse.json({ error: 'Ошибка обновления курса' }, { status: 500 });
  }
}

// DELETE /api/learning/courses/[id] - удаление курса
export async function DELETE(
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

    // Проверяем, что курс существует и пользователь может его удалить
    const existingCourse = await prisma.course.findFirst({
      where: {
        id: courseId,
        ...(session.user.isPlatformOwner 
          ? (tenantId ? { tenantId } : { tenantId: null })
          : { tenantId }
        )
      }
    });

    if (!existingCourse) {
      return NextResponse.json({ error: 'Курс не найден' }, { status: 404 });
    }

    // Проверяем права на удаление
    if (!canAuthor(session) && existingCourse.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Нет прав для удаления курса' }, { status: 403 });
    }

    await prisma.course.delete({
      where: { id: courseId }
    });

    return NextResponse.json({ message: 'Курс удален' });

  } catch (error) {
    console.error('❌ Error deleting course:', error);
    return NextResponse.json({ error: 'Ошибка удаления курса' }, { status: 500 });
  }
}
