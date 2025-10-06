const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { randomBytes } = require('crypto');

const prisma = new PrismaClient();

async function resetPointPassword() {
  try {
    console.log('🔍 Поиск пользователя точки "Москва-1"...');
    
    // Находим пользователя точки
    const pointUser = await prisma.user.findFirst({
      where: {
        pointId: 'point_test2',
        UserRole: {
          some: {
            role: {
              name: 'Point'
            }
          }
        }
      },
      include: {
        UserRole: {
          include: { role: true }
        },
        point: true,
        tenant: true
      }
    });

    if (!pointUser) {
      console.log('❌ Пользователь точки не найден');
      return;
    }

    console.log(`✅ Найден пользователь: ${pointUser.name}`);
    console.log(`   Email: ${pointUser.email}`);
    console.log(`   Точка: ${pointUser.point?.name || 'N/A'}`);
    console.log(`   Tenant: ${pointUser.tenant?.name || 'N/A'}`);

    // Генерируем новый пароль
    const newPassword = randomBytes(8).toString("base64url");
    const passwordHash = await bcrypt.hash(newPassword, 12);

    console.log('🔧 Обновление пароля...');

    // Обновляем пароль
    await prisma.user.update({
      where: { id: pointUser.id },
      data: { passwordHash }
    });

    console.log('\n🎉 Пароль обновлен успешно!');
    console.log('📋 Данные для входа:');
    console.log(`   Email: ${pointUser.email}`);
    console.log(`   Пароль: ${newPassword}`);
    console.log(`   Имя: ${pointUser.name}`);
    console.log(`   Роли: ${pointUser.UserRole.map(ur => ur.role?.name).filter(Boolean).join(', ')}`);
    console.log(`   Точка: ${pointUser.point?.name || 'N/A'}`);
    console.log(`   Tenant: ${pointUser.tenant?.name || 'N/A'}`);

  } catch (error) {
    console.error('❌ Ошибка при обновлении пароля:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetPointPassword();
