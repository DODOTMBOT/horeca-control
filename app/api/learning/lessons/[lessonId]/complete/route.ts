import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { currentTenantId } from '@/lib/acl';

// POST /api/learning/lessons/[lessonId]/complete - отметка урока как пройденного
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { lessonId } = await params;
    const tenantId = currentTenantId(session);

    // Проверяем, что урок существует и доступен
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
            tenantId: true
          }
        }
      }
    });

    if (!lesson) {
      return NextResponse.json({ error: 'Урок не найден' }, { status: 404 });
    }

    // Проверяем, что курс назначен пользователю
    const assignment = await prisma.assignment.findFirst({
      where: {
        courseId: lesson.courseId || undefined,
        OR: [
          { userId: session.user.id },
          { 
            roleName: { in: [] },
            tenantId: tenantId
          }
        ]
      }
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Курс не назначен вам' }, { status: 403 });
    }

    // Получаем или создаем прогресс
    let progress = await prisma.progress.findUnique({
      where: {
        courseId_userId: {
          courseId: lesson.courseId!,
          userId: session.user.id
        }
      }
    });

    if (!progress) {
      progress = await prisma.progress.create({
        data: {
          courseId: lesson.courseId!,
          userId: session.user.id,
          assignmentId: assignment.id,
          status: 'IN_PROGRESS',
          lessonsDone: 0
        }
      });
    }

    // Проверяем, не пройден ли уже этот урок
    const completedLessons = await prisma.lesson.findMany({
      where: {
        courseId: lesson.courseId,
        order: { lte: lesson.order }
      },
      orderBy: { order: 'asc' }
    });

    const totalLessons = await prisma.lesson.count({
      where: { courseId: lesson.courseId }
    });

    const newLessonsDone = Math.max(progress.lessonsDone, completedLessons.length);
    const isCompleted = newLessonsDone >= totalLessons;

    // Обновляем прогресс
    const updatedProgress = await prisma.progress.update({
      where: { id: progress.id },
      data: {
        lessonsDone: newLessonsDone,
        status: isCompleted ? 'DONE' : 'IN_PROGRESS',
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      message: 'Урок отмечен как пройденный',
      progress: updatedProgress,
      isCourseCompleted: isCompleted
    });

  } catch (error) {
    console.error('❌ Error completing lesson:', error);
    return NextResponse.json({ error: 'Ошибка завершения урока' }, { status: 500 });
  }
}
