"use client";

import React from "react";

interface FolderCardProps {
  folder: {
    id: string;
    name: string;
    fileCount?: number;
  };
  onSelect?: (id: string) => void;
  onRename?: (id: string, name: string) => void;
  onDelete?: (id: string, name: string) => void;
  onMove?: (id: string, name: string) => void;
  selected?: boolean;
}

export function FolderCard({ 
  folder, 
  onSelect, 
  onRename, 
  onDelete, 
  onMove, 
  selected = false 
}: FolderCardProps) {
  return (
    <div 
      className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${selected ? 'bg-blue-50 border-blue-300' : ''}`}
      onClick={() => onSelect?.(folder.id)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-yellow-200 rounded flex items-center justify-center">
            📁
          </div>
          <div>
            <h3 className="font-medium text-sm">{folder.name}</h3>
            {folder.fileCount !== undefined && (
              <p className="text-xs text-gray-500">
                {folder.fileCount} файлов
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {onRename && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRename(folder.id, folder.name);
              }}
              className="text-gray-600 hover:text-gray-800"
            >
              ✏️
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(folder.id, folder.name);
              }}
              className="text-red-600 hover:text-red-800"
            >
              🗑️
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
