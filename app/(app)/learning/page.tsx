'use client';

import { Card } from '@/components/ui/card';

export default function LearningPage() {
  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Обучение</h1>
        <Card className="p-10">
          <p className="text-gray-700 text-lg">Раздел в разработке.</p>
          <p className="text-gray-500 mt-2">Скоро здесь появятся курсы, прогресс и каталог.</p>
        </Card>
      </div>
    </div>
  );
}