import { z } from 'zod';

export const Roles = ['OWNER','MANAGER','EMPLOYEE'] as const;
export const QuestionTypes = ['CHOICE','FREE'] as const;

export const step1Schema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().optional(),
  accessRoles: z.array(z.enum(Roles)).min(1),
  deadlineAt: z.string().datetime().optional(),
  questionType: z.enum(QuestionTypes),
  coverUrl: z.string().url().optional(),
});

export type Step1Input = z.infer<typeof step1Schema>;

export const choiceOptionSchema = z.object({
  text: z.string().min(1),
  isCorrect: z.boolean().optional().default(false),
});

export const step2QuestionSchema = z.object({
  text: z.string().min(1),
  options: z.array(choiceOptionSchema).optional(),
});

export const step2Schema = z.object({
  questions: z.array(step2QuestionSchema).min(1).max(100),
});

export type Step2Input = z.infer<typeof step2Schema>;

export function validateChoiceQuestions(questions: Step2Input['questions']) {
  for (const q of questions) {
    const options = q.options || [];
    if (options.length < 2) throw new Error('Каждый вопрос CHOICE должен иметь минимум 2 варианта');
    if (!options.some(o => o.isCorrect)) throw new Error('Нужно отметить минимум один правильный вариант');
  }
}

export const submitAnswersSchema = z.object({
  courseId: z.string(),
  answers: z.record(z.string(), z.union([z.string(), z.array(z.string())])),
});

export const lessonTypeEnum = z.enum(['TEXT', 'VIDEO', 'FILE', 'IMAGE']);
export const levelEnum = z.enum(['beginner', 'intermediate', 'advanced']);

export const answerSchema = z.object({
  text: z.string().min(1),
  isCorrect: z.boolean().default(false),
});

export const questionSchema = z.object({
  text: z.string().min(1),
  type: z.enum(['SINGLE', 'MULTI', 'INPUT']),
  answers: z.array(answerSchema).default([]),
});

export const quizSchema = z.object({
  title: z.string().min(1),
  passPct: z.number().int().min(1).max(100).default(80),
  questions: z.array(questionSchema).default([]),
});

export const lessonSchema = z.object({
  title: z.string().min(1),
  type: lessonTypeEnum,
  content: z.string().optional(),
  order: z.number().int().min(0).default(0),
  quiz: quizSchema.optional(),
});

export const moduleSchema = z.object({
  title: z.string().min(1),
  order: z.number().int().min(0).default(0),
  lessons: z.array(lessonSchema).default([]),
});

export const courseCreateSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().max(2000).optional(),
  category: z.string().max(64).optional(),
  level: levelEnum.optional(),
  durationMin: z.number().int().min(1).optional(),
  coverUrl: z.string().url().optional(),
  isPublished: z.boolean().default(false),
  // кому доступен курс: массив ролей либо 'ALL'
  visibility: z.union([z.literal('ALL'), z.array(z.enum(['OWNER','MANAGER','EMPLOYEE']))]).default('ALL'),
  // ограничение по сроку прохождения (дата ISO) - опционально
  dueDate: z.string().datetime().optional(),
  // тип вопросов по умолчанию для создаваемых уроков с квизом
  defaultQuestionMode: z.enum(['INPUT','CHOICE']).default('CHOICE'),
  modules: z.array(moduleSchema).default([]),
});

export type CourseCreateInput = z.infer<typeof courseCreateSchema>;

