'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Users, CheckCircle, XCircle, Clock, Sun, Plus, Download, Thermometer, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Employee {
  id: string;
  name: string;
  position: string;
  email: string;
  phone: string;
  hireDate: Date;
  department: string;
  status: 'active' | 'inactive' | 'on_leave';
  notes?: string;
  pointId?: string;
  pointName?: string;
}

interface EmployeeStatus {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  date: string;
  status: 'healthy' | 'sick' | 'vacation' | 'dayoff';
  notes?: string;
  updatedBy: string;
  pointId?: string;
  pointName?: string;
}

interface Equipment {
  id: string;
  type: string;
  zone: string;
  status: 'active' | 'inactive' | 'maintenance';
  description?: string;
  serialNumber?: string;
  tenantId: string;
  pointId?: string;
  createdAt: string;
  updatedAt: string;
}

interface TemperatureRecord {
  id: string;
  equipmentId: string;
  temperature: number;
  date: string;
  time?: string;
  period?: string;
  notes?: string;
  recordedBy?: string;
  tenantId: string;
  pointId?: string;
  createdAt: string;
  updatedAt: string;
  equipment: {
    id: string;
    type: string;
    zone: string;
    status: string;
  };
}

const STATUS_LABELS = {
  healthy: 'Зд',
  sick: 'Болен',
  vacation: 'Отпуск',
  dayoff: 'Вых'
};

const STATUS_COLORS = {
  healthy: 'bg-green-100 text-green-800 border-green-200',
  sick: 'bg-red-100 text-red-800 border-red-200',
  vacation: 'bg-blue-100 text-blue-800 border-blue-200',
  dayoff: 'bg-gray-100 text-gray-800 border-gray-200'
};

