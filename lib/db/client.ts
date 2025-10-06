import { PrismaClient } from '@prisma/client'

// Глобальный объект для хранения PrismaClient в development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Создаем единый экземпляр PrismaClient
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['error'],
})

// В development режиме сохраняем экземпляр в глобальном объекте
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Middleware для защиты данных
prisma.$use(async (params, next) => {
  // Проверяем флаг DATA_GUARD
  const dataGuardEnabled = process.env.DATA_GUARD === 'on'
  
  if (dataGuardEnabled) {
    // Запрещаем deleteMany без условия where
    if (params.action === 'deleteMany' && !params.args.where) {
      throw new Error('DATA_GUARD: deleteMany without where condition is forbidden')
    }
    
    // Запрещаем опасные операции на критических моделях
    const protectedModels = ['Tenant', 'Point', 'User', 'Role', 'UserRole', 'Permission', 'RolePermission']
    const dangerousActions = ['delete', 'deleteMany', 'executeRaw', 'queryRaw']
    
    if (protectedModels.includes(params.model || '') && dangerousActions.includes(params.action)) {
      throw new Error(`DATA_GUARD: ${params.action} operation on ${params.model} is forbidden`)
    }
  }
  
  return next(params)
})

export default prisma
