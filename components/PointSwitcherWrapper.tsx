'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PointSwitcher from './PointSwitcher';

interface Point {
  id: string;
  name: string;
}

interface PointSwitcherWrapperProps {
  currentPoint?: Point | null;
  points: Point[];
}

export default function PointSwitcherWrapper({ currentPoint, points }: PointSwitcherWrapperProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handlePointChange = async (pointId: string) => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/switch-point', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pointId })
      });
      
      if (response.ok) {
        // Обновляем сессию и перезагружаем данные
        router.refresh();
        // Небольшая задержка для обновления сессии
        setTimeout(() => {
          window.location.reload();
        }, 100);
      } else {
        console.error('Failed to switch point');
      }
    } catch (error) {
      console.error('Error switching point:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PointSwitcher 
      currentPoint={currentPoint}
      points={points}
      onPointChange={handlePointChange}
    />
  );
}
