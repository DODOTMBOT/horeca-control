"use client";
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type Props = {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  level?: string | null;
  coverUrl?: string | null;
  action?: { label: string; href: string };
};

export default function CourseCard({ id, title, description, category, level, coverUrl, action }: Props) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      {coverUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={coverUrl} alt={title} className="h-40 w-full object-cover rounded-t-lg" />
      )}
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2">{title}</CardTitle>
            <p className="text-sm text-gray-600 line-clamp-2">{description || 'Описание отсутствует'}</p>
          </div>
        </div>
        <div className="mt-2 flex gap-2">
          {category && <Badge variant="secondary">{category}</Badge>}
          {level && <Badge variant="outline">{level}</Badge>}
        </div>
      </CardHeader>
      <CardContent>
        {action ? (
          <Link href={action.href}><Button className="w-full">{action.label}</Button></Link>
        ) : (
          <Link href={`/learning/${id}`}><Button className="w-full" variant="outline">Открыть</Button></Link>
        )}
      </CardContent>
    </Card>
  );
}

