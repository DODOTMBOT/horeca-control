import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { canAuthor, currentTenantId, checkSandboxLimits } from '@/lib/acl';

const createQuizSchema = z.object({
  title: z.string().min(1, 'Название теста обязательно'),
  questions: z.array(z.object({
    text: z.string().min(1, 'Текст вопроса обязателен'),
    kind: z.enum(['single', 'multiple']),
    answers: z.array(z.object({
      text: z.string().min(1, 'Текст ответа обязателен'),
      isCorrect: z.boolean()
    })).min(2, 'Минимум 2 ответа')
  })).min(1, 'Минимум 1 вопрос')
});

// GET /api/learning/courses/[id]/quiz - получение теста курса
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const courseId = params.id;
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

    const quiz = await prisma.quiz.findFirst({
      where: { courseId },
      include: {
        questions: {
          include: {
            answers: true
          },
          orderBy: { id: 'asc' }
        }
      }
    });

    return NextResponse.json(quiz);

  } catch (error) {
    console.error('❌ Error fetching quiz:', error);
    return NextResponse.json({ error: 'Ошибка получения теста' }, { status: 500 });
  }
}

// POST /api/learning/courses/[id]/quiz - создание теста
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const courseId = params.id;
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

    // Проверяем лимиты песочницы для квизов
    const limitCheck = await checkSandboxLimits(session, 'quiz');
    if (!limitCheck.allowed) {
      return NextResponse.json({ error: limitCheck.message }, { status: 403 });
    }

    // Проверяем, что в курсе еще нет теста
    const existingQuiz = await prisma.quiz.findFirst({
      where: { courseId }
    });

    if (existingQuiz) {
      return NextResponse.json({ error: 'В курсе уже есть тест' }, { status: 400 });
    }

    const body = await request.json();
    const { title, questions } = createQuizSchema.parse(body);

    // Создаем тест с вопросами и ответами в транзакции
    const quiz = await prisma.$transaction(async (tx) => {
      const newQuiz = await tx.quiz.create({
        data: {
          title,
          courseId
        }
      });

      for (const questionData of questions) {
        const question = await tx.quizQuestion.create({
          data: {
            text: questionData.text,
            kind: questionData.kind,
            quizId: newQuiz.id
          }
        });

        for (const answerData of questionData.answers) {
          await tx.quizAnswer.create({
            data: {
              text: answerData.text,
              isCorrect: answerData.isCorrect,
              questionId: question.id
            }
          });
        }
      }

      return tx.quiz.findUnique({
        where: { id: newQuiz.id },
        include: {
          questions: {
            include: {
              answers: true
            }
          }
        }
      });
    });

    return NextResponse.json(quiz, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Неверные данные', details: error.errors }, { status: 400 });
    }
    console.error('❌ Error creating quiz:', error);
    return NextResponse.json({ error: 'Ошибка создания теста' }, { status: 500 });
  }
}
