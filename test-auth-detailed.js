// Детальный тест авторизации
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testAuthDetailed() {
  try {
    console.log('🔧 Детальный тест авторизации...');
    
    const email = 'ar.em.v@yandex.ru';
    const password = 'admin123';
    
    // 1. Проверяем пользователя
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        tenant: true,
        point: true
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
    
    // 2. Проверяем пароль
    if (!user.passwordHash) {
      console.log('❌ Пароль не установлен');
      return;
    }
    
    const isPasswordCorrect = await bcrypt.compare(password, user.passwordHash);
    console.log(`🔐 Пароль правильный: ${isPasswordCorrect}`);
    
    if (!isPasswordCorrect) {
      console.log('❌ Неверный пароль');
      return;
    }
    
    // 3. Определяем роль
    let role = null;
    if (user.isPlatformOwner) {
      role = "Owner";
    } else if (user.tenant && !user.point) {
      role = "Partner";
    } else if (user.point) {
      role = "Point";
    }
    
    console.log(`🎭 Роль: ${role}`);
    
    // 4. Проверяем, что роль существует в базе
    if (role) {
      const roleRecord = await prisma.role.findUnique({
        where: { name: role }
      });
      console.log(`🎭 Роль в базе: ${roleRecord ? 'существует' : 'не найдена'}`);
      
      if (roleRecord) {
        // Проверяем связь пользователя с ролью
        const userRole = await prisma.userRole.findFirst({
          where: {
            userId: user.id,
            roleId: roleRecord.id
          }
        });
        console.log(`🔗 Связь с ролью: ${userRole ? 'существует' : 'не найдена'}`);
      }
    }
    
    console.log('✅ Все проверки пройдены успешно!');
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testAuthDetailed();
