"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Folder, 
  File, 
  Upload, 
  Plus, 
  Search, 
  ArrowLeft, 
  Download,
  Trash2,
  Edit,
  Move,
  Image as ImageIcon,
  FileText,
  FileSpreadsheet,
  File as FileIcon
} from "lucide-react";
import { FilePreview } from "./FilePreview";

interface FolderItem {
  id: string;
  name: string;
  fileCount: number;
  category: "Customer" | "Teammate";
  createdAt: string;
}

interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  createdAt: string;
  description?: string;
  author?: {
    name: string;
    email: string;
  };
}

interface FileManagerProps {
  initialFolderId?: string;
}

export function FileManager({ initialFolderId }: FileManagerProps) {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(initialFolderId || null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [showFilePreview, setShowFilePreview] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameItem, setRenameItem] = useState<{id: string, name: string, type: 'file' | 'folder'} | null>(null);
  const [newName, setNewName] = useState("");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [moveItem, setMoveItem] = useState<{id: string, name: string, type: 'file' | 'folder'} | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<'name' | 'type' | 'date' | 'size'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterByType, setFilterByType] = useState<string>('all');
  const queryClient = useQueryClient();

  // Загрузка папок
  const { data: folders = [], isLoading: foldersLoading } = useQuery({
    queryKey: ["folders", currentFolderId],
    queryFn: async () => {
      const response = await fetch(`/api/files/folders?parentId=${currentFolderId || ""}`);
      if (!response.ok) throw new Error("Failed to load folders");
      return response.json();
    },
  });

  // Загрузка файлов
  const { data: files = [], isLoading: filesLoading } = useQuery({
    queryKey: ["files", currentFolderId],
    queryFn: async () => {
      const response = await fetch(`/api/files?folderId=${currentFolderId || ""}`);
      if (!response.ok) throw new Error("Failed to load files");
      return response.json();
    },
  });

  // Отладочная информация
  console.log("FileManager render - selectMode:", selectMode, "selectedItems:", Array.from(selectedItems));

  // Создание папки
  const createFolderMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await fetch("/api/files/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, parentId: currentFolderId }),
      });
      if (!response.ok) throw new Error("Failed to create folder");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      toast.success("Папка создана!");
      setNewFolderName("");
      setShowCreateFolder(false);
    },
    onError: (error) => {
      const msg = error instanceof Error ? error.message : String(error);
      toast.error("Ошибка создания папки", { description: msg });
    },
  });

  // Загрузка файла
  const uploadFileMutation = useMutation({
    mutationFn: async ({ file, displayName, description }: { file: File; displayName: string; description?: string }) => {
      const formData = new FormData();
      formData.append("file", file);
      
      // Добавляем metadata как JSON строку
      const metadata = {
        name: file.name,
        displayName,
        description: description || `Загружен ${new Date().toLocaleDateString("ru-RU")}`,
        folderId: currentFolderId || null
      };
      formData.append("metadata", JSON.stringify(metadata));

      const response = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload file");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
      toast.success("Файл загружен!");
    },
    onError: (error) => {
      const msg = error instanceof Error ? error.message : String(error);
      toast.error("Ошибка загрузки файла", { description: msg });
    },
  });

  const handleFolderClick = (folderId: string) => {
    setCurrentFolderId(folderId);
  };

  const handleBackClick = () => {
    setCurrentFolderId(null);
  };

  // Функции для работы с файлами и папками
  const handleDownload = async (fileId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/files/${fileId}/content`);
      if (!response.ok) throw new Error("Failed to download file");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Файл скачан!");
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      toast.error("Ошибка скачивания файла", { description: msg });
    }
  };

  const handleRename = (id: string, name: string, type: 'file' | 'folder') => {
    setRenameItem({ id, name, type });
    setNewName(name);
    setShowRenameModal(true);
  };

  const handleRenameConfirm = async () => {
    if (!renameItem || !newName.trim()) return;

    try {
      const endpoint = renameItem.type === 'folder' 
        ? `/api/files/folders/${renameItem.id}` 
        : `/api/files/${renameItem.id}`;
      
      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      });

      if (!response.ok) throw new Error("Failed to rename");

      queryClient.invalidateQueries({ queryKey: ["folders"] });
      queryClient.invalidateQueries({ queryKey: ["files"] });
      toast.success(`${renameItem.type === 'folder' ? 'Папка' : 'Файл'} переименован!`);
      setShowRenameModal(false);
      setRenameItem(null);
      setNewName("");
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      toast.error("Ошибка переименования", { description: msg });
    }
  };

  const handleDelete = async (id: string, name: string, type: 'file' | 'folder') => {
    if (!confirm(`Вы уверены, что хотите удалить ${type === 'folder' ? 'папку' : 'файл'} "${name}"?`)) return;

    try {
      const endpoint = type === 'folder' 
        ? `/api/files/folders/${id}` 
        : `/api/files/${id}`;
      
      const response = await fetch(endpoint, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error("Failed to delete");

      queryClient.invalidateQueries({ queryKey: ["folders"] });
      queryClient.invalidateQueries({ queryKey: ["files"] });
      toast.success(`${type === 'folder' ? 'Папка' : 'Файл'} удален!`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      toast.error("Ошибка удаления", { description: msg });
    }
  };

  const handleMove = (id: string, name: string, type: 'file' | 'folder') => {
    setMoveItem({ id, name, type });
    setShowMoveModal(true);
    setSelectedFolderId(null);
  };

  const handleMoveConfirm = async () => {
    if (!moveItem || !selectedFolderId) return;

    try {
      const endpoint = moveItem.type === 'folder' 
        ? `/api/files/folders/${moveItem.id}` 
        : `/api/files/${moveItem.id}`;
      
      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          [moveItem.type === 'folder' ? 'parentId' : 'folderId']: selectedFolderId
        }),
      });

      if (!response.ok) throw new Error("Failed to move");

      queryClient.invalidateQueries({ queryKey: ["folders"] });
      queryClient.invalidateQueries({ queryKey: ["files"] });
      toast.success(`${moveItem.type === 'folder' ? 'Папка' : 'Файл'} перемещен!`);
      setShowMoveModal(false);
      setMoveItem(null);
      setSelectedFolderId(null);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      toast.error("Ошибка перемещения", { description: msg });
    }
  };

  // Функции для множественного выбора
  const handleItemSelect = (id: string) => {
    console.log("handleItemSelect called with id:", id, "current selectedItems:", Array.from(selectedItems));
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
      console.log("Removed item:", id);
    } else {
      newSelected.add(id);
      console.log("Added item:", id);
    }
    setSelectedItems(newSelected);
    
    // Включаем режим выбора если выбран хотя бы один элемент
    if (newSelected.size > 0) {
      setSelectMode(true);
      console.log("Select mode enabled, selected items:", Array.from(newSelected));
    } else {
      setSelectMode(false);
      console.log("Select mode disabled");
    }
  };

  // Функция для активации режима выбора
  const handleEnableSelectMode = () => {
    setSelectMode(true);
    console.log("Select mode enabled");
  };

  const handleBulkDelete = async () => {
    console.log("handleBulkDelete called, selectedItems:", Array.from(selectedItems));
    if (selectedItems.size === 0) {
      console.log("No items selected, returning");
      return;
    }
    
    const itemNames = Array.from(selectedItems).map(id => {
      const folder = folders.find((f: any) => f.id === id);
      const file = files.find((f: any) => f.id === id);
      return folder ? folder.name : file ? file.name : 'элемент';
    }).join(', ');
    
    console.log("Items to delete:", itemNames);
    if (!confirm(`Вы уверены, что хотите удалить ${selectedItems.size} элементов: ${itemNames}?`)) {
      console.log("User cancelled deletion");
      return;
    }

    try {
      // Удаляем все выбранные элементы
      const deletePromises = Array.from(selectedItems).map(async (id) => {
        const isFolder = folders.some((f: any) => f.id === id);
        const endpoint = isFolder 
          ? `/api/files/folders/${id}` 
          : `/api/files/${id}`;
        
        const response = await fetch(endpoint, {
          method: 'DELETE',
        });
        
        if (!response.ok) throw new Error(`Failed to delete ${id}`);
        return response;
      });

      await Promise.all(deletePromises);

      queryClient.invalidateQueries({ queryKey: ["folders"] });
      queryClient.invalidateQueries({ queryKey: ["files"] });
      toast.success(`Удалено ${selectedItems.size} элементов!`);
      
      // Очищаем выбор
      setSelectedItems(new Set());
      setSelectMode(false);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      toast.error("Ошибка массового удаления", { description: msg });
    }
  };

  const handleSelectAll = () => {
    const allIds = [...folders.map((f: any) => f.id), ...files.map((f: any) => f.id)];
    setSelectedItems(new Set(allIds));
    setSelectMode(true);
  };

  const handleDeselectAll = () => {
    setSelectedItems(new Set());
    setSelectMode(false);
  };

  const handleFileClick = (file: FileItem) => {
    setSelectedFile(file);
    setShowFilePreview(true);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      // Загружаем все выбранные файлы напрямую
      Array.from(files).forEach(file => {
        const displayName = file.name.split('.')[0]; // Используем имя файла без расширения
        uploadFileMutation.mutate({ 
          file, 
          displayName, 
          description: `Загружен ${new Date().toLocaleDateString("ru-RU")}` 
        });
      });
    }
  };


  const getFileTypeLabel = (type: string, fileName: string) => {
    // Определяем расширение на основе MIME типа
    let extension = '';
    let bgColor = 'bg-gray-200';
    let textColor = 'text-gray-800';
    
    // Отладочная информация
    console.log('File:', fileName, 'MIME type:', type);
    
    // Определяем расширение по MIME типу
    if (type.startsWith("image/")) {
      if (type === "image/png") extension = 'PNG';
      else if (type === "image/jpeg") extension = 'JPG';
      else if (type === "image/gif") extension = 'GIF';
      else if (type === "image/webp") extension = 'WEBP';
      else if (type === "image/svg+xml") extension = 'SVG';
      else extension = 'IMG';
      bgColor = 'bg-blue-200';
      textColor = 'text-blue-800';
    } else if (type === "application/pdf") {
      extension = 'PDF';
      bgColor = 'bg-red-200';
      textColor = 'text-red-800';
    } else if (type.includes("spreadsheet") || type.includes("excel")) {
      extension = 'XLS';
      bgColor = 'bg-green-200';
      textColor = 'text-green-800';
    } else if (type.includes("word") || type.includes("document")) {
      extension = 'DOC';
      bgColor = 'bg-blue-200';
      textColor = 'text-blue-800';
    } else {
      extension = 'FILE';
    }
    
    return (
      <div className={`w-6 h-6 ${bgColor} ${textColor} text-[10px] font-bold rounded flex items-center justify-center border`}>
        {extension}
      </div>
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const filteredFolders = folders.filter((folder: { name: string }) =>
    folder.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredFiles = files.filter((file: { name: string }) =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Функции для сортировки и фильтрации
  const getFileType = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) return 'image';
    if (['pdf'].includes(ext || '')) return 'pdf';
    if (['doc', 'docx'].includes(ext || '')) return 'document';
    if (['xls', 'xlsx'].includes(ext || '')) return 'spreadsheet';
    return 'other';
  };

  const sortItems = (items: any[], sortBy: string, sortOrder: string) => {
    return [...items].sort((a, b) => {
      let aVal, bVal;
      
      switch (sortBy) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'type':
          aVal = getFileType(a.name);
          bVal = getFileType(b.name);
          break;
        case 'date':
          aVal = new Date(a.createdAt).getTime();
          bVal = new Date(b.createdAt).getTime();
          break;
        case 'size':
          aVal = a.size || 0;
          bVal = b.size || 0;
          break;
        default:
          return 0;
      }
      
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const filterByFileType = (items: any[], type: string) => {
    if (type === 'all') return items;
    return items.filter(item => getFileType(item.name) === type);
  };

  // Применяем фильтрацию и сортировку
  const processedFiles = filterByFileType(
    sortItems(filteredFiles, sortBy, sortOrder),
    filterByType
  );

  // Пагинация
  const itemsPerPage = 10;
  const totalPages = Math.ceil(processedFiles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedFiles = processedFiles.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="bg-white rounded-xl shadow-sm border">

      {/* Sorting and Filtering */}
      <div className="px-6 py-4 border-b bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {currentFolderId && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleBackClick}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Назад
              </Button>
            )}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Сортировка:</label>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="name">По имени</option>
                <option value="type">По типу</option>
                <option value="date">По дате</option>
                <option value="size">По размеру</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Тип:</label>
              <select 
                value={filterByType} 
                onChange={(e) => setFilterByType(e.target.value)}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="all">Все</option>
                <option value="image">Изображения</option>
                <option value="pdf">PDF</option>
                <option value="document">Документы</option>
                <option value="spreadsheet">Таблицы</option>
              </select>
            </div>

            {/* Кнопки управления выбором */}
            {selectMode && (
              <div className="flex items-center gap-1">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleSelectAll}
                  className="text-xs px-2 py-1 h-7"
                >
                  Выбрать все
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleDeselectAll}
                  className="text-xs px-2 py-1 h-7"
                >
                  Снять выбор
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={handleBulkDelete}
                  className="text-xs px-2 py-1 h-7 bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700"
                  disabled={selectedItems.size === 0}
                >
                  Удалить ({selectedItems.size})
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setSelectMode(false);
                    setSelectedItems(new Set());
                  }}
                  className="text-xs px-2 py-1 h-7"
                >
                  Отмена
                </Button>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Поиск файлов и папок..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64 text-sm"
              />
            </div>
            
            <Dialog open={showCreateFolder} onOpenChange={setShowCreateFolder}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2" size="sm">
                  <Plus className="w-4 h-4" />
                  Создать папку
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Создать новую папку</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Название папки"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                  />
                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowCreateFolder(false)}
                    >
                      Отмена
                    </Button>
                    <Button
                      onClick={() => createFolderMutation.mutate(newFolderName)}
                      disabled={!newFolderName.trim() || createFolderMutation.isPending}
                    >
                      Создать
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <label className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded cursor-pointer hover:bg-blue-700 transition-colors">
              <Upload className="w-4 h-4" />
              <input
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                multiple
              />
            </label>
          </div>
          
          <div className="text-sm text-gray-600">
            Показано {startIndex + 1}-{Math.min(startIndex + itemsPerPage, processedFiles.length)} из {processedFiles.length}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {foldersLoading || filesLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-3 border rounded">
                <div className="w-6 h-6 bg-gray-200 rounded animate-pulse" />
                <div className="flex-1">
                  <div className="h-3 bg-gray-200 rounded w-1/3 animate-pulse" />
                </div>
                <div className="h-3 bg-gray-200 rounded w-16 animate-pulse" />
                <div className="h-3 bg-gray-200 rounded w-20 animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {/* Заголовок таблицы */}
            <div className="grid grid-cols-12 gap-4 py-2 px-3 text-xs font-medium text-gray-600 border-b">
              <div className="col-span-1 flex items-center">
                <input
                  type="checkbox"
                  checked={selectedItems.size > 0 && selectedItems.size === (filteredFolders.length + processedFiles.length)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      const allIds = [...filteredFolders.map((f: any) => f.id), ...processedFiles.map((f: any) => f.id)];
                      setSelectedItems(new Set(allIds));
                      setSelectMode(true);
                    } else {
                      setSelectedItems(new Set());
                      setSelectMode(false);
                    }
                  }}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
              <div className="col-span-4">Название</div>
              <div className="col-span-2">Размер</div>
              <div className="col-span-2">Дата</div>
              <div className="col-span-3">Действия</div>
            </div>
            
            {/* Папки */}
            {filteredFolders.map((folder: { id: string; name: string; fileCount: number; category: string }) => (
              <div
                key={folder.id}
                className={`grid grid-cols-12 gap-4 items-center py-2 px-3 border rounded hover:bg-gray-50 transition-colors cursor-pointer ${
                  selectMode && selectedItems.has(folder.id) ? 'bg-blue-50 border-blue-300' : ''
                }`}
                onClick={() => {
                  if (selectMode) {
                    handleItemSelect(folder.id);
                  } else {
                    handleFolderClick(folder.id);
                  }
                }}
              >
                <div className="col-span-1 flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedItems.has(folder.id)}
                    onChange={() => {
                      console.log("Folder checkbox clicked:", folder.id);
                      handleItemSelect(folder.id);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-4 flex items-center gap-2">
                  <Folder className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-gray-900 truncate">{folder.name}</span>
                </div>
                <div className="col-span-2 text-xs text-gray-500">
                  {folder.fileCount} файлов
                </div>
                <div className="col-span-2 text-xs text-gray-500">
                  Папка
                </div>
                <div className="col-span-3 flex items-center gap-1">
                  {!selectMode && (
                    <>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRename(folder.id, folder.name, 'folder');
                        }}
                        title="Переименовать"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMove(folder.id, folder.name, 'folder');
                        }}
                        title="Переместить"
                      >
                        <Move className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(folder.id, folder.name, 'folder');
                        }}
                        title="Удалить"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}

            {/* Файлы */}
            {paginatedFiles.map((file: { id: string; name: string; size: number; type: string; url: string; createdAt: string }) => (
              <div
                key={file.id}
                className={`grid grid-cols-12 gap-4 items-center py-2 px-3 border rounded hover:bg-gray-50 transition-colors ${
                  selectMode && selectedItems.has(file.id) ? 'bg-blue-50 border-blue-300' : ''
                }`}
              >
                <div className="col-span-1 flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedItems.has(file.id)}
                    onChange={() => {
                      console.log("File checkbox clicked:", file.id);
                      handleItemSelect(file.id);
                    }}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
                <div 
                  className="col-span-4 flex items-center gap-2 cursor-pointer"
                  onClick={() => {
                    if (selectMode) {
                      handleItemSelect(file.id);
                    } else {
                      handleFileClick(file);
                    }
                  }}
                >
                  {(() => {
                    console.log('Rendering file:', file.name, 'type:', file.type);
                    return getFileTypeLabel(file.type, file.name);
                  })()}
                  <span className="text-sm font-medium text-gray-900 truncate hover:text-blue-600">{file.name}</span>
                </div>
                <div className="col-span-2 text-xs text-gray-500">
                  {formatFileSize(file.size)}
                </div>
                <div className="col-span-2 text-xs text-gray-500">
                  {new Date(file.createdAt).toLocaleDateString("ru-RU")}
                </div>
                <div className="col-span-3 flex items-center gap-1">
                  {!selectMode && (
                    <>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(file.id, file.name);
                        }}
                        title="Скачать"
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRename(file.id, file.name, 'file');
                        }}
                        title="Переименовать"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMove(file.id, file.name, 'file');
                        }}
                        title="Переместить"
                      >
                        <Move className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(file.id, file.name, 'file');
                        }}
                        title="Удалить"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}

            {filteredFolders.length === 0 && filteredFiles.length === 0 && (
              <div className="text-center py-12">
                <Folder className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {currentFolderId ? "Папка пуста" : "Нет файлов и папок"}
                </h3>
                <p className="text-gray-500">
                  {currentFolderId 
                    ? "Загрузите файлы или создайте подпапки"
                    : "Создайте первую папку или загрузите файлы"
                  }
                </p>
              </div>
            )}
          </div>
        )}
        
        {/* Пагинация */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="text-xs"
            >
              ←
            </Button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
              if (pageNum > totalPages) return null;
              
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                  className="text-xs w-8 h-8 p-0"
                >
                  {pageNum}
                </Button>
              );
            })}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="text-xs"
            >
              →
            </Button>
          </div>
        )}
      </div>

      {/* File Preview Modal */}
      {showFilePreview && selectedFile && (
        <FilePreview
          file={selectedFile}
          isOpen={showFilePreview}
          onClose={() => setShowFilePreview(false)}
        />
      )}


      {/* Модальное окно для переименования */}
      <Dialog open={showRenameModal} onOpenChange={setShowRenameModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Переименовать {renameItem?.type === 'folder' ? 'папку' : 'файл'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Новое название:</label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Введите новое название"
                className="mt-1"
                autoFocus
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRenameModal(false);
                  setRenameItem(null);
                  setNewName("");
                }}
              >
                Отмена
              </Button>
              <Button
                onClick={handleRenameConfirm}
                disabled={!newName.trim()}
              >
                Переименовать
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Модальное окно для перемещения */}
      <Dialog open={showMoveModal} onOpenChange={setShowMoveModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Переместить {moveItem?.type === 'folder' ? 'папку' : 'файл'} "{moveItem?.name}"
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Выберите папку назначения:</label>
              <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                <div 
                  className={`p-2 rounded border cursor-pointer hover:bg-gray-50 ${
                    selectedFolderId === null ? 'bg-blue-50 border-blue-300' : 'border-gray-200'
                  }`}
                  onClick={() => setSelectedFolderId(null)}
                >
                  <div className="flex items-center space-x-2">
                    <Folder className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">Корневая папка</span>
                  </div>
                </div>
                {folders.map((folder: any) => (
                  <div 
                    key={folder.id}
                    className={`p-2 rounded border cursor-pointer hover:bg-gray-50 ${
                      selectedFolderId === folder.id ? 'bg-blue-50 border-blue-300' : 'border-gray-200'
                    }`}
                    onClick={() => setSelectedFolderId(folder.id)}
                  >
                    <div className="flex items-center space-x-2">
                      <Folder className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">{folder.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {folder.fileCount} файлов
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowMoveModal(false);
                  setMoveItem(null);
                  setSelectedFolderId(null);
                }}
              >
                Отмена
              </Button>
              <Button
                onClick={handleMoveConfirm}
                disabled={selectedFolderId === undefined}
              >
                Переместить
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}