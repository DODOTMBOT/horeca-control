import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Создаем пользователей с разными ролями
  const passwordHash = await bcrypt.hash('demo12345', 12)
  
  // OWNER
  const ownerUser = await prisma.user.upsert({
    where: { email: 'owner@demo.local' },
    update: {
      name: 'Demo Owner',
      passwordHash,
      role: 'OWNER',
    },
    create: {
      email: 'owner@demo.local',
      name: 'Demo Owner',
      passwordHash,
      role: 'OWNER',
    }
  })
  console.log(`👤 Owner user: owner@demo.local / demo12345`)

  // PARTNER
  const partnerUser = await prisma.user.upsert({
    where: { email: 'partner@demo.local' },
    update: {
      name: 'Demo Partner',
      passwordHash,
      role: 'PARTNER',
    },
    create: {
      email: 'partner@demo.local',
      name: 'Demo Partner',
      passwordHash,
      role: 'PARTNER',
    }
  })
  console.log(`👤 Partner user: partner@demo.local / demo12345`)

  // POINT
  const pointUser = await prisma.user.upsert({
    where: { email: 'point@demo.local' },
    update: {
      name: 'Demo Point Manager',
      passwordHash,
      role: 'POINT',
    },
    create: {
      email: 'point@demo.local',
      name: 'Demo Point Manager',
      passwordHash,
      role: 'POINT',
    }
  })
  console.log(`👤 Point user: point@demo.local / demo12345`)

  // EMPLOYEE
  const employeeUser = await prisma.user.upsert({
    where: { email: 'employee@demo.local' },
    update: {
      name: 'Demo Employee',
      passwordHash,
      role: 'EMPLOYEE',
    },
    create: {
      email: 'employee@demo.local',
      name: 'Demo Employee',
      passwordHash,
      role: 'EMPLOYEE',
    }
  })
  console.log(`👤 Employee user: employee@demo.local / demo12345`)

  console.log('🎉 Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })