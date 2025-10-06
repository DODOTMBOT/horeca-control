'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, AlertTriangle, CheckCircle, XCircle, Search, Filter, Plus, Package, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface PrintedLabel {
  id: string;
  productName: string;
  printedAt: Date;
  defrostEndTime?: Date;
  expiryTime: Date;
  storageConditions: string;
  isFrozen: boolean;
  defrostHours?: number;
  storageHours: number;
  status: 'fresh' | 'expiring' | 'expired' | 'defrosting';
}

interface LongTermProduct {
  id: string;
  name: string;
  storageZone: string;
  expiryDate: Date;
  quantity: number;
  createdAt: Date;
}

export default function ShelfLifePage() {
  const [activeTab, setActiveTab] = useState<'printed' | 'longterm'>('printed');
  const [printedLabels, setPrintedLabels] = useState<PrintedLabel[]>([]);
  const [longTermProducts, setLongTermProducts] = useState<LongTermProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'fresh' | 'expiring' | 'expired' | 'defrosting'>('all');
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    storageZone: '',
    expiryDate: '',
    quantity: 1
  });

  // Загружаем данные о напечатанных этикетках из localStorage
  useEffect(() => {
    const savedLabels = localStorage.getItem('printed-labels');
    if (savedLabels) {
      try {
        const parsedLabels = JSON.parse(savedLabels);
        // Преобразуем строки дат обратно в объекты Date
        const labelsWithDates = parsedLabels.map((label: any) => ({
          ...label,
          printedAt: new Date(label.printedAt),
          defrostEndTime: label.defrostEndTime ? new Date(label.defrostEndTime) : undefined,
          expiryTime: new Date(label.expiryTime)
        }));
        setPrintedLabels(labelsWithDates);
      } catch (error) {
        console.error('Ошибка при загрузке напечатанных этикеток:', error);
      }
    }
  }, []);

  // Загружаем долгосрочные продукты из localStorage
  useEffect(() => {
    const savedProducts = localStorage.getItem('long-term-products');
    if (savedProducts) {
      try {
        const parsedProducts = JSON.parse(savedProducts);
        const productsWithDates = parsedProducts.map((product: any) => ({
          ...product,
          expiryDate: new Date(product.expiryDate),
          createdAt: new Date(product.createdAt)
        }));
        setLongTermProducts(productsWithDates);
      } catch (error) {
        console.error('Ошибка при загрузке долгосрочных продуктов:', error);
      }
    }
  }, []);

  // Функция для определения статуса продукта
  const getProductStatus = (label: PrintedLabel): PrintedLabel['status'] => {
    const now = new Date();
    
    // Если продукт замороженный и еще размораживается
    if (label.isFrozen && label.defrostEndTime && now < label.defrostEndTime) {
      return 'defrosting';
    }
    // Если срок годности истек
    if (now > label.expiryTime) {
      return 'expired';
    }
    // Если срок годности истекает в течение 2 часов
    const timeUntilExpiry = label.expiryTime.getTime() - now.getTime();
    if (timeUntilExpiry < 2 * 60 * 60 * 1000) {
      return 'expiring';
    }
    
    return 'fresh';
  };

  // Обновляем статусы всех продуктов
  const labelsWithStatus = printedLabels.map(label => ({
    ...label,
    status: getProductStatus(label)
  }));

  // Фильтрация и поиск
  const filteredLabels = labelsWithStatus.filter(label => {
    const matchesSearch = label.productName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || label.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // Статистика
  const stats = {
    total: labelsWithStatus.length,
    fresh: labelsWithStatus.filter(l => l.status === 'fresh').length,
    expiring: labelsWithStatus.filter(l => l.status === 'expiring').length,
    expired: labelsWithStatus.filter(l => l.status === 'expired').length,
    defrosting: labelsWithStatus.filter(l => l.status === 'defrosting').length
  };

  const getStatusColor = (status: PrintedLabel['status']) => {
    switch (status) {
      case 'fresh': return 'text-green-600 bg-green-100';
      case 'expiring': return 'text-yellow-600 bg-yellow-100';
      case 'expired': return 'text-red-600 bg-red-100';
      case 'defrosting': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: PrintedLabel['status']) => {
    switch (status) {
      case 'fresh': return 'Свежий';
      case 'expiring': return 'Скоро истекает';
      case 'expired': return 'Просрочен';
      case 'defrosting': return 'Размораживается';
      default: return 'Неизвестно';
    }
  };

  const formatTimeRemaining = (expiryTime: Date) => {
    const now = new Date();
    const timeDiff = expiryTime.getTime() - now.getTime();
    
    if (timeDiff <= 0) {
      return 'Просрочен';
    }
    
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days}д ${hours}ч`;
    } else if (hours > 0) {
      return `${hours}ч`;
    } else {
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      return `${minutes}м`;
    }
  };

  // Функции для работы с долгосрочными продуктами
  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.storageZone || !newProduct.expiryDate) {
      alert('Пожалуйста, заполните все обязательные поля');
      return;
    }

    const product: LongTermProduct = {
      id: `longterm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: newProduct.name,
      storageZone: newProduct.storageZone,
      expiryDate: new Date(newProduct.expiryDate),
      quantity: newProduct.quantity,
      createdAt: new Date()
    };

    const updatedProducts = [...longTermProducts, product];
    setLongTermProducts(updatedProducts);
    localStorage.setItem('long-term-products', JSON.stringify(updatedProducts));

    // Сброс формы
    setNewProduct({
      name: '',
      storageZone: '',
      expiryDate: '',
      quantity: 1
    });
    setIsAddProductModalOpen(false);
  };

  const handleDeletePrintedLabel = (id: string) => {
    setPrintedLabels(prevLabels => prevLabels.filter(label => label.id !== id));
  };

  const handleDeleteLongTermProduct = (id: string) => {
    setLongTermProducts(prevProducts => prevProducts.filter(product => product.id !== id));
  };

  const getLongTermProductStatus = (product: LongTermProduct) => {
    const now = new Date();
    const diff = product.expiryDate.getTime() - now.getTime();
    
    if (diff <= 0) {
      return 'expired';
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days <= 7) {
      return 'expiring';
    }
    
    return 'fresh';
  };

  const filteredLongTermProducts = longTermProducts.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <Link
                href="/labeling"
                className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors mr-6"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Назад к панели управления
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Сроки годности</h1>
                <p className="text-gray-600">Мониторинг напечатанных этикеток и контроль сроков</p>
              </div>
            </div>
          </div>
          
          {/* Вкладки */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('printed')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'printed'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Напечатанные этикетки
              </button>
              <button
                onClick={() => setActiveTab('longterm')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'longterm'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Долгоиграющие сроки
              </button>
            </nav>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'printed' && (
          <>
            {/* Статистика для напечатанных этикеток */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex items-center">
                  <Clock className="w-8 h-8 text-gray-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Всего</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex items-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Свежие</p>
                    <p className="text-2xl font-bold text-green-600">{stats.fresh}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex items-center">
                  <AlertTriangle className="w-8 h-8 text-yellow-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Скоро истекают</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.expiring}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex items-center">
                  <XCircle className="w-8 h-8 text-red-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Просроченные</p>
                    <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex items-center">
                  <Clock className="w-8 h-8 text-blue-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Размораживаются</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.defrosting}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Фильтры и поиск */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Поиск по названию продукта..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-3 py-2 border rounded-md w-full"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as 'all' | 'fresh' | 'expiring' | 'expired' | 'defrosting')}
                  className="pl-9 pr-3 py-2 border rounded-md w-full appearance-none bg-white"
                >
                  <option value="all">Все статусы</option>
                  <option value="fresh">Свежие</option>
                  <option value="expiring">Скоро истекают</option>
                  <option value="expired">Просроченные</option>
                  <option value="defrosting">Размораживается</option>
                </select>
              </div>
            </div>

            {/* Таблица напечатанных этикеток */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              {filteredLabels.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>Нет напечатанных этикеток или не найдено по вашему запросу.</p>
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="mt-2 text-blue-600 hover:underline"
                    >
                      Очистить поиск
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Действие
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Продукт
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Статус
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Напечатано
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Разморозка до
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Годен до
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Осталось
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Условия хранения
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredLabels.map((label) => (
                        <tr key={label.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeletePrintedLabel(label.id)}
                              className="text-red-600 hover:text-red-900 hover:bg-red-50"
                              title="Удалить этикетку"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{label.productName}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(label.status)}`}>
                              {getStatusText(label.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {label.printedAt.toLocaleString('ru-RU')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {label.isFrozen && label.defrostEndTime ? (
                              <div>
                                <div className="text-blue-600">
                                  {label.defrostEndTime.toLocaleString('ru-RU', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </div>
                                <div className="text-xs text-gray-500">
                                  +{label.defrostHours}ч
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {label.expiryTime.toLocaleString('ru-RU', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`font-medium ${
                              label.status === 'expired' ? 'text-red-600' :
                              label.status === 'expiring' ? 'text-yellow-600' :
                              'text-green-600'
                            }`}>
                              {formatTimeRemaining(label.expiryTime)}
                            </span>
                          </td>
                          
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {label.storageConditions || 'Не указано'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'longterm' && (
          <>
            {/* Кнопка добавления долгосрочного продукта */}
            <div className="mb-6">
              <Button
                onClick={() => setIsAddProductModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Добавить продукт
              </Button>
            </div>

            {/* Таблица долгосрочных продуктов */}
            <div className="bg-white rounded-lg shadow-sm border">
              {filteredLongTermProducts.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>Нет долгосрочных продуктов</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Добавьте продукты с долгими сроками хранения
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Действие
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Название
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Зона хранения
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Количество
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Срок годности
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Статус
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Осталось
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredLongTermProducts.map((product) => {
                        const status = getLongTermProductStatus(product);
                        return (
                          <tr key={product.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteLongTermProduct(product.id)}
                                className="text-red-600 hover:text-red-900 hover:bg-red-50"
                                title="Удалить продукт"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{product.name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {product.storageZone}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {product.quantity}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {product.expiryDate.toLocaleDateString('ru-RU')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                status === 'fresh' ? 'bg-green-100 text-green-800' :
                                status === 'expiring' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {status === 'fresh' ? 'Свежий' :
                                 status === 'expiring' ? 'Скоро истекает' :
                                 'Просрочен'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={`font-medium ${
                                status === 'expired' ? 'text-red-600' :
                                status === 'expiring' ? 'text-yellow-600' :
                                'text-green-600'
                              }`}>
                                {formatTimeRemaining(product.expiryDate)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Модальное окно добавления долгосрочного продукта */}
      <Dialog open={isAddProductModalOpen} onOpenChange={setIsAddProductModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Добавить долгосрочный продукт</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Название продукта *
              </label>
              <Input
                value={newProduct.name}
                onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                placeholder="Например: Кока-кола 0.5л"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Зона хранения *
              </label>
              <Input
                value={newProduct.storageZone}
                onChange={(e) => setNewProduct({...newProduct, storageZone: e.target.value})}
                placeholder="Например: Склад А, Полка 3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Конечная дата окончания срока *
              </label>
              <Input
                type="date"
                value={newProduct.expiryDate}
                onChange={(e) => setNewProduct({...newProduct, expiryDate: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Количество
              </label>
              <Input
                type="number"
                min="1"
                value={newProduct.quantity}
                onChange={(e) => setNewProduct({...newProduct, quantity: parseInt(e.target.value) || 1})}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsAddProductModalOpen(false)}
              >
                Отмена
              </Button>
              <Button onClick={handleAddProduct}>
                Добавить
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}