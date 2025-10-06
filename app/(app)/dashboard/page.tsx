export const runtime = "nodejs";

import { requireSession, requireTenant } from "@/lib/guards";
import { getUserRole } from "@/lib/acl";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tag, FileText, BookOpen, CreditCard, Package, Calendar, Zap, User } from "lucide-react";

export default async function DashboardPage() {
  await requireSession();
  const tenantSession = await requireTenant();

  if (!tenantSession.user?.tenantId) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">Дашборд</h1>
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-400">
            Организация не назначена. Обратитесь к администратору.
          </p>
        </div>
      </div>
    );
  }

  const tenantId = tenantSession.user.tenantId;

  // Получаем роль пользователя для отображения
  const userRole = await getUserRole(tenantSession.user.id!, tenantSession.user.tenantId!);
  const isPlatformOwnerUser = tenantSession.user.isPlatformOwner;

  // Получаем данные для дашборда
  const [
    productsCount,
    labelsCount,
    filesCount,
    coursesCount,
    subscription
  ] = await Promise.all([
    // Количество продуктов
    prisma.product.count({
      where: { tenantId }
    }),
    
    // Количество этикеток за последние 7 дней
    prisma.label.count({
      where: {
        tenantId,
        printedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    }),
    
    // Количество файлов
    prisma.file.count({
      where: { tenantId }
    }),
    
    // Количество курсов
    prisma.course.count({
      where: { tenantId }
    }),
    
    // Подписка
    prisma.subscription.findUnique({
      where: { tenantId }
    })
  ]);

  const stats = [
    {
      title: "Маркировки",
      icon: Tag,
      items: [
        { label: "Продукты", value: productsCount, icon: Package, badge: undefined },
        { label: "Этикетки (7 дней)", value: labelsCount, icon: Calendar, badge: undefined }
      ]
    },
    {
      title: "Файлы",
      icon: FileText,
      items: [
        { label: "Загружено файлов", value: filesCount, icon: FileText, badge: undefined }
      ]
    },
    {
      title: "Обучение",
      icon: BookOpen,
      items: [
        { label: "Курсы", value: coursesCount, icon: BookOpen, badge: undefined }
      ]
    },
    {
      title: "Подписка",
      icon: CreditCard,
      items: [
        { 
          label: "План", 
          value: subscription?.plan || "BASIC",
          icon: Zap,
          badge: subscription?.status === "ACTIVE" ? "success" : "secondary"
        },
        { 
          label: "Статус", 
          value: subscription?.status === "ACTIVE" ? "Активна" : "Неактивна",
          icon: CreditCard,
          badge: subscription?.status === "ACTIVE" ? "success" : "destructive"
        }
      ]
    }
  ];

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Дашборд</h1>
          <p className="text-gray-600">
            Добро пожаловать, {tenantSession.user?.name || tenantSession.user?.email}!
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Продукты</p>
                <p className="text-2xl font-bold text-gray-900">{productsCount}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Этикетки (7 дней)</p>
                <p className="text-2xl font-bold text-gray-900">{labelsCount}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Tag className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Файлы</p>
                <p className="text-2xl font-bold text-gray-900">{filesCount}</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* User Role Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm border mb-8">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Ваша роль</h3>
              <div className="flex items-center gap-2 mt-1">
                {isPlatformOwnerUser ? (
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                    Владелец
                  </span>
                ) : userRole ? (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {userRole}
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                    Нет роли
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <a href="/labeling" className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Tag className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Маркировки</h3>
                <p className="text-sm text-gray-600">Управление продуктами</p>
              </div>
            </div>
          </a>

          <a href="/files" className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Файлы</h3>
                <p className="text-sm text-gray-600">Документы и стандарты</p>
              </div>
            </div>
          </a>

          <a href="/learning" className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Обучение</h3>
                <p className="text-sm text-gray-600">Курсы и обучение</p>
              </div>
            </div>
          </a>

          <a href="/owner/users" className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Пользователи</h3>
                <p className="text-sm text-gray-600">Управление доступом</p>
              </div>
            </div>
          </a>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Последние обновления</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-sm">Q</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">Quant IS</span>
                    <span className="text-sm text-gray-500">2 часа назад</span>
                  </div>
                  <p className="text-gray-700">Система обновлена. Добавлены новые функции управления пользователями.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}