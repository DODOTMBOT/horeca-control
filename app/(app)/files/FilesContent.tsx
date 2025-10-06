"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Filter, 
  Plus, 
  Folder, 
  File, 
  Upload
} from "lucide-react";
import { CreateFolderDialog } from "./CreateFolderDialog";
import { UploadFileDialog } from "./UploadFileDialog";
import { FileCard } from "./FileCard";
import { FolderCard } from "./FolderCard";

interface Folder {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  creator: {
    name?: string;
    email: string;
  };
  accessRoles: Array<{
    role: {
      name: string;
    };
    canRead: boolean;
    canWrite: boolean;
    canDelete: boolean;
  }>;
  _count: {
    files: number;
    children: number;
  };
}

interface File {
  id: string;
  name: string;
  originalName: string;
  size: number;
  mimeType: string;
  description?: string;
  uploadedAt: string;
  viewCount: number;
  uploader: {
    name?: string;
    email: string;
  };
  accessRoles: Array<{
    role: {
      name: string;
    };
    canRead: boolean;
    canWrite: boolean;
    canDelete: boolean;
  }>;
}

interface FilesData {
  folders: Folder[];
  files: File[];
  currentFolder?: {
    id: string;
    name: string;
    parent?: {
      id: string;
      name: string;
    };
  };
}

export function FilesContent() {
  const [data, setData] = useState<FilesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showUploadFile, setShowUploadFile] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (currentFolderId) params.append("folderId", currentFolderId);
      if (search) params.append("search", search);

      const response = await fetch(`/api/files?${params}`);
      if (!response.ok) throw new Error("Failed to fetch files");
      
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Error fetching files:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentFolderId, search]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFolderClick = (folderId: string) => {
    setCurrentFolderId(folderId);
  };

  const handleBackClick = () => {
    if (data?.currentFolder?.parent) {
      setCurrentFolderId(data.currentFolder.parent.id);
    } else {
      setCurrentFolderId(null);
    }
  };


  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <div className="h-10 w-80 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-24 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="h-64 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="lg:col-span-3">
            <div className="h-64 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with search and actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Поиск документов..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Фильтры
          </Button>
        </div>
        <Button onClick={() => setShowUploadFile(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Добавить документ
        </Button>
      </div>

      {/* Breadcrumb */}
      {data?.currentFolder && (
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Button variant="ghost" size="sm" onClick={handleBackClick}>
            ← Назад
          </Button>
          <span>/</span>
          <span className="font-medium">{data.currentFolder.name}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Categories sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Категории</h3>
            <div className="space-y-2">
              <div 
                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-gray-50 ${
                  !currentFolderId ? "bg-blue-50 text-blue-700" : ""
                }`}
                onClick={() => setCurrentFolderId(null)}
              >
                <div className="flex items-center space-x-2">
                  <Folder className="h-4 w-4" />
                  <span>Все документы</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {data?.folders.length || 0}
                </Badge>
              </div>
              
              {data?.folders.map((folder) => (
                <div 
                  key={folder.id}
                  className="flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-gray-50"
                  onClick={() => handleFolderClick(folder.id)}
                >
                  <div className="flex items-center space-x-2">
                    <Folder className="h-4 w-4" />
                    <span>{folder.name}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {folder._count.files}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Files and folders content */}
        <div className="lg:col-span-3">
          <div className="space-y-4">
            {/* Folders */}
            {data?.folders && data.folders.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.folders.map((folder) => (
                  <FolderCard
                    key={folder.id}
                    folder={folder}
                    onClick={() => handleFolderClick(folder.id)}
                  />
                ))}
              </div>
            )}

            {/* Files */}
            {data?.files && data.files.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.files.map((file) => (
                  <FileCard
                    key={file.id}
                    file={file}
                    onRefresh={fetchData}
                  />
                ))}
              </div>
            )}

            {/* Empty state */}
            {(!data?.folders || data.folders.length === 0) && 
             (!data?.files || data.files.length === 0) && (
              <div className="text-center py-12">
                <File className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {search ? "Ничего не найдено" : "Нет документов"}
                </h3>
                <p className="text-gray-600 mb-4">
                  {search 
                    ? "Попробуйте изменить поисковый запрос"
                    : "Загрузите первый документ или создайте папку"
                  }
                </p>
                {!search && (
                  <div className="flex justify-center space-x-2">
                    <Button onClick={() => setShowUploadFile(true)}>
                      <Upload className="h-4 w-4 mr-2" />
                      Загрузить файл
                    </Button>
                    <Button variant="outline" onClick={() => setShowCreateFolder(true)}>
                      <Folder className="h-4 w-4 mr-2" />
                      Создать папку
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <CreateFolderDialog
        open={showCreateFolder}
        onOpenChange={setShowCreateFolder}
        parentId={currentFolderId}
        onSuccess={fetchData}
      />
      
      <UploadFileDialog
        open={showUploadFile}
        onOpenChange={setShowUploadFile}
        folderId={currentFolderId}
        onSuccess={fetchData}
      />
    </div>
  );
}
