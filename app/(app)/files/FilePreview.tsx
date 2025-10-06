"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Download, 
  FileText, 
  Image as ImageIcon, 
  File as FileIcon, 
  FileSpreadsheet,
  ExternalLink
} from "lucide-react";

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

interface FilePreviewProps {
  file: FileItem;
  isOpen: boolean;
  onClose: () => void;
}

export function FilePreview({ file, isOpen, onClose }: FilePreviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Сбрасываем состояние при открытии нового файла
  React.useEffect(() => {
    if (isOpen) {
      console.log("FilePreview opened for file:", file.name, "Type:", file.type);
      setIsLoading(true);
      setError(null);
      
      // Простая задержка для показа лоадера
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, file.id, file.name, file.type]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileType = (type: string) => {
    if (type.startsWith("image/")) return "Изображение";
    if (type === "application/pdf") return "PDF документ";
    if (type.includes("spreadsheet") || type.includes("excel")) return "Таблица";
    if (type.includes("word") || type.includes("document")) return "Текстовый документ";
    return "Файл";
  };

  const renderFileContent = () => {
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center w-full h-full text-center p-8">
          <FileText className="w-16 h-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Не удалось загрузить файл</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button onClick={() => window.open(`/api/files/${file.id}/content`, '_blank')} className="flex items-center gap-2">
            <ExternalLink className="w-4 h-4" />
            Открыть в новой вкладке
          </Button>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="flex items-center justify-center w-full h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    // Изображения
    if (file.type.startsWith("image/")) {
      return (
        <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="relative w-full h-full">
            <img
              src={`/api/files/${file.id}/preview`}
              alt={file.name}
              className="w-full h-full object-contain"
              onLoad={() => {
                console.log("Image loaded successfully");
                setIsLoading(false);
              }}
              onError={(e) => {
                console.error("Image load error:", e);
                setError("Не удалось загрузить изображение");
                setIsLoading(false);
              }}
            />
          </div>
        </div>
      );
    }

    // PDF файлы
    if (file.type === "application/pdf") {
      return (
        <div className="w-full h-full">
          <iframe
            src={`/api/files/${file.id}/preview`}
            className="w-full h-full border-0"
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setError("Не удалось загрузить PDF");
              setIsLoading(false);
            }}
          />
        </div>
      );
    }

    // Текстовые файлы
    if (file.type.startsWith("text/") || file.type.includes("document")) {
      return (
        <div className="w-full h-full bg-gray-50 p-4">
          <iframe
            src={`/api/files/${file.id}/preview`}
            className="w-full h-full border-0 rounded-lg"
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setError("Не удалось загрузить документ");
              setIsLoading(false);
            }}
          />
        </div>
      );
    }

    // Таблицы (Excel, CSV)
    if (file.type.includes("spreadsheet") || file.type.includes("excel") || file.name.endsWith('.csv')) {
      return (
        <div className="w-full h-full bg-gray-50 p-4">
          <iframe
            src={`/api/files/${file.id}/preview`}
            className="w-full h-full border-0 rounded-lg"
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setError("Не удалось загрузить таблицу");
              setIsLoading(false);
            }}
          />
        </div>
      );
    }

    // Для других типов файлов показываем информацию
    return (
      <div className="flex flex-col items-center justify-center w-full h-full text-center p-8">
        <FileText className="w-16 h-16 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Предварительный просмотр недоступен</h3>
        <p className="text-gray-500 mb-4">
          Для файлов типа &quot;{getFileType(file.type)}&quot; предварительный просмотр не поддерживается
        </p>
        <Button onClick={() => window.open(`/api/files/${file.id}/content`, '_blank')} className="flex items-center gap-2">
          <ExternalLink className="w-4 h-4" />
          Открыть файл
        </Button>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] h-[90vh] max-w-6xl max-h-[90vh] p-0 overflow-hidden mx-auto">
        <DialogHeader className="sr-only">
          <DialogTitle>Предпросмотр файла: {file.name}</DialogTitle>
        </DialogHeader>
        
        
        {/* Основной контент */}
        <div className="flex-1 overflow-auto bg-gray-100">
          {renderFileContent()}
        </div>
        
        {/* Заголовок файла */}
        <div className="px-4 pt-4 pb-1 bg-white">
          <h1 className="text-xl font-bold text-gray-900">{file.name}</h1>
          {file.description && (
            <p className="text-gray-600 mt-1">{file.description}</p>
          )}
        </div>
        
        {/* Информация об авторе - внизу без линий */}
        <div className="flex items-center gap-3 px-4 pt-1 pb-4 bg-white">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
            {file.author?.name?.charAt(0).toUpperCase() || file.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-gray-900">{file.author?.name || "Неизвестный автор"}</p>
            <p className="text-sm text-gray-500">
              {new Date(file.createdAt).toLocaleDateString("ru-RU", {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
