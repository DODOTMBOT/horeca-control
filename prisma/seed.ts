import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding roles...')

  // Upsert roles
  const roles = [
    { id: 'owner', name: 'OWNER', description: 'Full access to organization', updatedAt: new Date() },
    { id: 'admin', name: 'ADMIN', description: 'Administrative access', updatedAt: new Date() },
    { id: 'manager', name: 'MANAGER', description: 'Management access', updatedAt: new Date() },
    { id: 'employee', name: 'EMPLOYEE', description: 'Basic employee access', updatedAt: new Date() },
  ]

  for (const role of roles) {
    await prisma.role.upsert({
      where: { id: role.id },
      update: {},
      create: role,
    })
    console.log(`✅ Role ${role.name} created/updated`)
  }

  console.log('🎉 Seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
