const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupRoles() {
  try {
    console.log('🧹 Очистка старых ролей...');
    
    // Удаляем все старые роли
    await prisma.userRole.deleteMany({});
    console.log('✅ Удалены связи пользователей с ролями');
    
    await prisma.role.deleteMany({});
    console.log('✅ Удалены все старые роли');
    
    console.log('🔧 Создание новых ролей...');
    
    // Создаем только нужные роли
    const roles = [
      {
        name: 'Owner',
        permissions: { 
          all: true,
          platformManagement: true,
          userManagement: true,
          billingManagement: true,
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

    for (const roleData of roles) {
      const role = await prisma.role.create({
        data: {
          name: roleData.name,
          permissions: roleData.permissions
        }
      });
      console.log(`✅ Создана роль "${role.name}"`);
    }

    // Назначаем роль Owner пользователю-владельцу
    const ownerRole = await prisma.role.findUnique({
      where: { name: 'Owner' }
    });

    const ownerUser = await prisma.user.findUnique({
      where: { email: 'ar.em.v@yandex.ru' }
    });

    if (ownerRole && ownerUser) {
      await prisma.userRole.create({
        data: {
          userId: ownerUser.id,
          roleId: ownerRole.id
        }
      });
      console.log('✅ Роль Owner назначена пользователю-владельцу');
    }

    console.log('\n🎉 Очистка и создание ролей завершены!');
    console.log('📋 Созданные роли:');
    console.log('  - Owner (владелец платформы)');
    console.log('  - Partner (партнер)');
    console.log('  - Point (пользователь точки)');

  } catch (error) {
    console.error('❌ Ошибка при очистке ролей:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupRoles();
