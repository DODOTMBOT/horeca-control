import { getUserPermissionsWithRole } from "@/lib/acl";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ensureUser } from "@/lib/guards";

export default async function PermissionsDemoPage() {
  const session = await getServerSession(authOptions);
  ensureUser(session);

  const { role, permissions } = await getUserPermissionsWithRole(
    session.user.id!,
    session.user.tenantId
  );

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Демонстрация системы разрешений</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Информация о пользователе</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong>Email:</strong> {session.user.email}
            </div>
            <div>
              <strong>Роль:</strong> {role || "Не определена"}
            </div>
            <div>
              <strong>Tenant ID:</strong> {session.user.tenantId || "Не назначен"}
            </div>
            <div>
              <strong>Platform Owner:</strong> {session.user.isPlatformOwner ? "Да" : "Нет"}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Модули */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Доступ к модулям</h3>
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
                    {value ? 'Доступно' : 'Запрещено'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Управление пользователями */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Управление пользователями</h3>
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
                    {value ? 'Доступно' : 'Запрещено'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Управление ролями */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Управление ролями</h3>
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
                    {value ? 'Доступно' : 'Запрещено'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Специальные права */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Специальные права</h3>
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
                    {value ? 'Доступно' : 'Запрещено'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Как это работает:</h3>
          <ul className="text-blue-700 space-y-1">
            <li>• Система автоматически определяет ваши разрешения на основе роли</li>
            <li>• Пункты меню скрываются, если у вас нет доступа к соответствующим модулям</li>
            <li>• Попытки доступа к запрещенным страницам перенаправляют на дашборд</li>
            <li>• Вы можете создавать кастомные роли с детальными разрешениями</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
