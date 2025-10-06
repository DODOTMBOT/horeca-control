export const runtime = "nodejs";

import { auth } from "@/lib/auth"
import { getUserRole, hasRole } from "@/lib/acl"
import Link from "next/link"
import { Button } from "@/components/ui/button"
// import { NavLink } from "@/components/NavLink"
import { 
  LayoutDashboard, 
  Tag, 
  FileText, 
  BookOpen, 
  CreditCard,
  LogIn,
  UserPlus,
  Users
} from "lucide-react"

export async function AppNav() {
  const session = await auth()

  if (!session) {
    return (
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/" className="text-xl font-bold text-gray-900 dark:text-white">
                  HoReCa SaaS
                </Link>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link href="/signin">
                <Button variant="outline" size="sm">
                  <LogIn className="h-4 w-4 mr-2" />
                  Войти
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Регистрация
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>
    )
  }

  // Проверить права доступа
  const userRole = await getUserRole(session.user.id!, session.user.tenantId)
  const canAccessBillingSection = hasRole(userRole, "Владелец")
  
  // Проверяем роли из сессии для owner секции
  const roles: string[] = ((session.user as Record<string, unknown>)?.roles ?? []) as string[];
  const canAccessOwnerSection = roles.includes("Владелец")

  const navItems = [
    { href: "/dashboard", label: "Дашборд", icon: LayoutDashboard },
    { href: "/labeling", label: "Маркировки", icon: Tag },
    { href: "/files", label: "Файлы", icon: FileText },
    { href: "/learning", label: "Обучение", icon: BookOpen },
  ]

  // Добавить Биллинг только для пользователей с соответствующими правами
  if (canAccessBillingSection) {
    navItems.push({ href: "/billing", label: "Биллинг", icon: CreditCard })
  }

  // Добавить управление пользователями для владельцев
  if (canAccessOwnerSection) {
    navItems.push(
      { href: "/owner/users", label: "Пользователи", icon: Users }
    )
  }

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link 
                href="/" 
                className="text-xl font-bold text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200"
              >
                HoReCa SaaS
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navItems.map((item, index) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 transition-all duration-200 hover:scale-105 animate-slide-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <Icon className="h-4 w-4 mr-2 transition-transform duration-200 group-hover:scale-110" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {session.user.name || session.user.email}
              </span>
              {session.user.isPlatformOwner && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                  Platform Owner
                </span>
              )}
              {userRole && !session.user.isPlatformOwner && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {userRole}
                </span>
              )}
            </div>
            <Link href="/api/auth/signout">
              <Button 
                variant="outline" 
                className="hover-lift transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Выйти
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
