#!/usr/bin/env node

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function smokeTest() {
  console.log('🔍 Running smoke tests...')
  
  const errors = []
  
  try {
    // Проверяем таблицу Role
    const roleCount = await prisma.role.count()
    if (roleCount === 0) {
      errors.push('❌ Role table is empty')
    } else {
      console.log(`✅ Role table has ${roleCount} records`)
    }
    
    // Проверяем таблицу Permission (если есть)
    try {
      const permissionCount = await prisma.permission.count()
      console.log(`✅ Permission table has ${permissionCount} records`)
    } catch (e) {
      console.log('ℹ️ Permission table not found (this is OK)')
    }
    
    // Проверяем таблицу User
    const userCount = await prisma.user.count()
    if (userCount === 0) {
      errors.push('❌ User table is empty')
    } else {
      console.log(`✅ User table has ${userCount} records`)
    }
    
    // Проверяем таблицу Tenant
    const tenantCount = await prisma.tenant.count()
    if (tenantCount === 0) {
      errors.push('❌ Tenant table is empty')
    } else {
      console.log(`✅ Tenant table has ${tenantCount} records`)
    }
    
    // Проверяем таблицу Point
    const pointCount = await prisma.point.count()
    console.log(`✅ Point table has ${pointCount} records`)
    
    // Проверяем демо-пользователя
    const demoUser = await prisma.user.findUnique({
      where: { email: 'owner@demo.local' }
    })
    
    if (!demoUser) {
      errors.push('❌ Demo user owner@demo.local not found')
    } else {
      console.log('✅ Demo user owner@demo.local found')
    }
    
    // Проверяем роль "Владелец"
    const ownerRole = await prisma.role.findUnique({
      where: { name: 'Владелец' }
    })
    
    if (!ownerRole) {
      errors.push('❌ Owner role "Владелец" not found')
    } else {
      console.log('✅ Owner role "Владелец" found')
    }
    
  } catch (error) {
    errors.push(`❌ Database connection error: ${error.message}`)
  } finally {
    await prisma.$disconnect()
  }
  
  if (errors.length > 0) {
    console.log('\n🚨 Smoke test failed:')
    errors.forEach(error => console.log(error))
    process.exit(1)
  } else {
    console.log('\n🎉 All smoke tests passed!')
    process.exit(0)
  }
}

smokeTest().catch(error => {
  console.error('💥 Smoke test crashed:', error)
  process.exit(1)
})
