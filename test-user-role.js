// Тест функции getUserRole
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testUserRole() {
  try {
    console.log('🔧 Тестирование функции getUserRole...');
    
    // Получаем пользователя
    const user = await prisma.user.findUnique({
      where: { email: 'ar.em.v@yandex.ru' },
      include: {
        tenant: {
          select: { id: true }
        },
        point: {
          select: { id: true }
        }
      }
    });
    
    if (!user) {
      console.log('❌ Пользователь не найден');
      return;
    }
    
    console.log('✅ Пользователь найден:');
    console.log(`📧 Email: ${user.email}`);
    console.log(`👑 isPlatformOwner: ${user.isPlatformOwner}`);
    console.log(`🏢 tenantId: ${user.tenantId}`);
    console.log(`📍 pointId: ${user.pointId}`);
    
    // Определяем роль по логике из getUserRole
    let role = null;
    
    if (user.isPlatformOwner) {
      role = "Owner";
    } else if (user.tenant && !user.point) {
      role = "Partner";
    } else if (user.point) {
      role = "Point";
    }
    
    console.log(`🎭 Определенная роль: ${role}`);
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testUserRole();
