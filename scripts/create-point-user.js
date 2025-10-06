const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { randomBytes } = require('crypto');

const prisma = new PrismaClient();

async function createPointUser() {
  try {
    console.log('🔍 Поиск точки "Москва-1"...');
    
    // Находим точку "Москва-1"
    const point = await prisma.point.findFirst({
      where: {
        name: 'Москва-1'
      },
      include: {
        tenant: true
      }
    });

    if (!point) {
      console.log('❌ Точка "Москва-1" не найдена');
      return;
    }

    console.log(`✅ Найдена точка: ${point.name} (ID: ${point.id})`);
    console.log(`   Tenant: ${point.tenant?.name || 'N/A'} (ID: ${point.tenantId})`);

    // Проверяем, есть ли уже пользователь для этой точки
    const existingUser = await prisma.user.findFirst({
      where: {
        pointId: point.id,
        UserRole: {
          some: {
            role: {
              name: 'Point'
            }
          }
        }
      }
    });

    if (existingUser) {
      console.log(`⚠️  Пользователь для точки уже существует: ${existingUser.email}`);
      console.log(`   ID: ${existingUser.id}`);
      return;
    }

    // Генерируем логин и пароль
    const pointLogin = `moscow1_${point.id.slice(-6)}`;
    const pointPassword = randomBytes(8).toString("base64url");
    const passwordHash = await bcrypt.hash(pointPassword, 12);

    console.log('🔧 Создание пользователя для точки...');

    // Создаем пользователя для точки
    const pointUser = await prisma.user.create({
      data: {
        email: `${pointLogin}@moscow1.local`,
        name: `${point.name} (Point User)`,
        passwordHash,
        tenantId: point.tenantId,
        pointId: point.id,
        UserRole: {
          create: [{
            role: { connect: { name: "Point" } },
            tenantId: point.tenantId
          }]
        }
      },
      include: {
        UserRole: {
          include: { role: true }
        }
      }
    });

    console.log('\n🎉 Пользователь для точки создан успешно!');
    console.log('📋 Данные для входа:');
    console.log(`   Email: ${pointUser.email}`);
    console.log(`   Логин: ${pointLogin}`);
    console.log(`   Пароль: ${pointPassword}`);
    console.log(`   Имя: ${pointUser.name}`);
    console.log(`   Роли: ${pointUser.UserRole.map(ur => ur.role?.name).filter(Boolean).join(', ')}`);
    console.log(`   Точка: ${point.name}`);
    console.log(`   Tenant: ${point.tenant?.name || 'N/A'}`);

  } catch (error) {
    console.error('❌ Ошибка при создании пользователя точки:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createPointUser();
