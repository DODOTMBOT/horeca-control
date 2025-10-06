import { PrismaClient } from '@prisma/client'

// Глобальный объект для хранения PrismaClient в development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Создаем единый экземпляр PrismaClient
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['error'],
})

// Middleware для защиты данных
(prisma as any).$use(async (params: any, next: any) => {
  // Проверяем флаг DATA_GUARD
  const dataGuardEnabled = process.env.DATA_GUARD === 'on'
  
  if (dataGuardEnabled) {
    // Запрещаем deleteMany без условия where
    if (params.action === 'deleteMany' && (!params.args || !params.args.where)) {
      throw new Error('DATA_GUARD: deleteMany without where condition is forbidden')
    }
    
    // Запрещаем опасные операции на критических моделях
    const protectedModels = new Set(['Tenant', 'Point', 'User', 'Role', 'UserRole', 'Permission', 'RolePermission'])
    const dangerousActions = new Set(['delete', 'deleteMany', 'executeRaw', 'queryRaw'])
    
    if (params.model && protectedModels.has(params.model) && dangerousActions.has(params.action)) {
      throw new Error(`DATA_GUARD: ${params.action} operation on ${params.model} is forbidden`)
    }
  }
  
  return next(params)
})

// В development режиме сохраняем экземпляр в глобальном объекте
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma
