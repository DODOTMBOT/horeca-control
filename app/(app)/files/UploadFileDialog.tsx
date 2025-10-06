"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Upload, X } from "lucide-react";

interface Role {
  id: string;
  name: string;
  partner?: string;
}

interface UploadFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderId?: string | null;
  onSuccess: () => void;
}

export function UploadFileDialog({ 
  open, 
  onOpenChange, 
  folderId, 
  onSuccess 
}: UploadFileDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<Record<string, {
    canRead: boolean;
    canWrite: boolean;
    canDelete: boolean;
  }>>({});
  const [loading, setLoading] = useState(false);
  const [fetchingRoles, setFetchingRoles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      fetchRoles();
    }
  }, [open]);

  const fetchRoles = async () => {
    try {
      setFetchingRoles(true);
      const response = await fetch("/api/files/roles");
      if (response.ok) {
        const data = await response.json();
        setRoles(data);
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
    } finally {
      setFetchingRoles(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!name.trim()) {
        setName(file.name.split('.')[0]);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !name.trim()) return;

    try {
      setLoading(true);
      const accessRoles = Object.entries(selectedRoles).map(([roleId, permissions]) => ({
        roleId,
        ...permissions
      }));

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("metadata", JSON.stringify({
        name: name.trim(),
        description: description.trim() || undefined,
        folderId,
        accessRoles
      }));

      const response = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        onSuccess();
        onOpenChange(false);
        setName("");
        setDescription("");
        setSelectedFile(null);
        setSelectedRoles({});
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        let errorMessage = "Неизвестная ошибка";
        try {
          const error = await response.json();
          console.error("Error uploading file:", error);
          
          if (error.details && Array.isArray(error.details)) {
            // Ошибки валидации Zod
            errorMessage = error.details.map((detail: { path?: string[]; message: string }) => 
              `${detail.path?.join('.') || 'поле'}: ${detail.message}`
            ).join(', ');
          } else if (error.error) {
            errorMessage = error.error;
          } else if (error.message) {
            errorMessage = error.message;
          }
        } catch (parseError) {
          console.error("Failed to parse error response:", parseError);
          errorMessage = `Ошибка сервера (${response.status})`;
        }
        
        alert(`Ошибка загрузки файла: ${errorMessage}`);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert(`Ошибка загрузки файла: ${error instanceof Error ? error.message : "Неизвестная ошибка"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (roleId: string, permission: string, checked: boolean) => {
    setSelectedRoles(prev => ({
      ...prev,
      [roleId]: {
        ...prev[roleId],
        [permission]: checked
      }
    }));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Загрузить документ</DialogTitle>
          <DialogDescription>
            Загрузите новый документ в систему
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file">Файл *</Label>
            {selectedFile ? (
              <div className="flex items-center justify-between p-3 border rounded-md bg-gray-50">
                <div className="flex items-center space-x-2">
                  <Upload className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(selectedFile.size)} • {selectedFile.type}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  Нажмите для выбора файла или перетащите сюда
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Поддерживаются все типы файлов
                </p>
              </div>
            )}
            <Input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              accept="*/*"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Название документа *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Введите название документа"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Описание документа (необязательно)"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Права доступа</Label>
            {fetchingRoles ? (
              <div className="flex items-center justify-center py-4">
                <LoadingSpinner size="sm" />
                <span className="ml-2 text-sm text-gray-500">Загрузка ролей...</span>
              </div>
            ) : (
              <div className="space-y-3 max-h-48 overflow-y-auto border rounded-md p-3">
                {roles.map((role) => (
                  <div key={role.id} className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`role-${role.id}`}
                        checked={!!selectedRoles[role.id]}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedRoles(prev => ({
                              ...prev,
                              [role.id]: {
                                canRead: true,
                                canWrite: false,
                                canDelete: false
                              }
                            }));
                          } else {
                            setSelectedRoles(prev => {
                              const newRoles = { ...prev };
                              delete newRoles[role.id];
                              return newRoles;
                            });
                          }
                        }}
                      />
                      <Label htmlFor={`role-${role.id}`} className="font-medium">
                        {role.name}
                        {role.partner && (
                          <span className="text-sm text-gray-500 ml-1">
                            ({role.partner})
                          </span>
                        )}
                      </Label>
                    </div>
                    
                    {selectedRoles[role.id] && (
                      <div className="ml-6 space-y-1">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`read-${role.id}`}
                            checked={selectedRoles[role.id]?.canRead || false}
                            onCheckedChange={(checked) => 
                              handleRoleChange(role.id, "canRead", !!checked)
                            }
                          />
                          <Label htmlFor={`read-${role.id}`} className="text-sm">
                            Чтение
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`write-${role.id}`}
                            checked={selectedRoles[role.id]?.canWrite || false}
                            onCheckedChange={(checked) => 
                              handleRoleChange(role.id, "canWrite", !!checked)
                            }
                          />
                          <Label htmlFor={`write-${role.id}`} className="text-sm">
                            Редактирование
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`delete-${role.id}`}
                            checked={selectedRoles[role.id]?.canDelete || false}
                            onCheckedChange={(checked) => 
                              handleRoleChange(role.id, "canDelete", !!checked)
                            }
                          />
                          <Label htmlFor={`delete-${role.id}`} className="text-sm">
                            Удаление
                          </Label>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={loading || !selectedFile || !name.trim()}>
              {loading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Загрузка...
                </>
              ) : (
                "Загрузить документ"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
