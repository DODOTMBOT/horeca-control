const { PrismaClient } = require('@prisma/client')

async function testSignup() {
  const prisma = new PrismaClient()
  
  try {
    console.log('Testing database connection...')
    
    // Test basic connection
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ Database connection works:', result)
    
    // Test user creation
    console.log('Testing user creation...')
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: 'hashed_password',
        isPlatformOwner: false
      }
    })
    console.log('✅ User created:', user)
    
    // Clean up
    await prisma.user.delete({
      where: { id: user.id }
    })
    console.log('✅ User deleted')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testSignup()
