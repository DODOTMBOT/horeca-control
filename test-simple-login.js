// Простой тест входа
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testDatabaseConnection() {
  try {
    console.log('🔧 Тестирование подключения к базе данных...');
    
    // Проверяем подключение
    await prisma.$connect();
    console.log('✅ Подключение к базе данных успешно');
    
    // Проверяем пользователя
    const user = await prisma.user.findUnique({
      where: { email: 'ar.em.v@yandex.ru' },
      include: {
        UserRole: {
          include: {
            role: true
          }
        }
      }
    });
    
    if (user) {
      console.log('✅ Пользователь найден:');
      console.log(`📧 Email: ${user.email}`);
      console.log(`👑 Владелец платформы: ${user.isPlatformOwner}`);
      console.log(`🔑 Пароль установлен: ${!!user.passwordHash}`);
      
      // Проверяем роли
      if (user.UserRole && user.UserRole.length > 0) {
        console.log('🎭 Роли пользователя:');
        user.UserRole.forEach(ur => {
          console.log(`  - ${ur.role.name}`);
        });
      } else {
        console.log('⚠️  У пользователя нет ролей');
      }
      
      // Тестируем пароль
      const testPassword = 'admin123';
      const passwordMatch = await bcrypt.compare(testPassword, user.passwordHash);
      console.log(`🔐 Пароль "admin123" правильный: ${passwordMatch}`);
      
    } else {
      console.log('❌ Пользователь не найден');
    }
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabaseConnection();
