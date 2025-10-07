'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Package, Eye, Search, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Product {
  id: number;
  type: string;
  name: string;
  unit: string;
  isFrozen: boolean;
  defrostHours: number;
  storageHours: number;
  storageConditions: string;
}

export default function AddProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newProduct, setNewProduct] = useState({
    type: '',
    name: '',
    unit: '',
    isFrozen: false,
    defrostHours: 0,
    storageHours: 0,
    storageConditions: ''
  });

  const productTypes = [
    'Ингредиент',
    'Полуфабрикат', 
    'Готовая продукция',
    'Инвентарь',
    'Упаковка',
    'Расходники'
  ];

  const units = ['кг', 'г', 'л', 'мл', 'шт', 'упак'];

  const storageConditions = [
    '-18°C',
    '+2°C до +6°C', 
    '+2°C до +24°C',
    'Нет условий'
  ];

  // Загружаем продукты из localStorage при инициализации
  useEffect(() => {
    const savedProducts = localStorage.getItem('labeling-products');
    if (savedProducts) {
      try {
        const parsedProducts = JSON.parse(savedProducts);
        setProducts(parsedProducts);
      } catch (error) {
        console.error('Ошибка при загрузке продуктов из localStorage:', error);
      }
    } else {
      // Если нет сохраненных данных, добавляем пример продукта
      const exampleProduct = {
        id: 1,
        type: 'Готовая продукция',
        name: 'Шампиньоны жареные',
        unit: 'кг',
        isFrozen: false,
        defrostHours: 0,
        storageHours: 48,
        storageConditions: '+2°C до +6°C'
      };
      setProducts([exampleProduct]);
      localStorage.setItem('labeling-products', JSON.stringify([exampleProduct]));
    }
  }, []);

  // Сохраняем продукты в localStorage при изменении
  useEffect(() => {
    if (products.length > 0) {
      localStorage.setItem('labeling-products', JSON.stringify(products));
    }
  }, [products]);

  // Фильтруем продукты по поисковому запросу
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.unit.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddProduct = () => {
    // Проверяем обязательные поля
    if (!newProduct.type) {
      alert('Пожалуйста, выберите тип сырья');
      return;
    }
    
    if (!newProduct.name.trim()) {
      alert('Пожалуйста, введите название продукта');
      return;
    }
    
    if (!newProduct.unit) {
      alert('Пожалуйста, выберите единицу измерения');
      return;
    }
    
    if (newProduct.storageHours <= 0) {
      alert('Пожалуйста, укажите срок хранения больше 0 часов');
      return;
    }

    if (newProduct.isFrozen && newProduct.defrostHours <= 0) {
      alert('Для замороженных продуктов укажите время разморозки больше 0 часов');
      return;
    }

    const product: Product = {
      id: Date.now(),
      ...newProduct
    };

    setProducts([...products, product]);
    setNewProduct({
      type: '',
      name: '',
      unit: '',
      isFrozen: false,
      defrostHours: 0,
      storageHours: 0,
      storageConditions: ''
    });
    setIsModalOpen(false);
  };

  const handleDeleteProduct = (productId: number) => {
    if (confirm('Вы уверены, что хотите удалить этот продукт?')) {
      const updatedProducts = products.filter(product => product.id !== productId);
      setProducts(updatedProducts);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Link 
              href="/labeling"
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад к панели управления
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Добавление продуктов
          </h1>
          <p className="text-gray-600">
            Управление номенклатурой и настройка сроков годности
          </p>
        </div>

        {/* Top Bar with Search and Add Button */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Поиск продуктов"
                    className="pl-10 w-64"
                  />
                </div>
              </div>
              <Button 
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Добавление продукта
              </Button>
            </div>
          </div>
        </div>


        {/* Products Table */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Список продуктов</h3>
            <p className="text-sm text-gray-600 mt-1">Управление номенклатурой продуктов</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Тип сырья
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Название
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ед.измерения
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Разморозка (ч)
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Срок хранение (ч)
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Условия хранения
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center mr-3">
                          <Package className="w-4 h-4 text-gray-500" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {product.type}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{product.name}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{product.unit}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm text-gray-900">{product.defrostHours}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm text-gray-900">{product.storageHours}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm text-gray-900">{product.storageConditions || 'Не указано'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button 
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                          title="Просмотр"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteProduct(product.id)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                          title="Удалить"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Empty State */}
          {filteredProducts.length === 0 && (
            <div className="px-6 py-12 text-center">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              {searchTerm ? (
                <>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Продукты не найдены</h3>
                  <p className="text-gray-600 mb-4">
                    По запросу "{searchTerm}" ничего не найдено. Попробуйте изменить поисковый запрос.
                  </p>
                  <Button
                    onClick={() => setSearchTerm('')}
                    variant="outline"
                    className="mr-3"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Очистить поиск
                  </Button>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Нет продуктов</h3>
                  <p className="text-gray-600 mb-4">
                    Добавьте первый продукт, чтобы начать работу с номенклатурой
                  </p>
                  <Button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Добавить продукт
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Coming Soon Features */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Планируемые функции</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-800">Управление продуктами</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Создание новых продуктов с полными параметрами</li>
                <li>• Редактирование существующих позиций</li>
                <li>• Удаление неиспользуемых продуктов</li>
                <li>• Дублирование продуктов</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-gray-800">Расширенные возможности</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Массовое добавление через CSV</li>
                <li>• Категории и теги продуктов</li>
                <li>• Поиск и фильтрация</li>
                <li>• Экспорт в Excel</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Add Product Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">Добавление продукта</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Product Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Тип сырья *
                </label>
                <select
                  value={newProduct.type}
                  onChange={(e) => setNewProduct({...newProduct, type: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    !newProduct.type ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                >
                  <option value="">Выберите тип</option>
                  {productTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {!newProduct.type && (
                  <p className="text-red-500 text-sm mt-1">Это поле обязательно для заполнения</p>
                )}
              </div>

              {/* Product Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Название *
                </label>
                <Input
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                  placeholder="Введите название продукта"
                  className={!newProduct.name.trim() ? 'border-red-300 bg-red-50' : ''}
                />
                {!newProduct.name.trim() && (
                  <p className="text-red-500 text-sm mt-1">Это поле обязательно для заполнения</p>
                )}
              </div>

              {/* Unit of Measurement */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Единица измерения *
                </label>
                <select
                  value={newProduct.unit}
                  onChange={(e) => setNewProduct({...newProduct, unit: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    !newProduct.unit ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                >
                  <option value="">Выберите единицу</option>
                  {units.map((unit) => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
                {!newProduct.unit && (
                  <p className="text-red-500 text-sm mt-1">Это поле обязательно для заполнения</p>
                )}
              </div>

              {/* Frozen Product Checkbox */}
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="isFrozen"
                  checked={newProduct.isFrozen}
                  onChange={(e) => setNewProduct({...newProduct, isFrozen: e.target.checked, defrostHours: e.target.checked ? newProduct.defrostHours : 0})}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isFrozen" className="text-sm font-medium text-gray-700">
                  Замороженный продукт
                </label>
              </div>

              {/* Defrost Hours - only show if frozen */}
              {newProduct.isFrozen && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Время разморозки (часы) *
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={newProduct.defrostHours}
                    onChange={(e) => setNewProduct({...newProduct, defrostHours: parseInt(e.target.value) || 0})}
                    placeholder="Введите время разморозки в часах"
                    className={newProduct.isFrozen && newProduct.defrostHours <= 0 ? 'border-red-300 bg-red-50' : ''}
                  />
                  {newProduct.isFrozen && newProduct.defrostHours <= 0 && (
                    <p className="text-red-500 text-sm mt-1">Для замороженных продуктов укажите время разморозки больше 0 часов</p>
                  )}
                </div>
              )}

              {/* Storage Hours */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Срок хранения (часы) *
                </label>
                <Input
                  type="number"
                  min="1"
                  value={newProduct.storageHours}
                  onChange={(e) => setNewProduct({...newProduct, storageHours: parseInt(e.target.value) || 0})}
                  placeholder="Введите срок хранения в часах"
                  className={newProduct.storageHours <= 0 ? 'border-red-300 bg-red-50' : ''}
                />
                {newProduct.storageHours <= 0 && (
                  <p className="text-red-500 text-sm mt-1">Укажите срок хранения больше 0 часов</p>
                )}
              </div>

              {/* Storage Conditions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Условия хранения
                </label>
                <select
                  value={newProduct.storageConditions}
                  onChange={(e) => setNewProduct({...newProduct, storageConditions: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Выберите условия</option>
                  {storageConditions.map((condition) => (
                    <option key={condition} value={condition}>{condition}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                Отмена
              </Button>
              <Button
                onClick={handleAddProduct}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Сохранить
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
