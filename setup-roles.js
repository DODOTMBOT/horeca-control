const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "file:./prisma/dev.db"
    }
  }
})

async function setupRoles() {
  try {
    console.log('🔧 Настройка системы ролей для HoReCa...\n')
    
    // Определяем роли с их разрешениями
    const roles = [
      {
        name: 'PLATFORM_OWNER',
        permissions: {
          all: true,
          platform: {
            manageOrganizations: true,
            managePlatformSettings: true,
            viewAllData: true
          }
        },
        description: 'Владелец платформы - полный доступ ко всем функциям'
      },
      {
        name: 'ORGANIZATION_OWNER',
        permissions: {
          organization: {
            manageUsers: true,
            manageRoles: true,
            manageSettings: true,
            viewReports: true
          },
          modules: {
            labeling: true,
            files: true,
            learning: true,
            haccp: true,
            medicalBooks: true,
            scheduleSalary: true,
            employees: true,
            equipment: true,
            billing: true
          }
        },
        description: 'Владелец организации - управление своей организацией'
      },
      {
        name: 'MANAGER',
        permissions: {
          organization: {
            manageUsers: false,
            manageRoles: false,
            manageSettings: false,
            viewReports: true
          },
          modules: {
            labeling: true,
            files: true,
            learning: true,
            haccp: true,
            medicalBooks: true,
            scheduleSalary: true,
            employees: true,
            equipment: true,
            billing: false
          }
        },
        description: 'Менеджер - управление операциями организации'
      },
      {
        name: 'POINT_MANAGER',
        permissions: {
          organization: {
            manageUsers: false,
            manageRoles: false,
            manageSettings: false,
            viewReports: true
          },
          modules: {
            labeling: true,
            files: true,
            learning: true,
            haccp: true,
            medicalBooks: true,
            scheduleSalary: true,
            employees: true,
            equipment: true,
            billing: false
          },
          point: {
            managePointSettings: true,
            managePointEmployees: true,
            viewPointReports: true
          }
        },
        description: 'Менеджер точки - управление конкретной точкой'
      },
      {
        name: 'EMPLOYEE',
        permissions: {
          organization: {
            manageUsers: false,
            manageRoles: false,
            manageSettings: false,
            viewReports: false
          },
          modules: {
            labeling: true,
            files: false,
            learning: true,
            haccp: true,
            medicalBooks: false,
            scheduleSalary: false,
            employees: false,
            equipment: false,
            billing: false
          }
        },
        description: 'Сотрудник - базовые функции для работы'
      }
    ]
    
    console.log('📝 Создание ролей...')
    
    for (const roleData of roles) {
      const role = await prisma.role.upsert({
        where: { name: roleData.name },
        update: {
          permissions: roleData.permissions,
          tenantId: null, // Глобальные роли
          partner: 'HoReCa Platform'
        },
        create: {
          name: roleData.name,
          permissions: roleData.permissions,
          tenantId: null, // Глобальные роли
          partner: 'HoReCa Platform'
        }
      })
      
      console.log(`✅ Роль ${roleData.name} создана/обновлена`)
      console.log(`   Описание: ${roleData.description}`)
    }
    
    // Обновляем существующего пользователя на роль ORGANIZATION_OWNER
    const demoUser = await prisma.user.findUnique({
      where: { email: 'owner@demo.local' }
    })
    
    if (demoUser) {
      const organizationOwnerRole = await prisma.role.findUnique({
        where: { name: 'ORGANIZATION_OWNER' }
      })
      
      if (organizationOwnerRole) {
        await prisma.userRole.upsert({
          where: { 
            userId_tenantId: { 
              userId: demoUser.id, 
              tenantId: demoUser.tenantId 
            } 
          },
          update: { roleId: organizationOwnerRole.id },
          create: { 
            userId: demoUser.id, 
            roleId: organizationOwnerRole.id, 
            tenantId: demoUser.tenantId 
          }
        })
        
        console.log(`\n🔄 Пользователь ${demoUser.email} назначен на роль ORGANIZATION_OWNER`)
      }
    }
    
    console.log('\n🎉 Система ролей настроена успешно!')
    
  } catch (error) {
    console.error('❌ Ошибка при настройке ролей:', error)
  } finally {
    await prisma.$disconnect()
  }
}

setupRoles()
