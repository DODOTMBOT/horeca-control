'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Package, Clock, Beef, Carrot, Apple, Fish, Milk, Egg, Coffee, Cookie, IceCream, Wheat } from 'lucide-react';

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

export default function PrintProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);

  // Функция для определения иконки продукта
  const getProductIcon = (productName: string) => {
    const name = productName.toLowerCase();
    
    // Мясные продукты
    if (name.includes('бекон') || name.includes('говядина') || name.includes('свинина') || name.includes('курица') || name.includes('мясо')) {
      return Beef;
    }
    
    // Овощи
    if (name.includes('шампиньон') || name.includes('гриб') || name.includes('морковь') || name.includes('картофель') || name.includes('лук') || name.includes('помидор') || name.includes('огурец')) {
      return Carrot;
    }
    
    // Фрукты
    if (name.includes('яблоко') || name.includes('банан') || name.includes('апельсин') || name.includes('лимон') || name.includes('фрукт')) {
      return Apple;
    }
    
    // Рыба и морепродукты
    if (name.includes('рыба') || name.includes('лосось') || name.includes('тунец') || name.includes('креветк') || name.includes('краб')) {
      return Fish;
    }
    
    // Молочные продукты
    if (name.includes('молоко') || name.includes('сыр') || name.includes('йогурт') || name.includes('творог') || name.includes('сметана')) {
      return Milk;
    }
    
    // Яйца
    if (name.includes('яйцо') || name.includes('яичн')) {
      return Egg;
    }
    
    // Напитки
    if (name.includes('кофе') || name.includes('чай') || name.includes('сок') || name.includes('напиток')) {
      return Coffee;
    }
    
    // Сладости и десерты
    if (name.includes('печенье') || name.includes('торт') || name.includes('конфет') || name.includes('шоколад')) {
      return Cookie;
    }
    
    // Мороженое
    if (name.includes('мороженое') || name.includes('лед')) {
      return IceCream;
    }
    
    // Хлеб и зерновые
    if (name.includes('хлеб') || name.includes('мука') || name.includes('зерно') || name.includes('рис') || name.includes('макарон')) {
      return Wheat;
    }
    
    // По умолчанию - общая иконка упаковки
    return Package;
  };

  // Загружаем продукты из localStorage
  useEffect(() => {
    const savedProducts = localStorage.getItem('labeling-products');
    if (savedProducts) {
      try {
        const parsedProducts = JSON.parse(savedProducts);
        setProducts(parsedProducts);
      } catch (error) {
        console.error('Ошибка при загрузке продуктов из localStorage:', error);
      }
    }
  }, []);

  const handleProductClick = (product: Product) => {
    handlePrint(product);
  };

  const handlePrint = (product: Product) => {
    const now = new Date();
    const expiryTime = new Date(now.getTime() + product.storageHours * 60 * 60 * 1000);
    const defrostEndTime = product.isFrozen ? new Date(now.getTime() + product.defrostHours * 60 * 60 * 1000) : undefined;

    // Создаем скрытый элемент для печати
    const printElement = document.createElement('div');
    printElement.innerHTML = `
      <div style="
        font-family: Arial, sans-serif;
        width: 300px;
        height: 200px;
        border: 2px solid #000;
        padding: 15px;
        text-align: center;
        background: white;
        margin: 0 auto;
      ">
        <div style="font-size: 24px; font-weight: bold; margin-bottom: 15px; text-transform: uppercase;">
          ${product.name}
        </div>
        <div style="font-size: 16px; margin: 8px 0;">
          ${product.storageConditions || 'Нет условий'}
        </div>
        <div style="font-size: 16px; margin: 8px 0;">
          ${now.toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
        ${product.isFrozen ? `<div style="font-size: 16px; margin: 8px 0; color: #1976d2;">
          ${defrostEndTime!.toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>` : ''}
        <div style="font-size: 16px; margin: 8px 0; color: #d32f2f;">
          ${expiryTime.toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>
    `;

    // Добавляем стили для печати
    const printStyles = document.createElement('style');
    printStyles.textContent = `
      @media print {
        body * { visibility: hidden; }
        .print-label, .print-label * { visibility: visible; }
        .print-label { position: absolute; left: 0; top: 0; }
      }
    `;

    // Добавляем класс для печати
    printElement.className = 'print-label';

    // Временно добавляем на страницу
    document.body.appendChild(printElement);
    document.head.appendChild(printStyles);

    // Печатаем
    window.print();

    // Записываем данные о напечатанной этикетке
    const printedLabel = {
      id: `label_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      productName: product.name,
      printedAt: now.toISOString(),
      defrostEndTime: defrostEndTime?.toISOString(),
      expiryTime: expiryTime.toISOString(),
      storageConditions: product.storageConditions,
      isFrozen: product.isFrozen,
      defrostHours: product.defrostHours,
      storageHours: product.storageHours
    };

    // Сохраняем в localStorage
    try {
      const existingLabels = localStorage.getItem('printed-labels');
      const labels = existingLabels ? JSON.parse(existingLabels) : [];
      labels.push(printedLabel);
      localStorage.setItem('printed-labels', JSON.stringify(labels));
    } catch (error) {
      console.error('Ошибка при сохранении данных о печати:', error);
    }

    // Удаляем после печати
    setTimeout(() => {
      document.body.removeChild(printElement);
      document.head.removeChild(printStyles);
    }, 1000);
  };


  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-900 px-6 py-4">
        <Link 
          href="/labeling" 
          className="inline-flex items-center text-white hover:text-gray-300 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Назад к панели управления
        </Link>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {products.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">Нет продуктов</h3>
            <p className="text-gray-400 mb-6">
              Добавьте продукты в разделе "Добавление продуктов"
            </p>
            <Link 
              href="/labeling/add-products"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Package className="w-4 h-4 mr-2" />
              Добавить продукты
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                onClick={() => handleProductClick(product)}
                className="bg-white rounded-lg p-6 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 border border-gray-200"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    {(() => {
                      const IconComponent = getProductIcon(product.name);
                      return <IconComponent className="w-8 h-8 text-gray-600" />;
                    })()}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">{product.type}</p>
                  <p className="text-sm text-gray-500">
                    {product.unit} • {product.storageHours}ч
                  </p>
                  {product.storageConditions && (
                    <p className="text-xs text-gray-400 mt-1">
                      {product.storageConditions}
                    </p>
                  )}
                  {product.isFrozen && (
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <Clock className="w-3 h-3 mr-1" />
                        Замороженный
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}