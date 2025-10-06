'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, User, Calendar, AlertTriangle, CheckCircle, Clock, Search, FileText, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface MedicalBook {
  id: string;
  employeeName: string;
  position: string;
  bookNumber: string;
  issueDate: Date;
  expiryDate: Date;
  status: 'valid' | 'expiring' | 'expired' | 'missing';
  lastCheckup?: Date;
  nextCheckup?: Date;
  notes?: string;
}

export default function MedicalBooksPage() {
  const [books, setBooks] = useState<MedicalBook[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'valid' | 'expiring' | 'expired' | 'missing'>('all');

  useEffect(() => {
    // Загружаем медицинские книжки из localStorage
    const savedBooks = localStorage.getItem('medical-books');
    if (savedBooks) {
      try {
        const parsedBooks: MedicalBook[] = JSON.parse(savedBooks).map((book: any) => ({
          ...book,
          issueDate: new Date(book.issueDate),
          expiryDate: new Date(book.expiryDate),
          lastCheckup: book.lastCheckup ? new Date(book.lastCheckup) : undefined,
          nextCheckup: book.nextCheckup ? new Date(book.nextCheckup) : undefined,
        }));
        setBooks(parsedBooks);
      } catch (error) {
        console.error('Ошибка при загрузке медицинских книжек:', error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('medical-books', JSON.stringify(books));
  }, [books]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid': return 'bg-green-100 text-green-800';
      case 'expiring': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'missing': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'valid': return 'Действительна';
      case 'expiring': return 'Истекает';
      case 'expired': return 'Просрочена';
      case 'missing': return 'Отсутствует';
      default: return status;
    }
  };

  const getDaysUntilExpiry = (expiryDate: Date) => {
    const now = new Date();
    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         book.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         book.bookNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || book.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const validCount = books.filter(b => b.status === 'valid').length;
  const expiringCount = books.filter(b => b.status === 'expiring').length;
  const expiredCount = books.filter(b => b.status === 'expired').length;
  const missingCount = books.filter(b => b.status === 'missing').length;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-2"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Назад к панели управления
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Медицинские книжки
          </h1>
          <p className="text-gray-600">
            Управление медицинскими книжками сотрудников
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Действительны</p>
                <p className="text-2xl font-bold text-green-600">{validCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Истекают</p>
                <p className="text-2xl font-bold text-yellow-600">{expiringCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Просрочены</p>
                <p className="text-2xl font-bold text-red-600">{expiredCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="w-8 h-8 text-gray-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Отсутствуют</p>
                <p className="text-2xl font-bold text-gray-600">{missingCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Поиск по имени, должности или номеру книжки..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-2 border rounded-md w-full"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="border rounded-md p-2 pr-8"
          >
            <option value="all">Все статусы</option>
            <option value="valid">Действительны</option>
            <option value="expiring">Истекают</option>
            <option value="expired">Просрочены</option>
            <option value="missing">Отсутствуют</option>
          </select>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-5 h-5 mr-2" />
            Добавить книжку
          </Button>
        </div>

        {/* Books Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {filteredBooks.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <Stethoscope className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>Нет медицинских книжек</p>
              <p className="text-sm text-gray-400 mt-1">
                Добавьте первую медицинскую книжку
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Сотрудник
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Должность
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Номер книжки
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Дата выдачи
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Срок действия
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Статус
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Последний осмотр
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredBooks.map((book) => {
                    const daysUntilExpiry = getDaysUntilExpiry(book.expiryDate);
                    return (
                      <tr key={book.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                <User className="h-6 w-6 text-gray-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{book.employeeName}</div>
                              {book.notes && (
                                <div className="text-sm text-gray-500">{book.notes}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{book.position}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{book.bookNumber}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {book.issueDate.toLocaleDateString('ru-RU')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {book.expiryDate.toLocaleDateString('ru-RU')}
                          </div>
                          {daysUntilExpiry > 0 && daysUntilExpiry <= 30 && (
                            <div className="text-xs text-yellow-600">
                              Осталось {daysUntilExpiry} дн.
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(book.status)}`}>
                            {getStatusLabel(book.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {book.lastCheckup ? (
                              <div>
                                <div>{book.lastCheckup.toLocaleDateString('ru-RU')}</div>
                                {book.nextCheckup && (
                                  <div className="text-xs text-gray-400">
                                    Следующий: {book.nextCheckup.toLocaleDateString('ru-RU')}
                                  </div>
                                )}
                              </div>
                            ) : (
                              'Не указано'
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
