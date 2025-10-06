import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // DATA_GUARD: Запрещаем deleteMany операции
  console.log('🛡️ DATA_GUARD: Using upsert operations only')

  // Создаем только одну роль "Владелец" с полными правами
  const roles = [
    {
      name: 'Владелец',
      permissions: { 
        all: true,
        manageUsers: true,
        manageRoles: true,
        manageBilling: true,
        labeling: true,
        files: true,
        learning: true,
        platformOwner: true
      },
      tenantId: null,
      partner: 'Основной партнер'
    }
  ]

  for (const roleData of roles) {
    await prisma.role.upsert({
      where: { name: roleData.name },
      update: {
        permissions: roleData.permissions,
        tenantId: roleData.tenantId,
        partner: roleData.partner
      },
      create: {
        name: roleData.name,
        permissions: roleData.permissions,
        tenantId: roleData.tenantId,
        partner: roleData.partner
      }
    })
    console.log(`✅ Role ${roleData.name} created/updated`)
  }

  // Создаем демонстрационного пользователя owner@demo.local
  const demoTenant = await prisma.tenant.upsert({
    where: { email: 'owner@demo.local' },
    update: { name: 'Demo Organization' },
    create: { 
      name: 'Demo Organization', 
      email: 'owner@demo.local' 
    }
  })
  console.log(`🏢 Demo tenant created/updated: ${demoTenant.name}`)

  const passwordHash = await bcrypt.hash('demo12345', 12)
  const demoUser = await prisma.user.upsert({
    where: { email: 'owner@demo.local' },
    update: { 
      name: 'Demo Owner',
      passwordHash,
      tenantId: demoTenant.id,
    },
    create: {
      email: 'owner@demo.local',
      name: 'Demo Owner',
      passwordHash,
      tenantId: demoTenant.id,
    }
  })
  console.log(`👤 Demo user created/updated: owner@demo.local / demo12345`)

  // Гарантируем наличие хотя бы одного пользователя для совместимости
  let firstUser = await prisma.user.findFirst()
  if (!firstUser) {
    firstUser = demoUser
  }

  // Назначаем роль "Владелец" демо-пользователю
  const ownerRole = await prisma.role.findUnique({ where: { name: 'Владелец' } })
  if (ownerRole && demoUser) {
    await prisma.userRole.upsert({
      where: { userId_tenantId: { userId: demoUser.id, tenantId: demoUser.tenantId! } },
      update: { roleId: ownerRole.id },
      create: { userId: demoUser.id, roleId: ownerRole.id, tenantId: demoUser.tenantId! }
    } as any)
    console.log('✅ Role "Владелец" assigned to demo user')
  }

  // Добавляем тестовые данные для обучения
  await seedLearningData(firstUser.id, firstUser.tenantId!)
  
  console.log('🎉 Seeding completed!')
}

async function seedLearningData(userId: string, tenantId: string) {
  console.log('📚 Seeding learning data...')
  
  const existingCourses = await prisma.course.count()
  if (existingCourses > 0) {
    console.log('📚 Learning data already exists, skipping...')
    return
  }

  // Создаем тестовый курс (новая структура)
  const course = await prisma.course.create({
    data: {
      title: 'Основы безопасности пищевых продуктов',
      description: 'Базовый курс по безопасности пищевых продуктов для сотрудников ресторанов и кафе',
      ownerId: userId,
      tenantId: tenantId,
      category: 'ХАССП',
      level: 'beginner',
      durationMin: 45,
      isPublished: true
    }
  })
  console.log(`✅ Course "${course.title}" created`)

  // Модули и уроки
  const mod1 = await prisma.courseModule.create({ data: { courseId: course.id, title: 'Введение', order: 0 } })
  const mod2 = await prisma.courseModule.create({ data: { courseId: course.id, title: 'Практика', order: 1 } })

  await prisma.lesson.create({ data: { moduleId: mod1.id, title: 'Что такое безопасность?', type: 'TEXT', content: 'Безопасность пищевых продуктов...', order: 0 } })
  await prisma.lesson.create({ data: { moduleId: mod1.id, title: 'Контроль температуры', type: 'TEXT', content: 'Опасная зона: 4-60C', order: 1 } })
  const quizLesson = await prisma.lesson.create({ data: { moduleId: mod2.id, title: 'Квиз по теме', type: 'TEXT', order: 0 } })

  const quiz = await prisma.quiz.create({ data: { lessonId: quizLesson.id, title: 'Тест по основам безопасности пищевых продуктов', passPct: 80 } })
  console.log(`✅ Quiz "${quiz.title}" created`)

  const q1 = await prisma.quizQuestion.create({ data: { quizId: quiz.id, text: 'Когда нужно мыть руки?', kind: 'single' } })
  await prisma.quizAnswer.createMany({ data: [
    { questionId: q1.id, text: 'Перед началом работы', isCorrect: true },
    { questionId: q1.id, text: 'После контакта с сырьём', isCorrect: true },
    { questionId: q1.id, text: 'Никогда', isCorrect: false },
  ] })

  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId, courseId: course.id } },
    update: {},
    create: { userId, courseId: course.id, tenantId }
  })

  console.log('📚 Learning data seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })