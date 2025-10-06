import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { currentTenantId } from '@/lib/acl';

const submitQuizSchema = z.object({
  answers: z.record(z.string(), z.array(z.string())) // {questionId: [answerId]}
});

// POST /api/learning/quiz/[quizId]/attempt - прохождение теста
export async function POST(
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
          }
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
        courseId: quiz.courseId,
        OR: [
          { userId: session.user.id },
          { 
            roleName: { in: session.user.roles || [] },
            tenantId: tenantId
          }
        ]
      }
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Курс не назначен вам' }, { status: 403 });
    }

    const body = await request.json();
    const { answers } = submitQuizSchema.parse(body);

    // Вычисляем результат
    let correctAnswers = 0;
    const totalQuestions = quiz.questions.length;
    const questionResults: Array<{
      questionId: string;
      questionText: string;
      userAnswers: string[];
      correctAnswers: string[];
      isCorrect: boolean;
    }> = [];

    for (const question of quiz.questions) {
      const userAnswerIds = answers[question.id] || [];
      const correctAnswerIds = question.answers
        .filter(answer => answer.isCorrect)
        .map(answer => answer.id);

      const isCorrect = question.kind === 'single' 
        ? userAnswerIds.length === 1 && correctAnswerIds.includes(userAnswerIds[0])
        : userAnswerIds.length === correctAnswerIds.length && 
          userAnswerIds.every(id => correctAnswerIds.includes(id));

      if (isCorrect) {
        correctAnswers++;
      }

      questionResults.push({
        questionId: question.id,
        questionText: question.text,
        userAnswers: userAnswerIds,
        correctAnswers: correctAnswerIds,
        isCorrect
      });
    }

    const score = Math.round((correctAnswers / totalQuestions) * 100);

    // Сохраняем попытку и обновляем прогресс в транзакции
    const result = await prisma.$transaction(async (tx) => {
      // Создаем попытку
      const attempt = await tx.attempt.create({
        data: {
          quizId,
          userId: session.user.id,
          answers,
          score
        }
      });

      // Обновляем прогресс
      const progress = await tx.progress.findUnique({
        where: {
          courseId_userId: {
            courseId: quiz.courseId,
            userId: session.user.id
          }
        }
      });

      if (progress) {
        await tx.progress.update({
          where: { id: progress.id },
          data: {
            score: Math.max(progress.score || 0, score),
            updatedAt: new Date()
          }
        });
      }

      return { attempt, score };
    });

    return NextResponse.json({
      message: 'Тест завершен',
      score,
      correctAnswers,
      totalQuestions,
      questionResults,
      attemptId: result.attempt.id
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Неверные данные', details: error.errors }, { status: 400 });
    }
    console.error('❌ Error submitting quiz:', error);
    return NextResponse.json({ error: 'Ошибка прохождения теста' }, { status: 500 });
  }
}
