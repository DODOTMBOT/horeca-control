// Тест JWT callback
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testJWTCallback() {
  try {
    console.log('🔧 Тестирование JWT callback...');
    
    const userId = 'cmge5ugt20000l8vonqhyilcl'; // ID пользователя-владельца
    
    // Симулируем JWT callback
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        tenant: true,
        point: true
      },
    });
    
    if (!dbUser) {
      console.log('❌ Пользователь не найден');
      return;
    }
    
    console.log('✅ Пользователь найден:');
    console.log(`📧 Email: ${dbUser.email}`);
    console.log(`👑 isPlatformOwner: ${dbUser.isPlatformOwner}`);
    console.log(`🏢 tenantId: ${dbUser.tenantId}`);
    console.log(`📍 pointId: ${dbUser.pointId}`);
    
    // Определяем роль по логике из getUserRole
    let userRole = null;
    if (dbUser.isPlatformOwner) {
      userRole = "Owner";
    } else if (dbUser.tenant && !dbUser.point) {
      userRole = "Partner";
    } else if (dbUser.point) {
      userRole = "Point";
    }
    
    console.log(`🎭 Определенная роль: ${userRole}`);
    
    // В новой системе у нас только одна роль на пользователя
    const roles = userRole ? [userRole] : [];
    
    console.log('📋 Данные для JWT токена:');
    console.log(`  - roles: ${JSON.stringify(roles)}`);
    console.log(`  - role: ${userRole}`);
    console.log(`  - tenantId: ${dbUser.tenantId}`);
    console.log(`  - pointId: ${dbUser.pointId}`);
    console.log(`  - isPlatformOwner: ${userRole === "Owner"}`);
    
    console.log('✅ JWT callback тест завершен успешно!');
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testJWTCallback();
