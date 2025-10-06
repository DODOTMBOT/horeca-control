"use client";

import React from "react";

interface FileCardProps {
  file: {
    id: string;
    name: string;
    size?: number;
    type?: string;
  };
  onSelect?: (id: string) => void;
  onRename?: (id: string, name: string) => void;
  onDelete?: (id: string, name: string) => void;
  onMove?: (id: string, name: string) => void;
  onDownload?: (id: string, name: string) => void;
  selected?: boolean;
}

export function FileCard({ 
  file, 
  onSelect, 
  onRename, 
  onDelete, 
  onMove, 
  onDownload, 
  selected = false 
}: FileCardProps) {
  return (
    <div 
      className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${selected ? 'bg-blue-50 border-blue-300' : ''}`}
      onClick={() => onSelect?.(file.id)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
            📄
          </div>
          <div>
            <h3 className="font-medium text-sm">{file.name}</h3>
            {file.size && (
              <p className="text-xs text-gray-500">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {onDownload && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDownload(file.id, file.name);
              }}
              className="text-blue-600 hover:text-blue-800"
            >
              ⬇️
            </button>
          )}
          {onRename && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRename(file.id, file.name);
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
                onDelete(file.id, file.name);
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
