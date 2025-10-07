'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Calendar, DollarSign, Clock, User, Search, TrendingUp, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Employee {
  id: string;
  name: string;
  position: string;
  department: string;
  hourlyRate: number;
  totalHours: number;
  salary: number;
  status: 'active' | 'inactive' | 'on_leave';
  lastPayment?: Date;
  nextPayment?: Date;
}

interface Schedule {
  id: string;
  employeeId: string;
  date: Date;
  startTime: string;
  endTime: string;
  breakDuration: number;
  totalHours: number;
  status: 'scheduled' | 'completed' | 'absent' | 'overtime';
  notes?: string;
}

export default function ScheduleSalaryPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [activeTab, setActiveTab] = useState<'employees' | 'schedule' | 'payroll'>('employees');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');

  useEffect(() => {
    // Загружаем данные из localStorage
    const savedEmployees = localStorage.getItem('employees');
    const savedSchedules = localStorage.getItem('schedules');
    
    if (savedEmployees) {
      try {
        const parsedEmployees: Employee[] = JSON.parse(savedEmployees).map((emp: any) => ({
          ...emp,
          lastPayment: emp.lastPayment ? new Date(emp.lastPayment) : undefined,
          nextPayment: emp.nextPayment ? new Date(emp.nextPayment) : undefined,
        }));
        setEmployees(parsedEmployees);
      } catch (error) {
        console.error('Ошибка при загрузке сотрудников:', error);
      }
    }

    if (savedSchedules) {
      try {
        const parsedSchedules: Schedule[] = JSON.parse(savedSchedules).map((schedule: any) => ({
          ...schedule,
          date: new Date(schedule.date),
        }));
        setSchedules(parsedSchedules);
      } catch (error) {
        console.error('Ошибка при загрузке расписания:', error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('employees', JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem('schedules', JSON.stringify(schedules));
  }, [schedules]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'on_leave': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Активен';
      case 'inactive': return 'Неактивен';
      case 'on_leave': return 'В отпуске';
      default: return status;
    }
  };

  const _getScheduleStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'absent': return 'bg-red-100 text-red-800';
      case 'overtime': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const _getScheduleStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Запланировано';
      case 'completed': return 'Выполнено';
      case 'absent': return 'Отсутствовал';
      case 'overtime': return 'Сверхурочно';
      default: return status;
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emp.position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = filterDepartment === 'all' || emp.department === filterDepartment;
    
    return matchesSearch && matchesDepartment;
  });

  const totalSalary = employees.reduce((sum, emp) => sum + emp.salary, 0);
  const activeEmployees = employees.filter(emp => emp.status === 'active').length;
  const totalHours = employees.reduce((sum, emp) => sum + emp.totalHours, 0);
  const averageSalary = employees.length > 0 ? totalSalary / employees.length : 0;

  const departments = [...new Set(employees.map(emp => emp.department))];

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
            График и зарплата
          </h1>
          <p className="text-gray-600">
            Управление расписанием сотрудников и расчет заработной платы
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Активных сотрудников</p>
                <p className="text-2xl font-bold text-blue-600">{activeEmployees}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Общая зарплата</p>
                <p className="text-2xl font-bold text-green-600">
                  {totalSalary.toLocaleString('ru-RU')} ₽
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Общее время</p>
                <p className="text-2xl font-bold text-orange-600">{totalHours}ч</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Средняя зарплата</p>
                <p className="text-2xl font-bold text-purple-600">
                  {Math.round(averageSalary).toLocaleString('ru-RU')} ₽
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('employees')}
              className={`${
                activeTab === 'employees'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              Сотрудники
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className={`${
                activeTab === 'schedule'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              Расписание
            </button>
            <button
              onClick={() => setActiveTab('payroll')}
              className={`${
                activeTab === 'payroll'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              Зарплата
            </button>
          </nav>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Поиск по имени или должности..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-2 border rounded-md w-full"
            />
          </div>
          {activeTab === 'employees' && (
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="border rounded-md p-2 pr-8"
            >
              <option value="all">Все отделы</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          )}
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-5 h-5 mr-2" />
            {activeTab === 'employees' ? 'Добавить сотрудника' : 
             activeTab === 'schedule' ? 'Добавить смену' : 
             'Создать ведомость'}
          </Button>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'employees' && (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            {filteredEmployees.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <User className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>Нет сотрудников</p>
                <p className="text-sm text-gray-400 mt-1">
                  Добавьте первого сотрудника
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
                        Отдел
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ставка
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Часы
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Зарплата
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Статус
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredEmployees.map((employee) => (
                      <tr key={employee.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                <User className="h-6 w-6 text-gray-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{employee.position}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{employee.department}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{employee.hourlyRate} ₽/ч</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{employee.totalHours}ч</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {employee.salary.toLocaleString('ru-RU')} ₽
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(employee.status)}`}>
                            {getStatusLabel(employee.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="text-center text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>Расписание смен</p>
              <p className="text-sm text-gray-400 mt-1">
                Функция в разработке
              </p>
            </div>
          </div>
        )}

        {activeTab === 'payroll' && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="text-center text-gray-500">
              <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>Расчет заработной платы</p>
              <p className="text-sm text-gray-400 mt-1">
                Функция в разработке
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
