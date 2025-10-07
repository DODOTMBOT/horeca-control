"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";

export default function DashboardPage() {
  const { data: session, status } = useSession();

  if (status === "loading") return <p>Загрузка...</p>;
  if (!session) return <p>Не авторизован</p>;

  const role = session.user?.role;

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Личный кабинет</h1>
        
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Информация о пользователе</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p><strong>Email:</strong> {session.user?.email}</p>
              <p><strong>Имя:</strong> {session.user?.name || "Не указано"}</p>
              <p><strong>Роль:</strong> <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">{role}</span></p>
            </div>
            <div>
              <p><strong>ID:</strong> {session.user?.id}</p>
            </div>
          </div>
        </div>

        {/* Панели по ролям */}
        {role === "OWNER" && <OwnerPanel />}
        {role === "PARTNER" && <PartnerPanel />}
        {role === "POINT" && <PointPanel />}
        {role === "EMPLOYEE" && <EmployeePanel />}

        {/* Общее меню */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Доступные разделы</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {role === "OWNER" && (
              <>
                <Link href="/owner/partners" className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <h3 className="font-semibold text-lg">Партнеры</h3>
                  <p className="text-gray-600">Управление партнерами и их точками</p>
                </Link>
                
                <Link href="/owner/subscriptions" className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <h3 className="font-semibold text-lg">Подписки</h3>
                  <p className="text-gray-600">Тарифные планы и биллинг</p>
                </Link>
                
                <Link href="/owner/analytics" className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <h3 className="font-semibold text-lg">Аналитика</h3>
                  <p className="text-gray-600">Общая статистика по системе</p>
                </Link>
                
                <Link href="/owner/users" className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <h3 className="font-semibold text-lg">Пользователи</h3>
                  <p className="text-gray-600">Управление пользователями системы</p>
                </Link>
              </>
            )}
            
            {(role === "PARTNER" || role === "OWNER") && (
              <Link href="/partner" className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <h3 className="font-semibold text-lg">Управление точками</h3>
                <p className="text-gray-600">Точки продаж, персонал</p>
              </Link>
            )}
            
            {(role === "POINT" || role === "PARTNER" || role === "OWNER") && (
              <>
                <Link href="/point" className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <h3 className="font-semibold text-lg">Управление точкой</h3>
                  <p className="text-gray-600">Операции, отчеты</p>
                </Link>
                
                <Link href="/learning" className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <h3 className="font-semibold text-lg">Обучение</h3>
                  <p className="text-gray-600">Курсы, тесты, сертификаты</p>
                </Link>
                
                <Link href="/labeling" className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <h3 className="font-semibold text-lg">Маркировка</h3>
                  <p className="text-gray-600">Этикетки, сроки годности</p>
                </Link>
                
                <Link href="/files" className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <h3 className="font-semibold text-lg">Файлы</h3>
                  <p className="text-gray-600">Документы, изображения</p>
                </Link>
              </>
            )}
            
            {role === "EMPLOYEE" && (
              <>
                <Link href="/learning" className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <h3 className="font-semibold text-lg">Обучение</h3>
                  <p className="text-gray-600">Курсы, тесты, сертификаты</p>
                </Link>
                
                <Link href="/schedule-salary" className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <h3 className="font-semibold text-lg">График и зарплата</h3>
                  <p className="text-gray-600">Мой график работы</p>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function OwnerPanel() {
  return (
    <div className="bg-white p-6 rounded-lg shadow mb-6">
      <h2 className="text-xl font-semibold mb-4">Панель владельца</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-800">Партнеры</h3>
          <p className="text-blue-600 text-sm">12 активных партнеров</p>
          <p className="text-blue-600 text-sm">+2 за месяц</p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg">
          <h3 className="font-semibold text-green-800">Подписки</h3>
          <p className="text-green-600 text-sm">45 активных подписок</p>
          <p className="text-green-600 text-sm">MRR: ₽180K</p>
        </div>
        <div className="p-4 bg-purple-50 rounded-lg">
          <h3 className="font-semibold text-purple-800">Аналитика</h3>
          <p className="text-purple-600 text-sm">Общий доход: ₽2.4M</p>
          <p className="text-purple-600 text-sm">+15% рост</p>
        </div>
        <div className="p-4 bg-orange-50 rounded-lg">
          <h3 className="font-semibold text-orange-800">Пользователи</h3>
          <p className="text-orange-600 text-sm">1,247 активных</p>
          <p className="text-orange-600 text-sm">+8% рост</p>
        </div>
      </div>
    </div>
  );
}

function PartnerPanel() {
  return (
    <div className="bg-white p-6 rounded-lg shadow mb-6">
      <h2 className="text-xl font-semibold mb-4">Панель партнера</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-800">Точки продаж</h3>
          <p className="text-blue-600">Управление вашими точками</p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg">
          <h3 className="font-semibold text-green-800">Персонал</h3>
          <p className="text-green-600">Сотрудники и их роли</p>
        </div>
        <div className="p-4 bg-purple-50 rounded-lg">
          <h3 className="font-semibold text-purple-800">Отчеты</h3>
          <p className="text-purple-600">Аналитика по точкам</p>
        </div>
      </div>
    </div>
  );
}

function PointPanel() {
  return (
    <div className="bg-white p-6 rounded-lg shadow mb-6">
      <h2 className="text-xl font-semibold mb-4">Панель точки</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-800">Операции</h3>
          <p className="text-blue-600">Ежедневные операции</p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg">
          <h3 className="font-semibold text-green-800">Чек-листы</h3>
          <p className="text-green-600">Контроль качества</p>
        </div>
        <div className="p-4 bg-purple-50 rounded-lg">
          <h3 className="font-semibold text-purple-800">Обучение</h3>
          <p className="text-purple-600">Курсы для сотрудников</p>
        </div>
      </div>
    </div>
  );
}

function EmployeePanel() {
  return (
    <div className="bg-white p-6 rounded-lg shadow mb-6">
      <h2 className="text-xl font-semibold mb-4">Панель сотрудника</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-800">Курсы</h3>
          <p className="text-blue-600">Обучение и сертификация</p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg">
          <h3 className="font-semibold text-green-800">Задачи</h3>
          <p className="text-green-600">Ежедневные задачи</p>
        </div>
        <div className="p-4 bg-purple-50 rounded-lg">
          <h3 className="font-semibold text-purple-800">Отчеты</h3>
          <p className="text-purple-600">Мои отчеты и статистика</p>
        </div>
      </div>
    </div>
  );
}
