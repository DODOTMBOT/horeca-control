"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { motion } from "framer-motion";
import { AppRole } from "@prisma/client";
import { MENU } from "@/lib/menu.config";

type RoleDTO = {
  id: string;
  name: string;
  permissions: any;
  inheritsFrom?: string | null;
  tenantId?: string | null;
  createdAt: string;
  updatedAt: string;
  userCount: number;
  users: Array<{ id: string; email: string; name?: string | null }>;
};

async function fetchRoles(): Promise<RoleDTO[]> {
  const res = await fetch("/api/owner/roles/list", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load roles");
  return res.json();
}

type PageAccessItem = {
  slug: string;
  label: string;
  system?: boolean;
  allowed: boolean;
};

export default function RolesTable() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleDTO | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingAccess, setEditingAccess] = useState<{ role: AppRole; tenantId: string } | null>(null);
  const [accessItems, setAccessItems] = useState<PageAccessItem[] | null>(null);
  
  const { data, isLoading } = useQuery({ 
    queryKey: ["roles"], 
    queryFn: fetchRoles 
  });

  const createMutation = useMutation({
    mutationFn: async (payload: { name: string; permissions?: any; inheritsFrom?: string; tenantId?: string }) => {
      const res = await fetch("/api/owner/roles/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Create failed");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roles"] }),
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: { id: string; name?: string; permissions?: any; inheritsFrom?: string; tenantId?: string }) => {
      const res = await fetch("/api/owner/roles/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Update failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roles"] });
      setEditingRole(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/owner/roles/delete?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roles"] }),
  });

  const filteredRoles = (data ?? []).filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const baseRoles = ["Owner", "Partner", "Point"];

  // Функции для работы с доступами
  async function openAccessEditor(role: AppRole, tenantId: string) {
    try {
      const url = `/api/roles/pages?tenantId=${tenantId}&role=${role}`;
      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json();
      setAccessItems(data.items);
      setEditingAccess({ role, tenantId });
    } catch (error) {
      console.error("Failed to load page access:", error);
    }
  }

  async function saveAccess() {
    if (!editingAccess || !accessItems) return;
    
    try {
      const res = await fetch(`/api/roles/pages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          tenantId: editingAccess.tenantId, 
          role: editingAccess.role, 
          updates: accessItems.map(i => ({ slug: i.slug, allowed: i.allowed })) 
        }),
      });
      if (res.ok) {
        setEditingAccess(null);
        setAccessItems(null);
      }
    } catch (error) {
      console.error("Failed to save page access:", error);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Управление ролями</h2>
          <p className="text-gray-600">Создавайте и настраивайте роли для пользователей</p>
        </div>
        <div className="flex items-center gap-3">
          <input 
            className="h-10 w-64 rounded-xl border px-3 outline-none ring-0 focus:border-neutral-400 transition-all duration-300"
            placeholder="Поиск по названию роли"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button 
            onClick={() => setShowCreate(true)}
            className="h-10 rounded-xl bg-neutral-900 px-4 text-white transition-all hover:shadow-md hover:-translate-y-[1px] duration-300 ease-out"
          >
            Создать роль
          </button>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
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
                  <th className="px-4 py-3">Название</th>
                  <th className="px-4 py-3">Пользователей</th>
                  <th className="px-4 py-3">Наследует от</th>
                  <th className="px-4 py-3">Создана</th>
                  <th className="px-4 py-3 w-40">Действия</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoles.map((role, idx) => (
                  <motion.tr 
                    key={role.id} 
                    className="border-t hover:bg-neutral-50 transition-colors"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <td className="px-4 py-3">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span 
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            role.name === "Owner" ? "bg-red-600 text-white" :
                            role.name === "Partner" ? "bg-blue-600 text-white" :
                            role.name === "Point" ? "bg-green-600 text-white" :
                            "bg-neutral-900 text-white"
                          }`}
                        >
                          {role.name}
                        </span>
                        {baseRoles.includes(role.name) && (
                          <span className="text-xs text-gray-500">(Системная)</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium">{role.userCount}</span>
                      {role.userCount > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          {role.users.slice(0, 2).map(u => u.email).join(", ")}
                          {role.users.length > 2 && ` и еще ${role.users.length - 2}`}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">
                        {role.inheritsFrom || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">
                        {new Date(role.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setEditingRole(role)}
                          className="rounded-lg border px-3 py-1.5 hover:bg-neutral-100 transition-all duration-300"
                        >
                          Изменить
                        </button>
                        <button 
                          onClick={() => {
                            // Получаем tenantId из роли или используем дефолтный
                            const tenantId = role.tenantId || "default-tenant";
                            const appRole = role.name.toUpperCase() as AppRole;
                            openAccessEditor(appRole, tenantId);
                          }}
                          className="rounded-lg border px-3 py-1.5 hover:bg-blue-50 hover:border-blue-300 transition-all duration-300"
                        >
                          Доступы
                        </button>
                        {!baseRoles.includes(role.name) && (
                          <button 
                            onClick={() => {
                              if (confirm(`Удалить роль "${role.name}"?`)) {
                                deleteMutation.mutate(role.id);
                              }
                            }}
                            disabled={role.userCount > 0}
                            className="rounded-lg border px-3 py-1.5 hover:bg-red-50 hover:border-red-300 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Удалить
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
                {filteredRoles.length === 0 && (
                  <tr>
                    <td className="px-4 py-6 text-center text-neutral-500" colSpan={6}>
                      {searchTerm ? "Роли не найдены" : "Нет ролей"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Модалка создания роли */}
      {showCreate && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/20 p-4">
          <motion.div 
            className="w-full max-w-md rounded-2xl border bg-white p-4 shadow-lg"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="mb-3 text-lg font-semibold">Создать роль</h2>
            <form className="space-y-3" onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget as HTMLFormElement);
              const name = String(fd.get("name") || "");
              const inheritsFrom = String(fd.get("inheritsFrom") || "");
              await createMutation.mutateAsync({ 
                name, 
                inheritsFrom: inheritsFrom || undefined,
                permissions: {}
              });
              setShowCreate(false);
            }}>
              <input 
                name="name" 
                required 
                placeholder="Название роли"
                className="w-full rounded-xl border px-3 py-2 focus:border-neutral-400 transition-all duration-300" 
              />
              <select 
                name="inheritsFrom" 
                className="w-full rounded-xl border px-3 py-2 focus:border-neutral-400 transition-all duration-300"
              >
                <option value="">Не наследует</option>
                <option value="Owner">Owner</option>
                <option value="Partner">Partner</option>
                <option value="Point">Point</option>
              </select>
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

      {/* Модалка редактирования роли */}
      {editingRole && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/20 p-4">
          <motion.div 
            className="w-full max-w-md rounded-2xl border bg-white p-4 shadow-lg"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="mb-3 text-lg font-semibold">Изменить роль</h2>
            <form className="space-y-3" onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget as HTMLFormElement);
              const name = String(fd.get("name") || "");
              const inheritsFrom = String(fd.get("inheritsFrom") || "");
              await updateMutation.mutateAsync({ 
                id: editingRole.id,
                name, 
                inheritsFrom: inheritsFrom || undefined
              });
            }}>
              <input 
                name="name" 
                required 
                defaultValue={editingRole.name}
                placeholder="Название роли"
                className="w-full rounded-xl border px-3 py-2 focus:border-neutral-400 transition-all duration-300" 
              />
              <select 
                name="inheritsFrom" 
                defaultValue={editingRole.inheritsFrom || ""}
                className="w-full rounded-xl border px-3 py-2 focus:border-neutral-400 transition-all duration-300"
              >
                <option value="">Не наследует</option>
                <option value="Owner">Owner</option>
                <option value="Partner">Partner</option>
                <option value="Point">Point</option>
              </select>
              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setEditingRole(null)} 
                  className="rounded-lg px-3 py-2 hover:bg-neutral-100 transition-all duration-300"
                >
                  Отмена
                </button>
                <button 
                  type="submit" 
                  disabled={updateMutation.isPending}
                  className="rounded-lg bg-neutral-900 px-4 py-2 text-white hover:shadow-md transition-all duration-300 disabled:opacity-50"
                >
                  {updateMutation.isPending ? "Сохранение..." : "Сохранить"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Модалка редактирования доступов */}
      {editingAccess && accessItems && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/20 p-4">
          <motion.div 
            className="w-full max-w-2xl rounded-2xl border bg-white p-4 shadow-lg"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Доступы роли {editingAccess.role}</h2>
              <button 
                onClick={() => {
                  setEditingAccess(null);
                  setAccessItems(null);
                }} 
                className="rounded-lg border px-3 py-1.5 hover:bg-neutral-100 transition-all duration-300"
              >
                Закрыть
              </button>
            </div>
            
            <div className="max-h-[60vh] overflow-y-auto space-y-2 mb-4">
              {accessItems.map((item, idx) => (
                <label key={item.slug} className="flex items-center justify-between border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                  <div>
                    <div className="font-medium">{item.label}</div>
                    <div className="text-xs text-gray-500">
                      {item.slug}
                      {item.system && " • системная"}
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={item.allowed}
                    onChange={e => {
                      const v = e.target.checked;
                      setAccessItems(prev => {
                        if (!prev) return prev;
                        const copy = [...prev];
                        // Нельзя выключать системную для OWNER
                        if (editingAccess.role === "OWNER" && item.system && !v) return prev;
                        copy[idx] = { ...copy[idx], allowed: v };
                        return copy;
                      });
                    }}
                    disabled={editingAccess.role === "OWNER" && item.system}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                </label>
              ))}
            </div>
            
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => {
                  setEditingAccess(null);
                  setAccessItems(null);
                }} 
                className="rounded-lg border px-3 py-2 hover:bg-neutral-100 transition-all duration-300"
              >
                Отмена
              </button>
              <button 
                onClick={saveAccess}
                className="rounded-lg bg-neutral-900 px-4 py-2 text-white hover:shadow-md transition-all duration-300"
              >
                Сохранить
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}