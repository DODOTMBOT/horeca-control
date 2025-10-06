"use server";
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getUserContext } from '@/lib/tenant';
import { step1Schema, step2Schema, validateChoiceQuestions, Step1Input, Step2Input, submitAnswersSchema, courseCreateSchema, CourseCreateInput } from '@/lib/validators/learning';

function assertTenant(session: any) {
  if (!session?.user?.id) throw new Error('Not authenticated');
  const tenantId = (session.user as any).tenantId;
  if (!tenantId) throw new Error('No tenantId in session');
  return tenantId as string;
}

function canCreate(session: any) {
  const role = (session?.user as any)?.role;
  return role === 'Owner' || role === 'OWNER' || role === 'MANAGER' || role === 'Partner';
}

export async function createCourseStep2(payload: { step1: Step1Input; step2: Step2Input }) {
  const { userId, tenantId, role } = await getUserContext();
  if (!(role === 'OWNER' || role === 'MANAGER')) throw new Error('Forbidden');

  const step1 = step1Schema.parse(payload.step1);
  const step2 = step2Schema.parse(payload.step2);
  if (step1.questionType === 'CHOICE') validateChoiceQuestions(step2.questions);

  const created = await prisma.$transaction(async (tx) => {
    const course = await tx.course.create({
      data: {
        tenantId,
        title: step1.title,
        description: step1.description,
        coverUrl: step1.coverUrl,
        isPublished: true,
        ownerId: userId,
        createdById: userId,
        accessRoles: step1.accessRoles as any,
        questionType: step1.questionType as any,
        deadlineAt: step1.deadlineAt ? new Date(step1.deadlineAt) : null,
      },
    });

    let index = 0;
    for (const q of step2.questions) {
      const cq = await tx.courseQuestion.create({
        data: {
          courseId: course.id,
          order: index++,
          text: q.text,
          type: step1.questionType as any,
        },
      });
      if (step1.questionType === 'CHOICE') {
        for (const opt of q.options || []) {
          await tx.answerOption.create({
            data: {
              questionId: cq.id,
              text: opt.text,
              isCorrect: !!opt.isCorrect,
            },
          });
        }
      }
    }
    return course;
  });

  revalidatePath('/learning');
  return created;
}

export async function enroll(courseId: string) {
  const { userId, tenantId } = await getUserContext();
  const course = await prisma.course.findFirst({ where: { id: courseId, tenantId } });
  if (!course) throw new Error('Course not found');
  const enrollment = await prisma.enrollment.upsert({
    where: { userId_courseId: { userId, courseId } },
    update: {},
    create: { userId, courseId, tenantId },
  });
  revalidatePath('/learning');
  return enrollment;
}

// Deprecated legacy lesson flow kept for compatibility
export async function setLessonCompletedAction(lessonId: string, completed: boolean) {
  const { userId } = await getUserContext();
  const progress = await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    update: { completed },
    create: { userId, lessonId, completed },
  });
  return progress;
}

export async function submitAttempt(courseId: string, rawAnswers: Record<string, string | string[]>) {
  const { userId, tenantId } = await getUserContext();
  const course = await prisma.course.findFirst({ where: { id: courseId, tenantId }, include: { questions: { include: { options: true } } } });
  if (!course) throw new Error('Course not found');

  let scorePct: number | null = null;
  if (course.questionType === 'CHOICE') {
    const total = course.questions.length;
    let correct = 0;
    for (const q of course.questions) {
      const provided = rawAnswers[q.id];
      const correctIds = q.options.filter(o => o.isCorrect).map(o => o.id).sort();
      const providedIds = Array.isArray(provided) ? provided.slice().sort() : [String(provided || '')].filter(Boolean).sort();
      if (JSON.stringify(correctIds) === JSON.stringify(providedIds)) correct += 1;
    }
    scorePct = Math.round((correct / Math.max(total, 1)) * 100);
  }

  const attempt = await prisma.$transaction(async (tx) => {
    const att = await tx.courseAttempt.create({
      data: { tenantId, courseId, userId, scorePct: scorePct ?? null },
    });
    for (const q of course.questions) {
      const provided = rawAnswers[q.id];
      if (course.questionType === 'CHOICE') {
        const id = Array.isArray(provided) ? provided[0] : (provided as string | undefined);
        await tx.response.create({ data: { attemptId: att.id, questionId: q.id, answerOptionId: id || null } });
      } else {
        const text = Array.isArray(provided) ? provided[0] : (provided as string | undefined);
        await tx.response.create({ data: { attemptId: att.id, questionId: q.id, freeText: text || null } });
      }
    }
    return att;
  });

  revalidatePath(`/learning/${courseId}`);
  return attempt;
}

export async function createCourseAction(data: Record<string, FormDataEntryValue>) {
  const { userId, tenantId, role } = await getUserContext();
  if (!(role === 'OWNER' || role === 'MANAGER')) throw new Error('Forbidden');

  // Преобразуем FormData в правильный формат
  const courseData: CourseCreateInput = {
    title: String(data.title || ''),
    description: data.description ? String(data.description) : undefined,
    category: data.category ? String(data.category) : undefined,
    level: data.level ? String(data.level) as any : undefined,
    durationMin: data.durationMin ? Number(data.durationMin) : undefined,
    coverUrl: data.coverUrl ? String(data.coverUrl) : undefined,
    isPublished: data.isPublished === 'true' || data.isPublished === 'on',
    visibility: data.visibility === 'ALL' ? 'ALL' : (data.visibility ? JSON.parse(String(data.visibility)) : 'ALL'),
    dueDate: data.dueDate ? String(data.dueDate) : undefined,
    defaultQuestionMode: (data.defaultQuestionMode as any) || 'CHOICE',
    modules: [], // Пока оставляем пустым, модули можно добавить позже
  };

  // Валидируем данные
  const validatedData = courseCreateSchema.parse(courseData);

  const course = await prisma.course.create({
    data: {
      tenantId,
      title: validatedData.title,
      description: validatedData.description,
      coverUrl: validatedData.coverUrl,
      isPublished: validatedData.isPublished,
      ownerId: userId,
      createdById: userId,
      accessRoles: Array.isArray(validatedData.visibility) ? validatedData.visibility : ['OWNER', 'MANAGER', 'EMPLOYEE'],
      questionType: 'CHOICE', // По умолчанию
      deadlineAt: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
    },
  });

  revalidatePath('/learning');
  return course;
}

