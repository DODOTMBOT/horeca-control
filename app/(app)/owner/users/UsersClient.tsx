"use client";
import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import AssignRoleDialog from "./AssignRoleDialog";
import RolesTable from "../roles/RolesTable";

type UserDTO = { 
  id: string; 
  name?: string | null; 
  email: string; 
  roles: string[]; 
  tenant?: string | null; 
  isPlatformOwner?: boolean 
};

type UsersClientProps = {
  initialUsers: UserDTO[];
  currentTenantId: string;
};

export default function UsersClient({ initialUsers, currentTenantId }: UsersClientProps) {
  const [_showCreate, _setShowCreate] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("users");
  const [assignRoleUser, setAssignRoleUser] = useState<UserDTO | null>(null);

  const filteredUsers = initialUsers.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <section className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Управление пользователями</h1>
              <p className="text-gray-600">Просматривайте, редактируйте и назначайте роли</p>
            </div>
            <div className="flex items-center gap-3">
              <input 
                className="h-10 w-64 rounded-xl border px-3 outline-none ring-0 focus:border-neutral-400 transition-all duration-300"
                placeholder="Поиск по имени или email"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button 
                onClick={() => _setShowCreate(true)}
                className="h-10 rounded-xl bg-neutral-900 px-4 text-white transition-all hover:shadow-md hover:-translate-y-[1px] duration-300 ease-out"
              >
                Добавить пользователя
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="mb-4 flex gap-2">
              <button 
                onClick={() => setActiveTab("users")}
                className={`rounded-lg px-3 py-1.5 transition-all duration-300 ${
                  activeTab === "users" 
                    ? "bg-neutral-900 text-white" 
                    : "text-neutral-600 hover:bg-neutral-100"
                }`}
              >
                Пользователи
              </button>
              <button 
                onClick={() => setActiveTab("roles")}
                className={`rounded-lg px-3 py-1.5 transition-all duration-300 ${
                  activeTab === "roles" 
                    ? "bg-neutral-900 text-white" 
                    : "text-neutral-600 hover:bg-neutral-100"
                }`}
              >
                Роли
              </button>
            </div>

            {activeTab === "users" && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">#</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Пользователь</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Email</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Роли</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Tenant</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                          Пользователи не найдены
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u, idx) => (
                        <motion.tr 
                          key={u.id} 
                          className="border-t hover:bg-gray-50 transition-colors"
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                        >
                          <td className="px-4 py-3">{idx + 1}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <Image 
                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || u.email)}&background=EEE&color=111`}
                                width={32}
                                height={32}
                                className="rounded-full" 
                                alt="User avatar" 
                              />
                              <div>
                                <div className="font-medium">{u.name || "—"}</div>
                                {u.isPlatformOwner && (
                                  <div className="text-xs text-purple-600">Platform Owner</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">{u.email}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-2">
                              {u.roles.map(r => (
                                <span 
                                  key={r}
                                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                    r === "PLATFORM_OWNER" ? "bg-purple-600 text-white" :
                                    r === "ORGANIZATION_OWNER" ? "bg-red-600 text-white" :
                                    r === "MANAGER" ? "bg-blue-600 text-white" :
                                    r === "POINT_MANAGER" ? "bg-green-600 text-white" :
                                    r === "EMPLOYEE" ? "bg-gray-600 text-white" :
                                    "bg-neutral-900 text-white"
                                  }`}
                                >
                                  {r}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3">{u.tenant || "—"}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button 
                                onClick={() => setAssignRoleUser(u)}
                                className="rounded-lg border px-3 py-1.5 hover:bg-neutral-100 transition-all duration-300"
                              >
                                Изменить роль
                              </button>
                              <button 
                                onClick={() => {
                                  if (confirm("Удалить пользователя?")) {
                                    // TODO: Implement delete
                                  }
                                }}
                                className="rounded-lg border px-3 py-1.5 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all duration-300"
                              >
                                Удалить
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "roles" && <RolesTable />}
          </div>
        </section>
      </div>

      {assignRoleUser && (
        <AssignRoleDialog
          user={assignRoleUser}
          isOpen={true}
          onClose={() => setAssignRoleUser(null)}
          currentTenantId={currentTenantId}
        />
      )}
    </div>
  );
}

