import { Card, CardContent } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';

export default function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <Card>
      <CardContent className="p-8 text-center">
        <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
        {subtitle && <p className="text-gray-600">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

