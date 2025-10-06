"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { LoadingSpinner } from "./loading-spinner";

interface PageLoadingProps {
  children: React.ReactNode;
}

export function PageLoading({ children }: PageLoadingProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingKey, setLoadingKey] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    // Показываем индикатор загрузки при смене страницы
    setIsLoading(true);
    setLoadingKey(prev => prev + 1);

    // Скрываем индикатор через небольшую задержку для плавности
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <>
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <div className="flex flex-col items-center space-y-4 animate-fade-in">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-gray-600 dark:text-gray-400 animate-pulse">
              Загрузка...
            </p>
          </div>
        </div>
      )}
      <div key={loadingKey} className="animate-fade-in">
        {children}
      </div>
    </>
  );
}
