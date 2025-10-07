const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "file:./prisma/dev.db"
    }
  }
})

async function checkUserRole() {
  try {
    console.log('🔍 Checking user role details...')
    
    const user = await prisma.user.findUnique({
      where: { email: 'owner@demo.local' },
      include: {
        tenant: true,
        UserRole: {
          include: {
            role: true
          }
        }
      }
    })
    
    console.log('👤 User details:', {
      id: user?.id,
      email: user?.email,
      name: user?.name,
      tenantId: user?.tenantId,
      isPlatformOwner: user?.isPlatformOwner,
      tenantName: user?.tenant?.name,
      roles: user?.UserRole?.map(ur => ({
        roleName: ur.role.name,
        tenantId: ur.tenantId
      }))
    })
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUserRole()
