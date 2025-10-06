'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Building2, MapPin, Phone, Mail, Edit, Trash2, Users, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface Point {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  userCount: number;
  users: Array<{
    id: string;
    email: string;
    name: string;
    roles: string[];
  }>;
}

interface CreatePointData {
  name: string;
  address: string;
  phone: string;
  email: string;
}

export default function PartnerPointsPage() {
  const [points, setPoints] = useState<Point[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPoint, setEditingPoint] = useState<Point | null>(null);
  const [newPoint, setNewPoint] = useState<CreatePointData>({
    name: '',
    address: '',
    phone: '',
    email: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showCredentials, setShowCredentials] = useState<{[key: string]: boolean}>({});
  const [credentials, setCredentials] = useState<{[key: string]: {login: string, password: string}}>({});

  // Загружаем точки из API
  const fetchPoints = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/partner/points/list', { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        setPoints(data);
      } else {
        console.error('Failed to fetch points');
      }
    } catch (error) {
      console.error('Error fetching points:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPoints();
  }, []);

  const handleAddPoint = async () => {
    if (!newPoint.name.trim()) {
      alert('Пожалуйста, введите название точки');
      return;
    }

    try {
      const response = await fetch('/api/partner/points/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPoint)
      });

      if (response.ok) {
        const result = await response.json();
        setCredentials(prev => ({
          ...prev,
          [result.point.id]: result.credentials
        }));
        setShowCredentials(prev => ({
          ...prev,
          [result.point.id]: true
        }));
        await fetchPoints(); // Обновляем список
        setNewPoint({ name: '', address: '', phone: '', email: '' });
        setIsAddModalOpen(false);
        alert(`Точка создана! Логин: ${result.credentials.login}, Пароль: ${result.credentials.password}`);
      } else {
        const error = await response.json();
        alert(`Ошибка: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating point:', error);
      alert('Ошибка при создании точки');
    }
  };

  const handleEditPoint = (point: Point) => {
    setEditingPoint(point);
    setIsEditModalOpen(true);
  };

  const handleUpdatePoint = async () => {
    if (!editingPoint) return;

    try {
      const response = await fetch('/api/partner/points/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingPoint)
      });

      if (response.ok) {
        await fetchPoints(); // Обновляем список
        setIsEditModalOpen(false);
        setEditingPoint(null);
      } else {
        const error = await response.json();
        alert(`Ошибка: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating point:', error);
      alert('Ошибка при обновлении точки');
    }
  };

  const handleDeletePoint = async (pointId: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту точку?')) return;

    try {
      const response = await fetch(`/api/partner/points/delete?id=${pointId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchPoints(); // Обновляем список
      } else {
        const error = await response.json();
        alert(`Ошибка: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting point:', error);
      alert('Ошибка при удалении точки');
    }
  };

  const toggleCredentials = (pointId: string) => {
    setShowCredentials(prev => ({
      ...prev,
      [pointId]: !prev[pointId]
    }));
  };

  const totalPoints = points.length;
  const activePoints = points.filter(p => p.isActive).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад к дашборду
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Управление точками</h1>
          <p className="text-gray-600 mt-2">Создание и управление точками вашего бизнеса</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Всего точек</p>
                <p className="text-2xl font-bold text-gray-900">{totalPoints}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Building2 className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Активных</p>
                <p className="text-2xl font-bold text-gray-900">{activePoints}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Всего сотрудников</p>
                <p className="text-2xl font-bold text-gray-900">
                  {points.reduce((sum, point) => sum + point.userCount, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Add Point Button */}
        <div className="mb-6">
          <Button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Добавить точку
          </Button>
        </div>

        {/* Points List */}
        <div className="bg-white rounded-lg shadow">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Загрузка точек...</p>
            </div>
          ) : points.length === 0 ? (
            <div className="p-8 text-center">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">У вас пока нет точек</p>
              <p className="text-sm text-gray-500 mt-1">Создайте первую точку, чтобы начать работу</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {points.map((point) => (
                <div key={point.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Building2 className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{point.name}</h3>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            point.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {point.isActive ? 'Активна' : 'Неактивна'}
                          </span>
                          <span className="text-sm text-gray-500">
                            {point.userCount} сотрудников
                          </span>
                          <span className="text-sm text-gray-500">
                            Создана: {new Date(point.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {credentials[point.id] && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleCredentials(point.id)}
                        >
                          {showCredentials[point.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          {showCredentials[point.id] ? 'Скрыть' : 'Показать'} данные входа
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditPoint(point)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeletePoint(point.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Point Details */}
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {point.address && (
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-2" />
                        {point.address}
                      </div>
                    )}
                    {point.phone && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="w-4 h-4 mr-2" />
                        {point.phone}
                      </div>
                    )}
                    {point.email && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="w-4 h-4 mr-2" />
                        {point.email}
                      </div>
                    )}
                  </div>

                  {/* Credentials Display */}
                  {showCredentials[point.id] && credentials[point.id] && (
                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h4 className="text-sm font-medium text-yellow-800 mb-2">Данные для входа в точку:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-medium text-yellow-700">Логин:</label>
                          <p className="text-sm font-mono bg-white px-2 py-1 rounded border">{credentials[point.id].login}</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-yellow-700">Пароль:</label>
                          <p className="text-sm font-mono bg-white px-2 py-1 rounded border">{credentials[point.id].password}</p>
                        </div>
                      </div>
                      <p className="text-xs text-yellow-600 mt-2">
                        Сохраните эти данные! Они понадобятся для входа в систему от имени точки.
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Point Modal */}
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Добавить новую точку</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Название точки *
                </label>
                <Input
                  value={newPoint.name}
                  onChange={(e) => setNewPoint({...newPoint, name: e.target.value})}
                  placeholder="Например: Ресторан 'Центральный'"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Адрес
                </label>
                <Input
                  value={newPoint.address}
                  onChange={(e) => setNewPoint({...newPoint, address: e.target.value})}
                  placeholder="ул. Ленина, 15"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Телефон
                </label>
                <Input
                  value={newPoint.phone}
                  onChange={(e) => setNewPoint({...newPoint, phone: e.target.value})}
                  placeholder="+7 (999) 123-45-67"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <Input
                  value={newPoint.email}
                  onChange={(e) => setNewPoint({...newPoint, email: e.target.value})}
                  placeholder="restaurant@example.com"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                Отмена
              </Button>
              <Button onClick={handleAddPoint}>
                Создать точку
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Point Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Редактировать точку</DialogTitle>
            </DialogHeader>
            {editingPoint && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Название точки *
                  </label>
                  <Input
                    value={editingPoint.name}
                    onChange={(e) => setEditingPoint({...editingPoint, name: e.target.value})}
                    placeholder="Например: Ресторан 'Центральный'"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Адрес
                  </label>
                  <Input
                    value={editingPoint.address || ''}
                    onChange={(e) => setEditingPoint({...editingPoint, address: e.target.value})}
                    placeholder="ул. Ленина, 15"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Телефон
                  </label>
                  <Input
                    value={editingPoint.phone || ''}
                    onChange={(e) => setEditingPoint({...editingPoint, phone: e.target.value})}
                    placeholder="+7 (999) 123-45-67"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <Input
                    value={editingPoint.email || ''}
                    onChange={(e) => setEditingPoint({...editingPoint, email: e.target.value})}
                    placeholder="restaurant@example.com"
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Отмена
              </Button>
              <Button onClick={handleUpdatePoint}>
                Сохранить изменения
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}