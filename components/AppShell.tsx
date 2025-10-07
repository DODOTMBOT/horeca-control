'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import PointSwitcherWrapper from './PointSwitcherWrapper';

interface AppShellProps {
  children: React.ReactNode;
  session: any;
  userRole: string | null;
  partnerPoints: any[];
  currentPoint: any;
  visibleMenuItems: string[];
  permissions: any;
}

export default function AppShell({ 
  children, 
  session, 
  userRole, 
  partnerPoints, 
  currentPoint,
  visibleMenuItems,
  permissions
}: AppShellProps) {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r bg-white shadow-sm flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">Q</span>
            </div>
            <span className="font-bold text-xl text-gray-900">Quant IS</span>
          </div>
        </div>
        
        <nav className="px-4 space-y-6 flex-1">
          {/* Модули */}
          <div>
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Модули
            </h3>
            <div className="space-y-1">
              <Link 
                href="/dashboard" 
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive('/dashboard') 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                </svg>
                Дашборд
              </Link>
              
              <Link 
                href="/labeling" 
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive('/labeling') 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Маркировки
              </Link>
              
              <Link 
                href="/files" 
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive('/files') 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Файлы
              </Link>
              
              <Link 
                href="/learning" 
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive('/learning') 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Обучение
              </Link>
              
              <Link 
                href="/haccp" 
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive('/haccp') 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Журналы ХАССП
              </Link>
              
              <Link 
                href="/medical-books" 
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive('/medical-books') 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                Медицинские книжки
              </Link>
              
              <Link 
                href="/schedule-salary" 
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive('/schedule-salary') 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                График и зарплата
              </Link>
            </div>
          </div>

          {/* Управление */}
          <div>
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Управление
            </h3>
            <div className="space-y-1">
              {/* Пользователи - для ORGANIZATION_OWNER и выше */}
              {(userRole === "PLATFORM_OWNER" || userRole === "ORGANIZATION_OWNER") && (
                <Link 
                  href="/owner/users" 
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive('/owner/users') 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  Пользователи
                </Link>
              )}
              
              {/* Мои сотрудники - для MANAGER и выше */}
              {(userRole === "PLATFORM_OWNER" || userRole === "ORGANIZATION_OWNER" || userRole === "MANAGER" || userRole === "POINT_MANAGER") && (
                <Link 
                  href="/employees" 
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive('/employees') 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Мои сотрудники
                </Link>
              )}
              
              {/* Мои точки - для MANAGER и выше */}
              {(userRole === "PLATFORM_OWNER" || userRole === "ORGANIZATION_OWNER" || userRole === "MANAGER") && (
                <Link 
                  href="/partner/points" 
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive('/partner/points') 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Мои точки
                </Link>
              )}
              
              {/* Мое оборудование - для MANAGER и выше */}
              {(userRole === "PLATFORM_OWNER" || userRole === "ORGANIZATION_OWNER" || userRole === "MANAGER" || userRole === "POINT_MANAGER") && (
                <Link 
                  href="/equipment" 
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive('/equipment') 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                  Мое оборудование
                </Link>
              )}
              
              {/* Биллинг - для ORGANIZATION_OWNER и выше */}
              {(userRole === "PLATFORM_OWNER" || userRole === "ORGANIZATION_OWNER") && (
                <Link 
                  href="/billing" 
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive('/billing') 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  Биллинг
                </Link>
              )}
            </div>
          </div>
        </nav>

        {/* User info at bottom */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-600 font-semibold text-sm">
                {(session?.user?.name || session?.user?.email || "U").charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{session?.user?.name || session?.user?.email || "Пользователь"}</p>
              <p className="text-xs text-gray-500">{userRole || "EMPLOYEE"}</p>
            </div>
            <form action="/api/auth/signout" method="post" className="inline">
              <button 
                type="submit"
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title="Выйти из аккаунта"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header with point switcher for managers */}
        {(userRole === "MANAGER" || userRole === "POINT_MANAGER") && partnerPoints.length > 0 && (
          <div className="bg-white border-b border-gray-200 px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">Переключение между точками:</span>
                <PointSwitcherWrapper 
                  currentPoint={session?.user?.pointId ? partnerPoints.find(p => p.id === session.user.pointId) || null : null}
                  points={partnerPoints}
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Current point info for point managers */}
        {userRole === "POINT_MANAGER" && currentPoint && (
          <div className="bg-blue-50 border-b border-blue-200 px-6 py-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-blue-600">Текущая точка:</span>
              <span className="text-sm font-medium text-blue-800">{currentPoint.name}</span>
            </div>
          </div>
        )}
        
        <main className="flex-1 overflow-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}