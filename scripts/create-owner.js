const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createOwner() {
  try {
    console.log('🔧 Создание пользователя-владельца...');
    
    // Создаем хеш пароля
    const password = 'admin123'; // Простой пароль для начала
    const passwordHash = await bcrypt.hash(password, 12);
    
    // Создаем пользователя-владельца
    const owner = await prisma.user.upsert({
      where: { email: 'ar.em.v@yandex.ru' },
      update: {
        passwordHash,
        isPlatformOwner: true,
        name: 'Platform Owner'
      },
      create: {
        email: 'ar.em.v@yandex.ru',
        passwordHash,
        name: 'Platform Owner',
        isPlatformOwner: true
      }
    });

    console.log('✅ Пользователь-владелец создан:');
    console.log(`📧 Email: ${owner.email}`);
    console.log(`🔑 Пароль: ${password}`);
    console.log(`👑 Владелец платформы: ${owner.isPlatformOwner}`);

    // Создаем базовые роли
    console.log('🔧 Создание базовых ролей...');
    
    const baseRoles = [
      {
        name: 'Owner',
        permissions: { 
          all: true,
          platformManagement: true,
          userManagement: true,
          billingManagement: true
        },
      },
      {
        name: 'Partner',
        permissions: { 
          pointManagement: true,
          employeeManagement: true,
          labeling: true,
          files: true,
          learning: true,
          haccp: true,
          medicalBooks: true,
          scheduleSalary: true
        },
      },
      {
        name: 'Point',
        permissions: { 
          employeeManagement: true,
          labeling: true,
          files: true,
          learning: true,
          haccp: true,
          medicalBooks: true,
          scheduleSalary: true
        },
      },
    ];

    for (const roleData of baseRoles) {
      await prisma.role.upsert({
        where: { name: roleData.name },
        update: { permissions: roleData.permissions },
        create: { name: roleData.name, permissions: roleData.permissions },
      });
      console.log(`✅ Роль "${roleData.name}" создана/обновлена`);
    }

    // Назначаем роль Owner пользователю
    const ownerRole = await prisma.role.findUnique({
      where: { name: 'Owner' }
    });

    if (ownerRole) {
      // Проверяем, есть ли уже связь
      const existingUserRole = await prisma.userRole.findFirst({
        where: {
          userId: owner.id,
          roleId: ownerRole.id
        }
      });

      if (!existingUserRole) {
        await prisma.userRole.create({
          data: {
            userId: owner.id,
            roleId: ownerRole.id
          }
        });
        console.log('✅ Роль Owner назначена пользователю');
      } else {
        console.log('✅ Роль Owner уже назначена пользователю');
      }
    }

    console.log('\n🎉 Готово! Теперь вы можете войти в систему:');
    console.log(`🌐 URL: http://localhost:3000/signin`);
    console.log(`📧 Email: ar.em.v@yandex.ru`);
    console.log(`🔑 Пароль: ${password}`);

  } catch (error) {
    console.error('❌ Ошибка при создании владельца:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createOwner();
