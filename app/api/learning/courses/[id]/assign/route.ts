import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { canAuthor, currentTenantId, checkSandboxLimits } from '@/lib/acl';

const assignCourseSchema = z.object({
  userId: z.string().optional(),
  roleName: z.string().optional(),
}).refine(data => data.userId || data.roleName, {
  message: 'Необходимо указать userId или roleName'
});

// POST /api/learning/courses/[id]/assign - назначение курса
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
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

    // Проверяем права на назначение
    if (!canAuthor(session) && course.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Нет прав для назначения курса' }, { status: 403 });
    }

    // Проверяем лимиты песочницы для назначений
    const limitCheck = await checkSandboxLimits(session, 'assignment');
    if (!limitCheck.allowed) {
      return NextResponse.json({ error: limitCheck.message }, { status: 403 });
    }

    const body = await request.json();
    const { userId, roleName } = assignCourseSchema.parse(body);

    // Если назначаем конкретному пользователю, проверяем что он существует
    if (userId) {
      const user = await prisma.user.findFirst({
        where: {
          id: userId,
          tenantId: tenantId
        }
      });

      if (!user) {
        return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
      }

      // Проверяем, не назначен ли уже курс этому пользователю
      const existingAssignment = await prisma.assignment.findFirst({
        where: {
          courseId,
          userId
        }
      });

      if (existingAssignment) {
        return NextResponse.json({ error: 'Курс уже назначен этому пользователю' }, { status: 400 });
      }
    }

    // Если назначаем по роли, проверяем что роль валидна
    if (roleName) {
      const validRoles = ['EMPLOYEE', 'MANAGER', 'Owner', 'Partner', 'Point'];
      if (!validRoles.includes(roleName)) {
        return NextResponse.json({ error: 'Неверная роль' }, { status: 400 });
      }

      // Проверяем, не назначен ли уже курс этой роли
      const existingAssignment = await prisma.assignment.findFirst({
        where: {
          courseId,
          roleName,
          tenantId
        }
      });

      if (existingAssignment) {
        return NextResponse.json({ error: 'Курс уже назначен этой роли' }, { status: 400 });
      }
    }

    // Создаем назначение
    const assignment = await prisma.assignment.create({
      data: {
        courseId,
        userId,
        roleName,
        tenantId
      }
    });

    return NextResponse.json(assignment, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Неверные данные', details: error.issues }, { status: 400 });
    }
    console.error('❌ Error assigning course:', error);
    return NextResponse.json({ error: 'Ошибка назначения курса' }, { status: 500 });
  }
}
