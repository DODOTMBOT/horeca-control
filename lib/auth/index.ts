import { SessionProvider } from './session'
import { MockSessionProvider } from './mock-session'

// Фабрика для создания провайдера сессий
export function createSessionProvider(): SessionProvider {
  const authMode = process.env.AUTH_MODE || 'real'
  
  if (authMode === 'mock') {
    console.log('🔧 Using Mock Session Provider')
    return new MockSessionProvider()
  }
  
  // В реальном режиме используем NextAuth
  console.log('🔐 Using NextAuth Session Provider')
  return createNextAuthProvider()
}

// Создание NextAuth провайдера (заглушка для изоляции)
function createNextAuthProvider(): SessionProvider {
  // Здесь будет интеграция с реальным NextAuth
  // Пока возвращаем mock для совместимости
  console.warn('⚠️ NextAuth provider not implemented yet, falling back to mock')
  return new MockSessionProvider()
}

// Экспорт провайдера по умолчанию
export const sessionProvider = createSessionProvider()

// Экспорт утилит для удобства
export const getSession = () => sessionProvider.getSession()
export const requireSession = () => sessionProvider.requireSession()
export const requirePlatformOwner = () => sessionProvider.requirePlatformOwner()
export const requireTenant = () => sessionProvider.requireTenant()
export const hasRole = (roleName: string) => sessionProvider.hasRole(roleName)
export const hasAnyRole = (roleNames: string[]) => sessionProvider.hasAnyRole(roleNames)
