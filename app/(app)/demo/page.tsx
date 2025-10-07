import { getUserPermissionsWithRole } from "@/lib/acl";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ensureUser } from "@/lib/guards";

export default async function DemoPage() {
  const session = await getServerSession(authOptions);
  ensureUser(session);

  const { role, permissions } = await getUserPermissionsWithRole(
    session.user.id!,
    session.user.tenantId
  );

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🎯 Демонстрация системы кастомных ролей</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Информация о пользователе */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">👤 Информация о пользователе</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="font-medium">Email:</span>
                <span className="text-gray-600">{session.user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Роль:</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                  {role || "Не определена"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Tenant ID:</span>
                <span className="text-gray-600">{session.user.tenantId || "Не назначен"}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Platform Owner:</span>
                <span className={`px-2 py-1 rounded text-sm ${
                  session.user.isPlatformOwner 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {session.user.isPlatformOwner ? "Да" : "Нет"}
                </span>
              </div>
            </div>
          </div>

          {/* Статистика разрешений */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">📊 Статистика разрешений</h2>
            <div className="space-y-3">
              {Object.entries(permissions).map(([category, categoryPermissions]) => {
                const total = Object.keys(categoryPermissions as any).length;
                const enabled = Object.values(categoryPermissions as any).filter(Boolean).length;
                const percentage = Math.round((enabled / total) * 100);
                
                return (
                  <div key={category} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium capitalize">
                        {category === 'modules' && 'Модули'}
                        {category === 'userManagement' && 'Управление пользователями'}
                        {category === 'roleManagement' && 'Управление ролями'}
                        {category === 'organization' && 'Управление организацией'}
                        {category === 'points' && 'Управление точками'}
                        {category === 'special' && 'Специальные права'}
                      </span>
                      <span className="text-gray-600">{enabled}/{total}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Детальные разрешения */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Модули */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">📱 Модули</h3>
            <div className="space-y-2">
              {Object.entries(permissions.modules).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center">
                  <span className="text-sm">
                    {key === 'dashboard' && 'Дашборд'}
                    {key === 'labeling' && 'Маркировки'}
                    {key === 'files' && 'Файлы'}
                    {key === 'learning' && 'Обучение'}
                    {key === 'haccp' && 'ХАССП'}
                    {key === 'medicalBooks' && 'Медицинские книжки'}
                    {key === 'scheduleSalary' && 'График и зарплата'}
                    {key === 'employees' && 'Сотрудники'}
                    {key === 'equipment' && 'Оборудование'}
                    {key === 'billing' && 'Биллинг'}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {value ? '✅' : '❌'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Управление пользователями */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">👥 Управление пользователями</h3>
            <div className="space-y-2">
              {Object.entries(permissions.userManagement).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center">
                  <span className="text-sm">
                    {key === 'viewUsers' && 'Просмотр пользователей'}
                    {key === 'createUsers' && 'Создание пользователей'}
                    {key === 'editUsers' && 'Редактирование пользователей'}
                    {key === 'deleteUsers' && 'Удаление пользователей'}
                    {key === 'assignRoles' && 'Назначение ролей'}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {value ? '✅' : '❌'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Управление ролями */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">🎭 Управление ролями</h3>
            <div className="space-y-2">
              {Object.entries(permissions.roleManagement).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center">
                  <span className="text-sm">
                    {key === 'viewRoles' && 'Просмотр ролей'}
                    {key === 'createRoles' && 'Создание ролей'}
                    {key === 'editRoles' && 'Редактирование ролей'}
                    {key === 'deleteRoles' && 'Удаление ролей'}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {value ? '✅' : '❌'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Управление организацией */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">🏢 Управление организацией</h3>
            <div className="space-y-2">
              {Object.entries(permissions.organization).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center">
                  <span className="text-sm">
                    {key === 'viewSettings' && 'Просмотр настроек'}
                    {key === 'editSettings' && 'Редактирование настроек'}
                    {key === 'viewReports' && 'Просмотр отчетов'}
                    {key === 'manageTenants' && 'Управление организациями'}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {value ? '✅' : '❌'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Управление точками */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">🏪 Управление точками</h3>
            <div className="space-y-2">
              {Object.entries(permissions.points).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center">
                  <span className="text-sm">
                    {key === 'viewPoints' && 'Просмотр точек'}
                    {key === 'createPoints' && 'Создание точек'}
                    {key === 'editPoints' && 'Редактирование точек'}
                    {key === 'deletePoints' && 'Удаление точек'}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {value ? '✅' : '❌'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Специальные права */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">⭐ Специальные права</h3>
            <div className="space-y-2">
              {Object.entries(permissions.special).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center">
                  <span className="text-sm">
                    {key === 'isPlatformOwner' && 'Владелец платформы'}
                    {key === 'canAccessOwnerPages' && 'Доступ к страницам владельца'}
                    {key === 'canManageBilling' && 'Управление биллингом'}
                    {key === 'canViewAllData' && 'Просмотр всех данных'}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {value ? '✅' : '❌'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Инструкции */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">🚀 Как использовать систему разрешений:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-blue-700">
            <div>
              <h4 className="font-semibold mb-2">1. Создание кастомных ролей:</h4>
              <ul className="space-y-1 text-sm">
                <li>• Откройте <code className="bg-blue-100 px-1 rounded">/owner/users</code></li>
                <li>• Перейдите на вкладку "Роли"</li>
                <li>• Нажмите "Создать роль"</li>
                <li>• Настройте детальные разрешения</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">2. Автоматическая защита:</h4>
              <ul className="space-y-1 text-sm">
                <li>• Пункты меню скрываются автоматически</li>
                <li>• Доступ к страницам блокируется</li>
                <li>• Перенаправление на дашборд</li>
                <li>• Детальный контроль доступа</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
