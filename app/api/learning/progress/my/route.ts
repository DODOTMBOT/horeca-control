import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { currentTenantId } from '@/lib/acl';

// GET /api/learning/progress/my - мои курсы и прогресс
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const tenantId = currentTenantId(session);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // фильтр по статусу

    // Получаем назначения пользователя
    const assignments = await prisma.assignment.findMany({
      where: {
        OR: [
          { userId: session.user.id },
          { 
            roleName: { in: [] },
            tenantId: tenantId
          }
        ]
      },
      include: {
        course: {
          include: {
            owner: { select: { name: true, email: true } },
            lessons: { 
              select: { 
                id: true, 
                title: true, 
                order: true 
              },
              orderBy: { order: 'asc' }
            },
            quizzes: { 
              select: { 
                id: true, 
                title: true 
              } 
            }
          }
        },
        progress: {
          where: { userId: session.user.id }
        }
      }
    });

    // Получаем прогресс для каждого курса
    const coursesWithProgress = await Promise.all(
      assignments.map(async (assignment) => {
        let progress = assignment.progress[0];
        
        if (!progress) {
          // Создаем прогресс если его нет
          progress = await prisma.progress.create({
            data: {
              courseId: assignment.courseId,
              userId: session.user.id,
              assignmentId: assignment.id,
              status: 'NOT_STARTED',
              lessonsDone: 0
            }
          });
        }

        // Получаем попытки тестов
        const attempts = await prisma.attempt.findMany({
          where: {
            userId: session.user.id,
            quiz: {
              courseId: assignment.courseId
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 1
        });

        return {
          assignment,
          course: assignment.course,
          progress,
          lastAttempt: attempts[0] || null,
          totalLessons: assignment.course.lessons.length,
          hasQuiz: assignment.course.quizzes.length > 0
        };
      })
    );

    // Фильтруем по статусу если указан
    let filteredCourses = coursesWithProgress;
    if (status) {
      filteredCourses = coursesWithProgress.filter(item => item.progress.status === status);
    }

    // Сортируем по дате обновления прогресса
    filteredCourses.sort((a, b) => 
      new Date(b.progress.updatedAt).getTime() - new Date(a.progress.updatedAt).getTime()
    );

    return NextResponse.json({
      courses: filteredCourses,
      total: filteredCourses.length,
      stats: {
        notStarted: coursesWithProgress.filter(c => c.progress.status === 'NOT_STARTED').length,
        inProgress: coursesWithProgress.filter(c => c.progress.status === 'IN_PROGRESS').length,
        completed: coursesWithProgress.filter(c => c.progress.status === 'DONE').length
      }
    });

  } catch (error) {
    console.error('❌ Error fetching my progress:', error);
    return NextResponse.json({ error: 'Ошибка получения прогресса' }, { status: 500 });
  }
}
