"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { motion } from "framer-motion";
import AssignRoleDialog from "./AssignRoleDialog";
import RolesTable from "../roles/RolesTable";

type UserDTO = { id: string; name?: string | null; email: string; roles: string[]; tenant?: string | null; isPlatformOwner?: boolean };

async function fetchUsers(): Promise<UserDTO[]> {
  const res = await fetch("/api/owner/users/list", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load users");
  return res.json();
}

export default function UsersPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("users");
  const [assignRoleUser, setAssignRoleUser] = useState<UserDTO | null>(null);
  
  const { data, isLoading } = useQuery({ 
    queryKey: ["users"], 
    queryFn: fetchUsers 
  });

  const createMutation = useMutation({
    mutationFn: async (payload: { email: string; name?: string; role: string }) => {
      const res = await fetch("/api/owner/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Create failed");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });

  const filteredUsers = (data ?? []).filter(user =>
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
                onClick={() => setShowCreate(true)}
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

        {/* Таблица пользователей */}
        {activeTab === "users" && (
          <>
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-12 rounded-xl bg-neutral-100 animate-pulse" />
                <div className="h-12 rounded-xl bg-neutral-100 animate-pulse" />
                <div className="h-12 rounded-xl bg-neutral-100 animate-pulse" />
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border">
                <table className="w-full table-fixed bg-white">
                  <thead className="bg-neutral-50 text-left text-sm text-neutral-500">
                    <tr>
                      <th className="px-4 py-3 w-12">#</th>
                      <th className="px-4 py-3">Пользователь</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Роли</th>
                      <th className="px-4 py-3">Tenant</th>
                      <th className="px-4 py-3 w-40">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u, idx) => (
                      <motion.tr 
                        key={u.id} 
                        className="border-t hover:bg-neutral-50 transition-colors"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        <td className="px-4 py-3">{idx + 1}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <img 
                              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || u.email)}&background=EEE&color=111`}
                              className="h-8 w-8 rounded-full" 
                              alt="" 
                            />
                            <div className="font-medium">{u.name || "—"}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">{u.email}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            {u.roles.map(r => (
                              <span 
                                key={r}
                                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                  r === "Owner" ? "bg-red-600 text-white" :
                                  r === "Partner" ? "bg-blue-600 text-white" :
                                  r === "Point" ? "bg-green-600 text-white" :
                                  "bg-neutral-900 text-white"
                                }`}
                              >
                                {r}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-600">
                            {u.tenant || (u.isPlatformOwner ? "Platform Owner" : "—")}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button 
                              onClick={() => setAssignRoleUser(u)}
                              className="rounded-lg border px-3 py-1.5 hover:bg-neutral-100 transition-all duration-300"
                            >
                              Изменить роль
                            </button>
                            <button className="rounded-lg border px-3 py-1.5 hover:bg-red-50 hover:border-red-300 transition-all duration-300">Удалить</button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td className="px-4 py-6 text-center text-neutral-500" colSpan={6}>
                          {searchTerm ? "Пользователи не найдены" : "Нет пользователей"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Таблица ролей */}
        {activeTab === "roles" && (
          <div className="py-4">
            <RolesTable />
          </div>
        )}
      </div>

      {/* Модалка создания */}
      {showCreate && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/20 p-4">
          <motion.div 
            className="w-full max-w-md rounded-2xl border bg-white p-4 shadow-lg"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="mb-3 text-lg font-semibold">Добавить пользователя</h2>
            <form className="space-y-3" onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget as HTMLFormElement);
              const email = String(fd.get("email") || "");
              const name = String(fd.get("name") || "");
              const role = String(fd.get("role") || "Point");
              const tenantId = String(fd.get("tenantId") || "");
              await createMutation.mutateAsync({ email, name, role, tenantId: tenantId || undefined });
              setShowCreate(false);
            }}>
              <input 
                name="email" 
                required 
                placeholder="Email"
                className="w-full rounded-xl border px-3 py-2 focus:border-neutral-400 transition-all duration-300" 
              />
              <input 
                name="name" 
                placeholder="Имя"
                className="w-full rounded-xl border px-3 py-2 focus:border-neutral-400 transition-all duration-300" 
              />
              <select 
                name="role" 
                className="w-full rounded-xl border px-3 py-2 focus:border-neutral-400 transition-all duration-300"
              >
                <option value="Point">Point</option>
                <option value="Partner">Partner</option>
                <option value="Owner">Owner</option>
              </select>
              <input 
                name="tenantId" 
                placeholder="Tenant ID (опционально)"
                className="w-full rounded-xl border px-3 py-2 focus:border-neutral-400 transition-all duration-300" 
              />
              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowCreate(false)} 
                  className="rounded-lg px-3 py-2 hover:bg-neutral-100 transition-all duration-300"
                >
                  Отмена
                </button>
                <button 
                  type="submit" 
                  disabled={createMutation.isPending}
                  className="rounded-lg bg-neutral-900 px-4 py-2 text-white hover:shadow-md transition-all duration-300 disabled:opacity-50"
                >
                  {createMutation.isPending ? "Создание..." : "Создать"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Диалог назначения роли */}
      {assignRoleUser && (
        <AssignRoleDialog
          user={assignRoleUser}
          isOpen={true}
          onClose={() => setAssignRoleUser(null)}
        />
      )}
        </section>
      </div>
    </div>
  );
}