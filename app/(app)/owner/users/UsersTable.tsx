"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Search, Save, User, Plus, Settings, Trash2, ChevronLeft, ChevronRight } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
}

interface Role {
  id: string;
  name: string;
}

interface UsersTableProps {
  users: User[];
  roles: Role[];
}

export function UsersTable({ users: initialUsers, roles }: UsersTableProps) {
  const [users, setUsers] = useState(initialUsers || []);
  const [searchTerm, setSearchTerm] = useState("");
  const [userRoles, setUserRoles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const filteredUsers = (users || []).filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRoleChange = (userId: string, roleName: string) => {
    setUserRoles(prev => ({ ...prev, [userId]: roleName }));
  };

  const handleSaveRole = async (userId: string) => {
    const newRole = userRoles[userId];
    if (!newRole) {
      toast.error("Выберите роль");
      return;
    }

    setLoading(prev => ({ ...prev, [userId]: true }));

    try {
      const response = await fetch("/api/owner/users/assign-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          roleName: newRole,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Роль успешно изменена");
        setUsers(prev => 
          prev.map(user => 
            user.id === userId 
              ? { ...user, role: newRole }
              : user
          )
        );
        setUserRoles(prev => {
          const updated = { ...prev };
          delete updated[userId];
          return updated;
        });
      } else {
        toast.error(data.error || "Ошибка при изменении роли");
      }
    } catch (error) {
      console.error("Error assigning role:", error);
      toast.error("Ошибка при изменении роли");
    } finally {
      setLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case "Владелец":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "MANAGER":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "EMPLOYEE":
        return "bg-green-100 text-green-800 border-green-200";
      case "PLATFORM_OWNER":
        return "bg-gray-900 text-white border-gray-700";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Пагинация
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const endIndex = startIndex + usersPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="space-y-6">
      {/* Верхняя панель */}
      <div className="bg-white rounded-xl shadow-md shadow-neutral-200 p-6 border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Управление пользователями</h2>
            <p className="text-gray-500">Просматривайте, редактируйте и назначайте роли сотрудникам</p>
          </div>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:scale-105"
            onClick={() => toast.info("Функция добавления пользователя в разработке")}
          >
            <Plus className="h-4 w-4 mr-2" />
            Добавить пользователя
          </Button>
        </div>

        {/* Поиск и статистика */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Поиск по имени или email"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-300 transition-all duration-300"
            />
          </div>
          <div className="text-sm text-gray-500">
            Всего пользователей: <span className="font-semibold text-gray-900">{filteredUsers.length}</span>
          </div>
        </div>
      </div>

      {/* Таблица пользователей */}
      <div className="bg-white rounded-xl shadow-md shadow-neutral-200 border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50">
                <TableHead className="font-semibold text-gray-700">Пользователь</TableHead>
                <TableHead className="font-semibold text-gray-700">Email</TableHead>
                <TableHead className="font-semibold text-gray-700">Роль</TableHead>
                <TableHead className="font-semibold text-gray-700">Новая роль</TableHead>
                <TableHead className="font-semibold text-gray-700">Дата создания</TableHead>
                <TableHead className="font-semibold text-gray-700">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentUsers.map((user, index) => (
                <TableRow 
                  key={user.id} 
                  className="hover:bg-gray-50/50 transition-all duration-300 ease-in-out hover:shadow-sm group"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">ID: {user.id.slice(-8)}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600">{user.email}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getRoleBadgeStyle(user.role)}`}>
                      {user.role}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={userRoles[user.id] || ""}
                      onValueChange={(value) => handleRoleChange(user.id, value)}
                    >
                      <SelectTrigger className="w-[180px] bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-300 transition-all duration-300">
                        <SelectValue placeholder="Выберите роль" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.name}>
                            <span>{role.name}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString("ru-RU")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSaveRole(user.id)}
                        disabled={!userRoles[user.id] || loading[user.id]}
                        className="hover:bg-blue-50 hover:border-blue-300 transition-all duration-300"
                      >
                        <Save className="h-4 w-4 mr-1" />
                        {loading[user.id] ? "Сохранение..." : "Сохранить"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="hover:bg-gray-50 transition-all duration-300"
                        onClick={() => toast.info("Функция изменения в разработке")}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-all duration-300"
                        onClick={() => toast.info("Функция удаления в разработке")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">Пользователи не найдены</p>
            <p className="text-sm">Попробуйте изменить поисковый запрос</p>
          </div>
        )}
      </div>

      {/* Пагинация */}
      {totalPages > 1 && (
        <div className="bg-white rounded-xl shadow-md shadow-neutral-200 p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Показано {startIndex + 1}-{Math.min(endIndex, filteredUsers.length)} из {filteredUsers.length}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className="hover:bg-gray-50 transition-all duration-300"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                First
              </Button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(page)}
                  className={`transition-all duration-300 ${
                    currentPage === page 
                      ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md" 
                      : "hover:bg-gray-50"
                  }`}
                >
                  {page}
                </Button>
              ))}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                className="hover:bg-gray-50 transition-all duration-300"
              >
                Last
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
