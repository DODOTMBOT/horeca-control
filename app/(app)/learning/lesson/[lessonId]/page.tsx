'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { 
  BookOpen, 
  CheckCircle, 
  ArrowLeft,
  ArrowRight,
  Clock
} from 'lucide-react';
import Link from 'next/link';

interface Lesson {
  id: string;
  title: string;
  content?: any;
  order: number;
  course: {
    id: string;
    title: string;
    ownerId: string;
    tenantId?: string;
  };
}

export default function LessonPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  const lessonId = params.lessonId as string;

  useEffect(() => {
    if (lessonId) {
      fetchLesson();
    }
  }, [lessonId]);

  const fetchLesson = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/learning/lessons/${lessonId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Урок не найден');
          router.push('/learning');
          return;
        }
        throw new Error('Ошибка загрузки урока');
      }

      const lessonData = await response.json();
      setLesson(lessonData);
    } catch (error) {
      console.error('Error fetching lesson:', error);
      toast.error('Ошибка загрузки урока');
    } finally {
      setLoading(false);
    }
  };

  const completeLesson = async () => {
    try {
      setCompleting(true);
      const response = await fetch(`/api/learning/lessons/${lessonId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Ошибка завершения урока');
      }

      const result = await response.json();
      toast.success('Урок отмечен как пройденный!');
      
      if (result.isCourseCompleted) {
        toast.success('Поздравляем! Вы завершили весь курс!');
      }

      // Перенаправляем обратно к курсу
      router.push(`/learning/course/${lesson?.course.id}`);
    } catch (error) {
      console.error('Error completing lesson:', error);
      toast.error('Ошибка завершения урока');
    } finally {
      setCompleting(false);
    }
  };

  const renderContent = (content: any) => {
    if (!content) {
      return (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Контент урока пока не добавлен</p>
        </div>
      );
    }

    // Если контент - это JSON массив блоков
    if (Array.isArray(content)) {
      return (
        <div className="space-y-4">
          {content.map((block, index) => (
            <div key={index} className="prose max-w-none">
              {block.type === 'heading' && (
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  {block.content}
                </h2>
              )}
              {block.type === 'paragraph' && (
                <p className="text-gray-700 leading-relaxed mb-4">
                  {block.content}
                </p>
              )}
              {block.type === 'list' && (
                <ul className="list-disc list-inside space-y-2 mb-4">
                  {block.items?.map((item: string, itemIndex: number) => (
                    <li key={itemIndex} className="text-gray-700">{item}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      );
    }

    // Если контент - это строка
    if (typeof content === 'string') {
      return (
        <div className="prose max-w-none">
          <div dangerouslySetInnerHTML={{ __html: content }} />
        </div>
      );
    }

    // Fallback
    return (
      <div className="text-center py-12">
        <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Контент урока в неожиданном формате</p>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Skeleton className="h-8 w-32 mb-4" />
            <Skeleton className="h-6 w-96 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Урок не найден</h3>
              <p className="text-gray-600 mb-4">Возможно, урок был удален или у вас нет доступа к нему</p>
              <Link href="/learning">
                <Button>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Вернуться к курсам
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Link href={`/learning/course/${lesson.course.id}`}>
              <Button variant="ghost">
                <ArrowLeft className="h-4 w-4 mr-2" />
                К курсу
              </Button>
            </Link>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>Урок {lesson.order}</span>
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{lesson.title}</h1>
          <p className="text-gray-600">Курс: {lesson.course.title}</p>
        </div>

        {/* Content */}
        <Card className="mb-6">
          <CardContent className="p-8">
            {renderContent(lesson.content)}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-between items-center">
          <Link href={`/learning/course/${lesson.course.id}`}>
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад к курсу
            </Button>
          </Link>
          
          <Button 
            onClick={completeLesson} 
            disabled={completing}
            className="bg-green-600 hover:bg-green-700"
          >
            {completing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Завершение...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Отметить как пройденный
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
