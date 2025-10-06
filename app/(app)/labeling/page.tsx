'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Printer, Package, Settings, Clock } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  type: string;
  unit: string;
  storageHours: number;
  defrostHours: number;
  isFrozen: boolean;
  storageConditions: string;
}

interface PrintedLabel {
  id: string;
  productName: string;
  printedAt: string;
  defrostEndTime?: string;
  expiryTime: string;
  storageConditions: string;
  isFrozen: boolean;
  defrostHours: number;
  storageHours: number;
}

export default function LabelingPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [printedLabels, setPrintedLabels] = useState<PrintedLabel[]>([]);
  const [stats, setStats] = useState({
    totalProducts: 0,
    printedToday: 0,
    recentActivity: [] as Array<{
      type: 'print' | 'add' | 'update';
      message: string;
      time: string;
      color: string;
    }>
  });

  useEffect(() => {
    // Загружаем продукты из localStorage
    const savedProducts = localStorage.getItem('labeling-products');
    if (savedProducts) {
      try {
        const parsedProducts = JSON.parse(savedProducts);
        setProducts(parsedProducts);
      } catch (error) {
        console.error('Ошибка при загрузке продуктов:', error);
      }
    }

    // Загружаем напечатанные этикетки из localStorage
    const savedLabels = localStorage.getItem('printed-labels');
    if (savedLabels) {
      try {
        const parsedLabels = JSON.parse(savedLabels);
        setPrintedLabels(parsedLabels);
      } catch (error) {
        console.error('Ошибка при загрузке напечатанных этикеток:', error);
      }
    }
  }, []);

  useEffect(() => {
    // Вычисляем статистику
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const printedToday = printedLabels.filter(label => {
      const printedDate = new Date(label.printedAt);
      return printedDate >= today;
    }).length;

    // Формируем активность
    const activities: Array<{
      type: 'print' | 'add' | 'update';
      message: string;
      time: string;
      color: string;
    }> = [];

    // Добавляем последние напечатанные этикетки
    const recentLabels = printedLabels
      .sort((a, b) => new Date(b.printedAt).getTime() - new Date(a.printedAt).getTime())
      .slice(0, 3);

    recentLabels.forEach(label => {
      const timeAgo = getTimeAgo(new Date(label.printedAt));
      activities.push({
        type: 'print',
        message: `Напечатана этикетка для "${label.productName}"`,
        time: timeAgo,
        color: 'bg-green-400'
      });
    });

    // Добавляем последние добавленные продукты
    const recentProducts = products
      .sort((a, b) => b.id - a.id)
      .slice(0, 2);

    recentProducts.forEach(product => {
      const timeAgo = getTimeAgo(new Date()); // Примерное время добавления
      activities.push({
        type: 'add',
        message: `Добавлен новый продукт "${product.name}"`,
        time: timeAgo,
        color: 'bg-blue-400'
      });
    });

    // Сортируем активность по времени
    activities.sort((a, b) => {
      const timeA = getTimeInMinutes(a.time);
      const timeB = getTimeInMinutes(b.time);
      return timeA - timeB;
    });

    setStats({
      totalProducts: products.length,
      printedToday,
      recentActivity: activities.slice(0, 5)
    });
  }, [products, printedLabels]);

  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'только что';
    if (diffInMinutes < 60) return `${diffInMinutes} минут назад`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} часов назад`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} дней назад`;
  };

  const getTimeInMinutes = (timeStr: string): number => {
    if (timeStr === 'только что') return 0;
    if (timeStr.includes('минут')) return parseInt(timeStr.split(' ')[0]);
    if (timeStr.includes('часов')) return parseInt(timeStr.split(' ')[0]) * 60;
    if (timeStr.includes('дней')) return parseInt(timeStr.split(' ')[0]) * 24 * 60;
    return 999999;
  };
  const panels = [
    {
      id: 'add-products',
      title: 'Добавление продуктов',
      description: 'Управление номенклатурой, создание новых продуктов и настройка сроков годности',
      icon: Plus,
      href: '/labeling/add-products',
      color: 'bg-green-50 border-green-200 hover:bg-green-100',
      iconColor: 'text-green-600'
    },
    {
      id: 'print-products',
      title: 'Печать этикеток',
      description: 'Быстрая печать этикеток для готовых продуктов с автоматическим расчетом сроков',
      icon: Printer,
      href: '/kitchen-fullscreen',
      color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      id: 'shelf-life',
      title: 'Сроки годности',
      description: 'Мониторинг напечатанных этикеток, контроль сроков годности и просроченных продуктов',
      icon: Clock,
      href: '/labeling/shelf-life',
      color: 'bg-orange-50 border-orange-200 hover:bg-orange-100',
      iconColor: 'text-orange-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Маркировка продуктов
          </h1>
          <p className="text-gray-600">
            Система управления маркировкой и печати этикеток для HoReCa
          </p>
        </div>

        {/* Dashboard Panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {panels.map((panel) => {
            const IconComponent = panel.icon;
            return (
              <Link
                key={panel.id}
                href={panel.href}
                className={`block p-6 rounded-xl border-2 transition-all duration-200 hover:shadow-lg ${panel.color}`}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${panel.iconColor} bg-white`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {panel.title}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {panel.description}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Package className="w-8 h-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Всего продуктов</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Printer className="w-8 h-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Напечатано сегодня</p>
                <p className="text-2xl font-bold text-gray-900">{stats.printedToday}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Settings className="w-8 h-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Всего напечатано</p>
                <p className="text-2xl font-bold text-gray-900">{printedLabels.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Последняя активность</h3>
          </div>
          <div className="p-6">
            {stats.recentActivity.length > 0 ? (
              <div className="space-y-4">
                {stats.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center text-sm">
                    <div className={`w-2 h-2 ${activity.color} rounded-full mr-3`}></div>
                    <span className="text-gray-600">
                      {activity.message} - {activity.time}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-2">
                  <Package className="w-12 h-12 mx-auto" />
                </div>
                <p className="text-gray-500">Пока нет активности</p>
                <p className="text-sm text-gray-400 mt-1">
                  Добавьте продукты или напечатайте этикетки, чтобы увидеть активность
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
