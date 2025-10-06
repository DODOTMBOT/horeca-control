import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { canAuthor, currentTenantId } from '@/lib/acl';

// GET /api/learning/courses/[id]/assignees - получение назначений курса
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

    // Проверяем, что курс существует и пользователь может его просматривать
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

    // Проверяем права на просмотр назначений
    if (!canAuthor(session) && course.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Нет прав для просмотра назначений' }, { status: 403 });
    }

    const assignments = await prisma.assignment.findMany({
      where: { courseId },
      include: {
        progress: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Получаем пользователей, назначенных по ролям
    const roleAssignments = assignments.filter(a => a.roleName && !a.userId);
    const userAssignments = assignments.filter(a => a.userId);

    // Для назначений по ролям, получаем всех пользователей с этой ролью
    const roleUsers = [];
    for (const assignment of roleAssignments) {
      if (assignment.roleName) {
        const users = await prisma.user.findMany({
          where: {
            tenantId: tenantId,
            UserRole: {
              some: {
                role: {
                  name: assignment.roleName
                }
              }
            }
          },
          select: {
            id: true,
            name: true,
            email: true
          }
        });

        roleUsers.push({
          assignment,
          users: users.map(user => ({
            ...user,
            progress: assignment.progress.find(p => p.userId === user.id)
          }))
        });
      }
    }

    return NextResponse.json({
      assignments: {
        byUser: userAssignments,
        byRole: roleUsers
      },
      total: assignments.length
    });

  } catch (error) {
    console.error('❌ Error fetching assignees:', error);
    return NextResponse.json({ error: 'Ошибка получения назначений' }, { status: 500 });
  }
}
