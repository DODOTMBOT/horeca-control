"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { assignUserRoleAction } from "@/actions/owner/users";

type UserDTO = {
  id: string;
  name?: string | null;
  email: string;
  roles: string[];
  tenant?: string | null;
  isPlatformOwner?: boolean;
};

type AssignRoleDialogProps = {
  user: UserDTO;
  isOpen: boolean;
  onClose: () => void;
  currentTenantId: string;
};

export default function AssignRoleDialog({ user, isOpen, onClose, currentTenantId }: AssignRoleDialogProps) {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<string>(user?.roles?.[0] || "Owner");
  const [isLoading, setIsLoading] = useState(false);

  const handleAssignRole = async () => {
    if (!selectedRole || selectedRole === user?.roles?.[0]) return;
    
    setIsLoading(true);
    try {
      await assignUserRoleAction({
        userId: user.id,
        tenantId: currentTenantId,
        roleName: selectedRole
      });
      
      toast.success("Роль успешно назначена");
      router.refresh();
      onClose();
    } catch (error) {
      console.error("Error assigning role:", error);
      toast.error(error instanceof Error ? error.message : "Ошибка при назначении роли");
    } finally {
      setIsLoading(false);
    }
  };

  const availableRoles = ["Owner", "Partner", "Point", "Manager"];

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/20 p-4">
      <motion.div 
        className="w-full max-w-md rounded-2xl border bg-white p-4 shadow-lg"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <h2 className="mb-3 text-lg font-semibold">Назначить роль пользователю</h2>
        
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <img 
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.email)}&background=EEE&color=111`}
              className="h-8 w-8 rounded-full" 
              alt="" 
            />
            <div>
              <div className="font-medium">{user.name || "—"}</div>
              <div className="text-sm text-gray-600">{user.email}</div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Текущие роли:
            </label>
            <div className="flex flex-wrap gap-2">
              {(user?.roles || []).map(role => (
                <span 
                  key={role}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    role === "Owner" ? "bg-red-600 text-white" :
                    role === "Partner" ? "bg-blue-600 text-white" :
                    role === "Point" ? "bg-green-600 text-white" :
                    "bg-neutral-900 text-white"
                  }`}
                >
                  {role}
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Новая роль:
            </label>
            <select 
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full rounded-xl border px-3 py-2 focus:border-neutral-400 transition-all duration-300"
            >
              {availableRoles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <button 
            onClick={onClose}
            className="rounded-lg px-3 py-2 hover:bg-neutral-100 transition-all duration-300"
          >
            Отмена
          </button>
          <button 
            onClick={handleAssignRole}
            disabled={isLoading || selectedRole === user?.roles?.[0]}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-white hover:shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Назначение..." : "Назначить роль"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}