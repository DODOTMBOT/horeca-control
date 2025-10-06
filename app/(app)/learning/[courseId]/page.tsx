'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { setLessonCompletedAction } from '../actions';

interface Course {
  id: string;
  title: string;
  description?: string;
  modules: Array<{
    id: string;
    title: string;
    order: number;
    lessons: Array<{
      id: string;
      title: string;
      type: string;
      content?: string;
      order: number;
    }>;
  }>;
}

export default function CoursePage() {
  const { data: session } = useSession();
  const params = useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  const courseId = params.courseId as string;

  useEffect(() => {
    if (courseId) {
      fetchCourse();
    }
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/learning/courses/${courseId}`);
      
      if (!response.ok) {
        throw new Error('Ошибка загрузки курса');
      }

      const courseData = await response.json();
      setCourse(courseData);
    } catch (error) {
      console.error('Error fetching course:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">Загрузка...</div>;
  }

  if (!course) {
    return <div className="p-8">Курс не найден</div>;
  }

  const allLessons = course.modules.flatMap(m => m.lessons);
  const totalLessons = allLessons.length;

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-6">
        <aside className="md:col-span-1 space-y-3">
          <h1 className="text-xl font-semibold">{course.title}</h1>
          <div className="space-y-2">
            {course.modules.map((m)=> (
              <div key={m.id} className="rounded-lg border">
                <div className="px-3 py-2 font-medium">{m.title}</div>
                <div className="px-3 pb-2 space-y-1">
                  {m.lessons.map((l)=> (
                    <div key={l.id} className="text-sm text-gray-700">• {l.title}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>
        <main className="md:col-span-3">
          {allLessons.map((l)=> (
            <div key={l.id} className="mb-8 rounded-xl border p-4">
              <h2 className="font-semibold mb-2">{l.title}</h2>
              {l.type === 'TEXT' && <div className="prose" dangerouslySetInnerHTML={{ __html: (l.content || '').replace(/\n/g, '<br/>') }} />}
              {l.type === 'VIDEO' && (
                <video src={l.content || ''} controls className="w-full rounded" />
              )}
              {l.type === 'FILE' && (
                <a className="text-blue-600 underline" href={l.content || ''} target="_blank">Скачать файл</a>
              )}
              {l.type === 'IMAGE' && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={l.content || ''} alt={l.title} className="max-h-96 rounded" />
              )}
              <div className="mt-3">
                <Button 
                  onClick={async () => {
                    try {
                      await setLessonCompletedAction(l.id, true);
                      // Refresh the page to show updated progress
                      window.location.reload();
                    } catch (error) {
                      console.error('Error marking lesson as completed:', error);
                    }
                  }}
                >
                  Отметить как выполнено
                </Button>
              </div>
            </div>
          ))}
        </main>
      </div>
    </div>
  );
}

