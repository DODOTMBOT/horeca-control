import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getUserRole, getPartnerPoints } from '@/lib/acl';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { pointId } = await request.json();
    
    if (!pointId) {
      return NextResponse.json({ error: 'Point ID is required' }, { status: 400 });
    }

    // Проверяем, что пользователь - партнер
    const userRole = await getUserRole(session.user.id);
    console.log('🔄 Switch point request:', { userId: session.user.id, userRole, pointId });
    
    if (userRole !== 'Partner') {
      return NextResponse.json({ error: 'Only partners can switch points' }, { status: 403 });
    }

    // Получаем точки партнера
    const partnerPoints = await getPartnerPoints(session.user.id);
    const pointExists = partnerPoints.some(point => point.id === pointId);
    
    if (!pointExists) {
      return NextResponse.json({ error: 'Point not found or access denied' }, { status: 404 });
    }

    // Обновляем активную точку пользователя
    await prisma.user.update({
      where: { id: session.user.id },
      data: { pointId }
    });

    console.log('✅ Point switched successfully:', { userId: session.user.id, newPointId: pointId });

    return NextResponse.json({ 
      success: true, 
      message: 'Point switched successfully',
      pointId 
    });

  } catch (error) {
    console.error('Error switching point:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
