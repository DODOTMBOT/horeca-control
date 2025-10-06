import { Suspense } from "react";
import { FileManager } from "./FileManager";
import { Skeleton } from "@/components/ui/skeleton";

export default function FilesPage() {
  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Файловый менеджер</h1>
          <p className="text-gray-600">Управление файлами и папками</p>
        </div>
        
        <Suspense fallback={
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-10 w-80" />
              <Skeleton className="h-10 w-24" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1">
                <Skeleton className="h-64 w-full" />
              </div>
              <div className="lg:col-span-3">
                <Skeleton className="h-64 w-full" />
              </div>
            </div>
          </div>
        }>
          <FileManager />
        </Suspense>
      </div>
    </div>
  );
}