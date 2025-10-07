import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { currentTenantId } from '@/lib/acl';

// GET /api/learning/quiz/[quizId] - получение теста
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { quizId } = await params;
    const tenantId = currentTenantId(session);

    // Проверяем, что тест существует и доступен
    const quiz = await prisma.quiz.findFirst({
      where: {
        id: quizId,
        course: {
          ...(session.user.isPlatformOwner 
            ? (tenantId ? { tenantId } : { tenantId: null })
            : { tenantId }
          )
        }
      },
      include: {
        questions: {
          include: {
            answers: true
          },
          orderBy: { id: 'asc' }
        },
        course: {
          select: {
            id: true,
            title: true,
            tenantId: true
          }
        }
      }
    });

    if (!quiz) {
      return NextResponse.json({ error: 'Тест не найден' }, { status: 404 });
    }

    // Проверяем, что курс назначен пользователю
    const assignment = await prisma.assignment.findFirst({
      where: {
        courseId: quiz.courseId ?? "",
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

    return NextResponse.json(quiz);

  } catch (error) {
    console.error('❌ Error fetching quiz:', error);
    return NextResponse.json({ error: 'Ошибка получения теста' }, { status: 500 });
  }
}
