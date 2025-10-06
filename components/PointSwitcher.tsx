'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, Building2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Point {
  id: string;
  name: string;
}

interface PointSwitcherProps {
  currentPoint?: Point | null;
  points: Point[];
  onPointChange: (pointId: string) => void;
}

export default function PointSwitcher({ currentPoint, points, onPointChange }: PointSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (points.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white border-gray-300 hover:bg-gray-50"
      >
        <Building2 className="w-4 h-4" />
        <span className="text-sm font-medium">
          {currentPoint ? currentPoint.name : 'Выберите точку'}
        </span>
        <ChevronDown className="w-4 h-4" />
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Ваши точки
              </div>
              {points.map((point) => (
                <button
                  key={point.id}
                  onClick={() => {
                    onPointChange(point.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm rounded-md transition-colors ${
                    currentPoint?.id === point.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                  <span className="font-medium">{point.name}</span>
                  {currentPoint?.id === point.id && (
                    <span className="ml-auto text-xs text-blue-600">Активна</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
