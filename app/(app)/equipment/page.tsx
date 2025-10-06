'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Plus, Settings, MapPin, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Equipment {
  id: string;
  type: string;
  zone: string;
  status: 'active' | 'inactive' | 'maintenance';
  createdAt: string;
  updatedAt: string;
}

const EQUIPMENT_TYPES = [
  'Холодильник',
  'Морозильная камера',
  'Плита',
  'Духовой шкаф',
  'Микроволновая печь',
  'Посудомоечная машина',
  'Кофемашина',
  'Весы',
  'Мясорубка',
  'Блендер',
  'Другое'
];

const ZONES = [
  'Кухня',
  'Склад',
  'Холодильная камера',
  'Морозильная камера',
  'Бар',
  'Зал',
  'Подсобка',
  'Другое'
];

export default function EquipmentPage() {
  const { data: session, status } = useSession();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    type: '',
    zone: ''
  });

  // Загружаем оборудование
  const fetchEquipment = async () => {
    try {
      console.log('🔄 Fetching equipment...');
      setIsLoading(true);
      const response = await fetch('/api/equipment');
      console.log('📡 Equipment fetch response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📋 Equipment data received:', data);
        setEquipment(data.equipment || []);
        console.log('✅ Equipment list updated:', data.equipment || []);
      } else {
        console.error('❌ Failed to fetch equipment:', response.status);
      }
    } catch (error) {
      console.error('❌ Error fetching equipment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchEquipment();
    }
  }, [status]);

  // Создание нового оборудования
  const handleCreateEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.type || !formData.zone) {
      alert('Пожалуйста, заполните все поля');
      return;
    }

    if (!session?.user?.tenantId) {
      alert('Ошибка: Не найден tenant ID. Пожалуйста, перезайдите в систему.');
      return;
    }

    try {
      setIsCreating(true);
      console.log('🚀 Sending equipment creation request:', formData);
      
      const response = await fetch('/api/equipment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      console.log('📡 Response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Equipment created:', result);
        setFormData({ type: '', zone: '' });
        setShowForm(false);
        fetchEquipment(); // Обновляем список
      } else {
        const error = await response.json();
        console.error('❌ API Error:', error);
        alert(`Ошибка: ${error.error}`);
      }
    } catch (error) {
      console.error('❌ Network Error:', error);
      alert('Произошла ошибка при создании оборудования');
    } finally {
      setIsCreating(false);
    }
  };

  // Удаление оборудования
  const handleDeleteEquipment = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить это оборудование?')) {
      return;
    }

    try {
      const response = await fetch(`/api/equipment/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchEquipment(); // Обновляем список
      } else {
        alert('Ошибка при удалении оборудования');
      }
    } catch (error) {
      console.error('Error deleting equipment:', error);
      alert('Произошла ошибка при удалении оборудования');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Активно';
      case 'inactive':
        return 'Неактивно';
      case 'maintenance':
        return 'На обслуживании';
      default:
        return 'Неизвестно';
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-96 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Мое оборудование
          </h1>
          <p className="text-gray-600">
            Управление оборудованием ресторана
          </p>
        </div>

        {/* Add Equipment Button */}
        <div className="mb-6">
          <Button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Добавить оборудование
          </Button>
        </div>

        {/* Add Equipment Modal */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Добавить новое оборудование</DialogTitle>
              <DialogDescription>
                Заполните информацию о новом оборудовании
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleCreateEquipment} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Тип оборудования *
                  </label>
                  <Input
                    type="text"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    placeholder="Введите тип оборудования (например: Холодильник)"
                    className="w-full"
                    list="equipment-types"
                    required
                  />
                  <datalist id="equipment-types">
                    {EQUIPMENT_TYPES.map((type) => (
                      <option key={type} value={type} />
                    ))}
                  </datalist>
                  <p className="text-xs text-gray-500 mt-1">
                    Популярные типы: Холодильник, Плита, Кофемашина, Микроволновая печь
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Зона *
                  </label>
                  <Input
                    type="text"
                    value={formData.zone}
                    onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                    placeholder="Введите зону (например: Кухня)"
                    className="w-full"
                    list="zones"
                    required
                  />
                  <datalist id="zones">
                    {ZONES.map((zone) => (
                      <option key={zone} value={zone} />
                    ))}
                  </datalist>
                  <p className="text-xs text-gray-500 mt-1">
                    Популярные зоны: Кухня, Склад, Бар, Холодильная камера
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  type="submit"
                  disabled={isCreating}
                  className="flex items-center gap-2"
                >
                  {isCreating ? 'Создание...' : 'Создать оборудование'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setFormData({ type: '', zone: '' });
                  }}
                >
                  Отмена
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Equipment List */}
        {equipment.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Оборудование не найдено
              </h3>
              <p className="text-gray-600 mb-4">
                Добавьте первое оборудование, чтобы начать управление
              </p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Добавить оборудование
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {equipment.map((item) => (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Settings className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{item.type}</CardTitle>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <MapPin className="w-4 h-4" />
                          {item.zone}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteEquipment(item.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Статус:</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(item.status)}`}>
                        {getStatusLabel(item.status)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Создано: {new Date(item.createdAt).toLocaleDateString('ru-RU')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
