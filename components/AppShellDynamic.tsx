'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import PointSwitcherWrapper from './PointSwitcherWrapper';
import { MenuItem } from '@/lib/menu.config';

interface AppShellProps {
  children: React.ReactNode;
  session: any;
  userRole: string | null;
  partnerPoints: any[];
  currentPoint: any;
  filteredMenu?: readonly MenuItem[] | null;
}

export default function AppShellDynamic({ 
  children, 
  session, 
  userRole, 
  partnerPoints, 
  currentPoint,
  filteredMenu
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
          {/* Динамическое меню на основе доступов */}
          <div>
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Меню
            </h3>
            <div className="space-y-1">
              {filteredMenu ? (
                filteredMenu.map((item) => (
                  <Link 
                    key={item.slug}
                    href={item.slug} 
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      isActive(item.slug) 
                        ? 'bg-blue-50 text-blue-700' 
                        : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                    </svg>
                    {item.label}
                  </Link>
                ))
              ) : (
                // Fallback к старому меню если filteredMenu не загружен
                <>
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
                  
                  {/* Пользователи - только для Owner */}
                  {userRole === "Owner" && (
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
                </>
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
              <p className="text-xs text-gray-500">{userRole || "Owner"}</p>
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
        {/* Header with point switcher for partners */}
        {userRole === "Partner" && partnerPoints.length > 0 && (
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
        
        {/* Current point info for point users */}
        {userRole === "Point" && currentPoint && (
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
