const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "file:./prisma/dev.db"
    }
  }
})

async function analyzeRoles() {
  try {
    console.log('🔍 Анализ текущей системы ролей...\n')
    
    // Получаем все роли
    const roles = await prisma.role.findMany({
      include: {
        userRoles: {
          include: {
            user: {
              select: {
                email: true,
                name: true,
                tenant: {
                  select: { name: true }
                }
              }
            }
          }
        }
      }
    })
    
    console.log('📋 Существующие роли:')
    roles.forEach(role => {
      console.log(`\n🎭 Роль: ${role.name}`)
      console.log(`   ID: ${role.id}`)
      console.log(`   Tenant ID: ${role.tenantId || 'Глобальная'}`)
      console.log(`   Разрешения: ${JSON.stringify(role.permissions, null, 2)}`)
      console.log(`   Пользователей с этой ролью: ${role.userRoles.length}`)
      
      if (role.userRoles.length > 0) {
        console.log('   Пользователи:')
        role.userRoles.forEach(ur => {
          console.log(`     - ${ur.user.email} (${ur.user.name}) - ${ur.user.tenant?.name || 'Без организации'}`)
        })
      }
    })
    
    // Получаем всех пользователей с их ролями
    const users = await prisma.user.findMany({
      include: {
        UserRole: {
          include: {
            role: true
          }
        },
        tenant: true
      }
    })
    
    console.log('\n👥 Пользователи и их роли:')
    users.forEach(user => {
      console.log(`\n👤 ${user.email} (${user.name})`)
      console.log(`   Организация: ${user.tenant?.name || 'Без организации'}`)
      console.log(`   Platform Owner: ${user.isPlatformOwner}`)
      console.log(`   Роли: ${user.UserRole.map(ur => ur.role.name).join(', ') || 'Нет ролей'}`)
    })
    
  } catch (error) {
    console.error('❌ Ошибка:', error)
  } finally {
    await prisma.$disconnect()
  }
}

analyzeRoles()