export default function HACCPPage() {
  const { data: session, status } = useSession();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeStatuses, setEmployeeStatuses] = useState<EmployeeStatus[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [temperatureRecords, setTemperatureRecords] = useState<TemperatureRecord[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);
  const [isLoadingStatuses, setIsLoadingStatuses] = useState(true);
  const [isLoadingEquipment, setIsLoadingEquipment] = useState(true);
  const [isLoadingTemperatureRecords, setIsLoadingTemperatureRecords] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [searchTerm, setSearchTerm] = useState('');
  const [activeJournal, setActiveJournal] = useState<'health' | 'temperature' | 'glass'>('health');
  const [temperatureInputs, setTemperatureInputs] = useState<{[key: string]: {morning: string, evening: string}}>({});
  
  // Загружаем сотрудников из API
  const fetchEmployees = async () => {
    try {
      setIsLoadingEmployees(true);
      const response = await fetch('/api/employees', { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        const employeesWithDates = data.map((employee: any) => ({
          ...employee,
          hireDate: new Date(employee.hireDate)
        }));
        setEmployees(employeesWithDates);
      } else {
        console.error('Failed to fetch employees');
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  // Загружаем статусы сотрудников для выбранной даты
  const fetchEmployeeStatuses = async (date: Date) => {
    try {
      setIsLoadingStatuses(true);
      const dateStr = date.toISOString().split('T')[0];
      const response = await fetch(`/api/employee-status?date=${dateStr}`, { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        setEmployeeStatuses(data);
      } else {
        console.error('Failed to fetch employee statuses');
      }
      } catch (error) {
      console.error('Error fetching employee statuses:', error);
    } finally {
      setIsLoadingStatuses(false);
    }
  };

  // Загружаем оборудование
  const fetchEquipment = async () => {
    try {
      setIsLoadingEquipment(true);
      const response = await fetch('/api/equipment', { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        setEquipment(data.equipment || []);
      } else {
        console.error('Failed to fetch equipment');
      }
    } catch (error) {
      console.error('Error fetching equipment:', error);
    } finally {
      setIsLoadingEquipment(false);
    }
  };

  // Загружаем температурные записи для выбранной даты
  const fetchTemperatureRecords = async (date: Date) => {
    try {
      setIsLoadingTemperatureRecords(true);
      const dateStr = date.toISOString().split('T')[0];
      const response = await fetch(`/api/temperature-records?date=${dateStr}`, { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        setTemperatureRecords(data.temperatureRecords || []);
        
        // Обновляем состояние полей ввода
        const newInputs: {[key: string]: {morning: string, evening: string}} = {};
        data.temperatureRecords?.forEach((record: TemperatureRecord) => {
          if (!newInputs[record.equipmentId]) {
            newInputs[record.equipmentId] = { morning: '', evening: '' };
          }
          if (record.period === 'morning') {
            newInputs[record.equipmentId].morning = record.temperature.toString();
          } else if (record.period === 'evening') {
            newInputs[record.equipmentId].evening = record.temperature.toString();
          }
        });
        setTemperatureInputs(newInputs);
      } else {
        console.error('Failed to fetch temperature records');
      }
    } catch (error) {
      console.error('Error fetching temperature records:', error);
    } finally {
      setIsLoadingTemperatureRecords(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchEmployees();
      fetchEquipment();
    }
  }, [status, session?.user?.id]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchEmployeeStatuses(selectedDate);
      if (activeJournal === 'temperature') {
        fetchTemperatureRecords(selectedDate);
      }
    }
  }, [status, session?.user?.id, selectedDate, activeJournal]);

  // Обновляем статус сотрудника
  const updateEmployeeStatus = async (employeeId: string, newStatus: 'healthy' | 'sick' | 'vacation' | 'dayoff') => {
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const response = await fetch('/api/employee-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId,
          date: dateStr,
          status: newStatus
        }),
      });

      if (response.ok) {
        // Перезагружаем статусы
        await fetchEmployeeStatuses(selectedDate);
      } else {
        const errorData = await response.json();
        alert(`Ошибка при обновлении статуса: ${errorData.error || 'Неизвестная ошибка'}`);
      }
    } catch (error) {
      console.error('Error updating employee status:', error);
      alert('Произошла ошибка при обновлении статуса');
    }
  };

  // Создаем/обновляем температурную запись
  const createTemperatureRecord = async (equipmentId: string, temperature: number, period: 'morning' | 'evening', notes?: string) => {
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const response = await fetch('/api/temperature-records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          equipmentId,
          temperature,
          date: dateStr,
          period,
          notes
        }),
      });

      if (response.ok) {
        // Перезагружаем температурные записи
        await fetchTemperatureRecords(selectedDate);
      } else {
        const errorData = await response.json();
        alert(`Ошибка при создании записи: ${errorData.error || 'Неизвестная ошибка'}`);
      }
    } catch (error) {
      console.error('Error creating temperature record:', error);
      alert('Произошла ошибка при создании записи');
    }
  };

  // Получаем температурную запись для оборудования на выбранную дату и период
  const getTemperatureRecord = (equipmentId: string, period: 'morning' | 'evening') => {
    return temperatureRecords.find(record => 
      record.equipmentId === equipmentId && 
      record.date === selectedDate.toISOString().split('T')[0] &&
      record.period === period
    );
  };

  // Получаем статус сотрудника для выбранной даты
  const getEmployeeStatus = (employeeId: string): 'healthy' | 'sick' | 'vacation' | 'dayoff' | null => {
    const status = employeeStatuses.find(s => s.employeeId === employeeId);
    return status ? status.status : null;
  };

  // Выбор конкретной даты
  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(event.target.value);
    if (!isNaN(newDate.getTime())) {
      setSelectedDate(newDate);
    }
  };

  // Выбор конечной даты
  const handleEndDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(event.target.value);
    if (!isNaN(newDate.getTime())) {
      setEndDate(newDate);
    }
  };

  // Скачивание Excel файла
  const handleDownloadExcel = async () => {
    try {
      const startDate = new Date(selectedDate);
      const endDateValue = new Date(endDate);
      
      // Проверяем, что конечная дата не раньше начальной
      if (endDateValue < startDate) {
        alert('Конечная дата не может быть раньше начальной даты');
        return;
      }

      const response = await fetch('/api/export/excel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDateValue.toISOString().split('T')[0]
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `journal_${startDate.toISOString().split('T')[0]}_to_${endDateValue.toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Ошибка при скачивании файла');
      }
    } catch (error) {
      console.error('Error downloading Excel:', error);
      alert('Произошла ошибка при скачивании файла');
    }
  };

  const handleDownloadTemperatureExcel = async () => {
    try {
      const startDate = new Date(selectedDate);
      const endDateValue = new Date(endDate);
      
      // Проверяем, что конечная дата не раньше начальной
      if (endDateValue < startDate) {
        alert('Конечная дата не может быть раньше начальной даты');
        return;
      }

      const response = await fetch('/api/export/temperature-excel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDateValue.toISOString().split('T')[0]
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `temperature_journal_${startDate.toISOString().split('T')[0]}_to_${endDateValue.toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Ошибка при скачивании файла');
      }
    } catch (error) {
      console.error('Error downloading temperature Excel:', error);
      alert('Произошла ошибка при скачивании файла');
    }
  };



  // Фильтрация сотрудников
  const filteredEmployees = employees.filter(employee =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Статистика для выбранной даты
  const statusCounts = {
    healthy: 0,
    sick: 0,
    vacation: 0,
    dayoff: 0,
    total: filteredEmployees.length
  };

  filteredEmployees.forEach(employee => {
    const status = getEmployeeStatus(employee.id);
    if (status) {
      statusCounts[status]++;
    }
  });


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
            Журналы ХАССП
          </h1>
          <p className="text-gray-600">
            Управление журналами безопасности пищевых продуктов
          </p>
        </div>

        {/* Journal Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Health Journal Card */}
          <div 
            className={`bg-white rounded-lg shadow-sm border-2 p-6 cursor-pointer transition-all duration-200 hover:shadow-md ${
              activeJournal === 'health' 
                ? 'border-green-500 bg-green-50' 
                : 'border-gray-200 hover:border-green-300'
            }`}
            onClick={() => setActiveJournal('health')}
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Журнал здоровья</h3>
                <p className="text-sm text-gray-600">Отметка статуса сотрудников</p>
              </div>
            </div>
            <p className="text-gray-600 text-sm">
              Контроль состояния здоровья сотрудников, учет больничных листов, отпусков и выходных дней
            </p>
          </div>

          {/* Temperature Journal Card */}
          <div 
            className={`bg-white rounded-lg shadow-sm border-2 p-6 cursor-pointer transition-all duration-200 hover:shadow-md ${
              activeJournal === 'temperature' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-blue-300'
            }`}
            onClick={() => setActiveJournal('temperature')}
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                <Thermometer className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Температурные режимы</h3>
                <p className="text-sm text-gray-600">Контроль температуры</p>
              </div>
            </div>
            <p className="text-gray-600 text-sm">
              Мониторинг температурных режимов холодильного оборудования и складских помещений
            </p>
          </div>

          {/* Glass Journal Card */}
          <div 
            className={`bg-white rounded-lg shadow-sm border-2 p-6 cursor-pointer transition-all duration-200 hover:shadow-md ${
              activeJournal === 'glass' 
                ? 'border-orange-500 bg-orange-50' 
                : 'border-gray-200 hover:border-orange-300'
            }`}
            onClick={() => setActiveJournal('glass')}
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                <Shield className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Учет стекла</h3>
                <p className="text-sm text-gray-600">Контроль целостности</p>
              </div>
            </div>
            <p className="text-gray-600 text-sm">
              Учет и контроль целостности стеклянной посуды, выявление повреждений и замена
            </p>
          </div>
        </div>

        {/* Journal Content */}
        {activeJournal === 'health' && (
          <div>
          
        {/* Навигация по датам и экспорт */}
        <div className="mb-4 bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Выбор даты */}
            <div className="flex items-center space-x-3">
              <div className="text-sm text-gray-600">
                {selectedDate && !isNaN(selectedDate.getTime()) ? selectedDate.toLocaleDateString('ru-RU', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric',
                  weekday: 'long'
                }) : 'Выберите дату'}
              </div>
              <input
                type="date"
                value={selectedDate && !isNaN(selectedDate.getTime()) ? selectedDate.toISOString().split('T')[0] : ''}
                onChange={handleDateChange}
                className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Выбор периода для экспорта */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Период экспорта:</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="date"
                    value={selectedDate && !isNaN(selectedDate.getTime()) ? selectedDate.toISOString().split('T')[0] : ''}
                    onChange={handleDateChange}
                    className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    title="Начальная дата"
                  />
                  <span className="text-sm text-gray-500">—</span>
                  <input
                    type="date"
                    value={endDate && !isNaN(endDate.getTime()) ? endDate.toISOString().split('T')[0] : ''}
                    onChange={handleEndDateChange}
                    className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    title="Конечная дата"
                  />
                </div>
              </div>
              
              <Button
                onClick={handleDownloadExcel}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Скачать Excel</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Employees Status Table */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {isLoadingEmployees || isLoadingStatuses ? (
            <div className="p-6 text-center text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Загрузка данных...</p>
            </div>
          ) : filteredEmployees.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>Нет сотрудников</p>
                <p className="text-sm text-gray-400 mt-1">
                Добавьте сотрудников в разделе "Мои сотрудники"
                </p>
              </div>
            ) : (
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
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
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Статус на {selectedDate && !isNaN(selectedDate.getTime()) ? selectedDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) : 'выбранную дату'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEmployees.map((employee) => {
                    const currentStatus = getEmployeeStatus(employee.id);
                    return (
                      <tr key={employee.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                <Users className="h-6 w-6 text-gray-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                              <div className="text-sm text-gray-500">{employee.email}</div>
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
                          <div className="flex justify-center space-x-2">
                            {(['healthy', 'sick', 'vacation', 'dayoff'] as const).map((status) => (
                              <button
                                key={status}
                                onClick={() => updateEmployeeStatus(employee.id, status)}
                                className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                                  currentStatus === status
                                    ? STATUS_COLORS[status]
                                    : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                                }`}
                              >
                                {STATUS_LABELS[status]}
                              </button>
                            ))}
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

        {/* Statistics */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-500">Здоровые</p>
                <p className="text-2xl font-bold text-green-600">{statusCounts.healthy}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center">
              <XCircle className="w-8 h-8 text-red-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-500">Больные</p>
                <p className="text-2xl font-bold text-red-600">{statusCounts.sick}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center">
              <Sun className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-500">Отпуск</p>
                <p className="text-2xl font-bold text-blue-600">{statusCounts.vacation}</p>
              </div>
            </div>
                          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center">
              <Clock className="w-8 h-8 text-gray-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-500">Выходной</p>
                <p className="text-2xl font-bold text-gray-600">{statusCounts.dayoff}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 bg-white rounded-lg shadow-sm border p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Обозначения статусов:</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="flex items-center">
              <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 border border-green-200 mr-2">
                Зд
              </span>
              <span className="text-sm text-gray-600">Здоров</span>
              </div>
            <div className="flex items-center">
              <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 border border-red-200 mr-2">
                Болен
              </span>
              <span className="text-sm text-gray-600">Болен</span>
                          </div>
            <div className="flex items-center">
              <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 border border-blue-200 mr-2">
                Отпуск
                          </span>
              <span className="text-sm text-gray-600">Отпуск</span>
              </div>
            <div className="flex items-center">
              <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 border border-gray-200 mr-2">
                Вых
                          </span>
              <span className="text-sm text-gray-600">Выходной</span>
              </div>
          </div>
        </div>
          </div>
        )}

        {/* Temperature Journal Content */}
        {activeJournal === 'temperature' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Журнал температурных режимов</h2>
              <p className="text-gray-600 mb-4">Контроль температуры холодильного оборудования</p>
            </div>

            {/* Навигация по датам и экспорт */}
            <div className="mb-4 bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                {/* Выбор даты */}
                <div className="flex items-center space-x-3">
                  <div className="text-sm text-gray-600">
                    {selectedDate && !isNaN(selectedDate.getTime()) ? selectedDate.toLocaleDateString('ru-RU', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric',
                      weekday: 'long'
                    }) : 'Выберите дату'}
                  </div>
                  <input
                    type="date"
                    value={selectedDate && !isNaN(selectedDate.getTime()) ? selectedDate.toISOString().split('T')[0] : ''}
                    onChange={handleDateChange}
                    className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Выбор периода для экспорта */}
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">Период экспорта:</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="date"
                        value={selectedDate && !isNaN(selectedDate.getTime()) ? selectedDate.toISOString().split('T')[0] : ''}
                        onChange={handleDateChange}
                        className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        title="Начальная дата"
                      />
                      <span className="text-sm text-gray-500">—</span>
                      <input
                        type="date"
                        value={endDate && !isNaN(endDate.getTime()) ? endDate.toISOString().split('T')[0] : ''}
                        onChange={handleEndDateChange}
                        className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        title="Конечная дата"
                      />
                    </div>
                  </div>
                  
                  <Button
                    onClick={handleDownloadTemperatureExcel}
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Скачать Excel</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Equipment Temperature Table */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              {isLoadingEquipment || isLoadingTemperatureRecords ? (
                <div className="p-6 text-center text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p>Загрузка оборудования и температурных записей...</p>
                </div>
              ) : equipment.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <Thermometer className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Оборудование не найдено</h3>
                <p className="text-gray-600 mb-4">
                    Добавьте оборудование в разделе "Мое оборудование", чтобы начать ведение температурного журнала.
                  </p>
                  <Link href="/equipment">
                    <Button className="flex items-center gap-2 mx-auto">
                      <Plus className="w-4 h-4" />
                      Перейти к оборудованию
                    </Button>
                  </Link>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Оборудование
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Зона
                      </th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        T утро
                      </th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        T вечер
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {equipment.map((item) => {
                      // eslint-disable-next-line @typescript-eslint/no-unused-vars
                      const morningRecord = getTemperatureRecord(item.id, 'morning');
                      // eslint-disable-next-line @typescript-eslint/no-unused-vars
                      const eveningRecord = getTemperatureRecord(item.id, 'evening');
                      return (
                        <tr key={item.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Thermometer className="w-5 h-5 text-gray-400 mr-2" />
                              <div className="text-sm font-medium text-gray-900">{item.type}</div>
                            </div>
                            <div className="text-sm text-gray-500">{item.description || 'Без описания'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.zone}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <input
                                type="number"
                                step="0.1"
                                placeholder="°C"
                                value={temperatureInputs[item.id]?.morning || ''}
                                onChange={(e) => {
                                  setTemperatureInputs(prev => ({
                                    ...prev,
                                    [item.id]: {
                                      ...prev[item.id],
                                      morning: e.target.value
                                    }
                                  }));
                                }}
                                className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                onBlur={(e) => {
                                  const temperature = parseFloat(e.target.value);
                                  if (!isNaN(temperature)) {
                                    createTemperatureRecord(item.id, temperature, 'morning');
                                  }
                                }}
                              />
                              <span className="text-sm text-gray-500">°C</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <input
                                type="number"
                                step="0.1"
                                placeholder="°C"
                                value={temperatureInputs[item.id]?.evening || ''}
                                onChange={(e) => {
                                  setTemperatureInputs(prev => ({
                                    ...prev,
                                    [item.id]: {
                                      ...prev[item.id],
                                      evening: e.target.value
                                    }
                                  }));
                                }}
                                className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                onBlur={(e) => {
                                  const temperature = parseFloat(e.target.value);
                                  if (!isNaN(temperature)) {
                                    createTemperatureRecord(item.id, temperature, 'evening');
                                  }
                                }}
                              />
                              <span className="text-sm text-gray-500">°C</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Temperature Statistics */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex items-center">
                  <Thermometer className="w-8 h-8 text-blue-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Всего оборудования</p>
                    <p className="text-2xl font-bold text-gray-900">{equipment.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex items-center">
                  <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Записей за день</p>
                    <p className="text-2xl font-bold text-gray-900">{temperatureRecords.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex items-center">
                  <Clock className="w-8 h-8 text-orange-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Последнее обновление</p>
                    <p className="text-sm font-bold text-gray-900">
                      {temperatureRecords.length > 0 
                        ? new Date(temperatureRecords[0].createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
                        : 'Нет записей'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Glass Journal Content */}
        {activeJournal === 'glass' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Журнал учета стекла</h2>
              <p className="text-gray-600 mb-4">Контроль целостности стеклянной посуды</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="text-center py-12">
                <Shield className="w-16 h-16 text-orange-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Учет стекла</h3>
                <p className="text-gray-600 mb-4">
                  Функциональность журнала учета стекла будет добавлена в следующих версиях
                </p>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <p className="text-sm text-orange-800">
                    Здесь будет отображаться учет и контроль целостности стеклянной посуды, 
                    выявление повреждений и планирование замены
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}