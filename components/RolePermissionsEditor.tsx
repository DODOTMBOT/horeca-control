"use client";

import { useState } from "react";
import { PermissionSet } from "@/lib/permission-types";

interface RolePermissionsEditorProps {
  roleName: string;
  initialPermissions: PermissionSet;
  onSave: (permissions: PermissionSet) => Promise<void>;
  onCancel: () => void;
}

export default function RolePermissionsEditor({
  roleName,
  initialPermissions,
  onSave,
  onCancel
}: RolePermissionsEditorProps) {
  const [permissions, setPermissions] = useState<PermissionSet>(initialPermissions);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(permissions);
    } catch (error) {
      console.error("Error saving permissions:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const updatePermission = (category: keyof PermissionSet, permission: string, value: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [permission]: value
      }
    }));
  };

  const updateAllInCategory = (category: keyof PermissionSet, value: boolean) => {
    setPermissions(prev => {
      const categoryPermissions = prev[category] as any;
      const updatedCategory = Object.keys(categoryPermissions).reduce((acc, key) => {
        acc[key] = value;
        return acc;
      }, {} as any);
      
      return {
        ...prev,
        [category]: updatedCategory
      };
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Редактирование разрешений роли: {roleName}</h2>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* Модули */}
          <div className="border rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Модули</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => updateAllInCategory('modules', true)}
                  className="text-sm px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                >
                  Все
                </button>
                <button
                  onClick={() => updateAllInCategory('modules', false)}
                  className="text-sm px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                  Ничего
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(permissions.modules).map(([key, value]) => (
                <label key={key} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => updatePermission('modules', key, e.target.checked)}
                    className="rounded"
                  />
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
                </label>
              ))}
            </div>
          </div>

          {/* Управление пользователями */}
          <div className="border rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Управление пользователями</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => updateAllInCategory('userManagement', true)}
                  className="text-sm px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                >
                  Все
                </button>
                <button
                  onClick={() => updateAllInCategory('userManagement', false)}
                  className="text-sm px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                  Ничего
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(permissions.userManagement).map(([key, value]) => (
                <label key={key} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => updatePermission('userManagement', key, e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">
                    {key === 'viewUsers' && 'Просмотр пользователей'}
                    {key === 'createUsers' && 'Создание пользователей'}
                    {key === 'editUsers' && 'Редактирование пользователей'}
                    {key === 'deleteUsers' && 'Удаление пользователей'}
                    {key === 'assignRoles' && 'Назначение ролей'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Управление ролями */}
          <div className="border rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Управление ролями</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => updateAllInCategory('roleManagement', true)}
                  className="text-sm px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                >
                  Все
                </button>
                <button
                  onClick={() => updateAllInCategory('roleManagement', false)}
                  className="text-sm px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                  Ничего
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(permissions.roleManagement).map(([key, value]) => (
                <label key={key} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => updatePermission('roleManagement', key, e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">
                    {key === 'viewRoles' && 'Просмотр ролей'}
                    {key === 'createRoles' && 'Создание ролей'}
                    {key === 'editRoles' && 'Редактирование ролей'}
                    {key === 'deleteRoles' && 'Удаление ролей'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Управление организацией */}
          <div className="border rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Управление организацией</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => updateAllInCategory('organization', true)}
                  className="text-sm px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                >
                  Все
                </button>
                <button
                  onClick={() => updateAllInCategory('organization', false)}
                  className="text-sm px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                  Ничего
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(permissions.organization).map(([key, value]) => (
                <label key={key} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => updatePermission('organization', key, e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">
                    {key === 'viewSettings' && 'Просмотр настроек'}
                    {key === 'editSettings' && 'Редактирование настроек'}
                    {key === 'viewReports' && 'Просмотр отчетов'}
                    {key === 'manageTenants' && 'Управление организациями'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Управление точками */}
          <div className="border rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Управление точками</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => updateAllInCategory('points', true)}
                  className="text-sm px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                >
                  Все
                </button>
                <button
                  onClick={() => updateAllInCategory('points', false)}
                  className="text-sm px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                  Ничего
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(permissions.points).map(([key, value]) => (
                <label key={key} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => updatePermission('points', key, e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">
                    {key === 'viewPoints' && 'Просмотр точек'}
                    {key === 'createPoints' && 'Создание точек'}
                    {key === 'editPoints' && 'Редактирование точек'}
                    {key === 'deletePoints' && 'Удаление точек'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Специальные права */}
          <div className="border rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Специальные права</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => updateAllInCategory('special', true)}
                  className="text-sm px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                >
                  Все
                </button>
                <button
                  onClick={() => updateAllInCategory('special', false)}
                  className="text-sm px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                  Ничего
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(permissions.special).map(([key, value]) => (
                <label key={key} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => updatePermission('special', key, e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">
                    {key === 'isPlatformOwner' && 'Владелец платформы'}
                    {key === 'canAccessOwnerPages' && 'Доступ к страницам владельца'}
                    {key === 'canManageBilling' && 'Управление биллингом'}
                    {key === 'canViewAllData' && 'Просмотр всех данных'}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  );
}
