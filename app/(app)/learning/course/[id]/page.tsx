'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { 
  BookOpen, 
  Play, 
  CheckCircle, 
  Clock,
  ArrowLeft,
  FileText,
  Trophy
} from 'lucide-react';
import Link from 'next/link';

interface Course {
  id: string;
  title: string;
  description?: string;
  owner: { name?: string; email: string };
  lessons: Array<{ 
    id: string; 
    title: string; 
    order: number; 
    createdAt: string;
  }>;
  quizzes: Array<{ 
    id: string; 
    title: string; 
    createdAt: string;
    questions: Array<{
      id: string;
      text: string;
      kind: string;
      answers: Array<{
        id: string;
        text: string;
        isCorrect: boolean;
      }>;
    }>;
  }>;
  assignments: Array<{
    id: string;
    progress: Array<{
      status: string;
      lessonsDone: number;
      score?: number;
    }>;
  }>;
}

export default function CoursePage() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<{
    status: string;
    lessonsDone: number;
    score?: number;
  } | null>(null);

  const courseId = params.id as string;

  useEffect(() => {
    if (courseId) {
      fetchCourse();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/learning/courses/${courseId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Курс не найден');
          router.push('/learning');
          return;
        }
        throw new Error('Ошибка загрузки курса');
      }

      const courseData = await response.json();
      setCourse(courseData);
      
      // Получаем прогресс пользователя
      if (courseData.assignments?.[0]?.progress?.[0]) {
        setProgress(courseData.assignments[0].progress[0]);
      }
    } catch (error) {
      console.error('Error fetching course:', error);
      toast.error('Ошибка загрузки курса');
    } finally {
      setLoading(false);
    }
  };

  const getLessonStatus = (lessonOrder: number) => {
    if (!progress) return 'not-started';
    if (lessonOrder < progress.lessonsDone) return 'completed';
    if (lessonOrder === progress.lessonsDone) return 'current';
    return 'not-started';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'current':
        return <Play className="h-5 w-5 text-blue-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-700">Завершено</Badge>;
      case 'current':
        return <Badge variant="default" className="bg-blue-100 text-blue-700">Текущий</Badge>;
      default:
        return <Badge variant="secondary" className="bg-gray-100 text-gray-700">Не начато</Badge>;
    }
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
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Курс не найден</h3>
              <p className="text-gray-600 mb-4">Возможно, курс был удален или у вас нет доступа к нему</p>
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

  const nextLesson = course.lessons.find(lesson => 
    getLessonStatus(lesson.order) === 'current'
  ) || course.lessons[0];

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/learning">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Вернуться к курсам
            </Button>
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{course.title}</h1>
          {course.description && (
            <p className="text-gray-600 mb-4">{course.description}</p>
          )}
          
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>Автор: {course.owner.name || course.owner.email}</span>
            <span>•</span>
            <span>{course.lessons.length} уроков</span>
            {course.quizzes.length > 0 && (
              <>
                <span>•</span>
                <span>{course.quizzes.length} тест{course.quizzes.length > 1 ? 'ов' : ''}</span>
              </>
            )}
          </div>
        </div>

        {/* Progress */}
        {progress && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Прогресс
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Пройдено уроков:</span>
                  <span className="font-medium">{progress.lessonsDone} / {course.lessons.length}</span>
                </div>
                
                {progress.lessonsDone > 0 && (
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${(progress.lessonsDone / course.lessons.length) * 100}%` 
                      }}
                    />
                  </div>
                )}

                {progress.score !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Лучший результат теста:</span>
                    <span className="font-medium">{progress.score}%</span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {progress.status === 'NOT_STARTED' && (
                    <>
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Обучение не начато</span>
                    </>
                  )}
                  {progress.status === 'IN_PROGRESS' && (
                    <>
                      <Play className="h-4 w-4 text-blue-500" />
                      <span className="text-sm text-blue-600">В процессе</span>
                    </>
                  )}
                  {progress.status === 'DONE' && (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-600">Завершено</span>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Continue Button */}
        {nextLesson && (
          <Card className="mb-6 bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">
                    {progress?.status === 'NOT_STARTED' ? 'Начать обучение' : 'Продолжить обучение'}
                  </h3>
                  <p className="text-sm text-blue-700">
                    {progress?.status === 'NOT_STARTED' 
                      ? `Начните с урока: "${nextLesson.title}"`
                      : `Следующий урок: "${nextLesson.title}"`
                    }
                  </p>
                </div>
                <Link href={`/learning/lesson/${nextLesson.id}`}>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Play className="h-4 w-4 mr-2" />
                    {progress?.status === 'NOT_STARTED' ? 'Начать' : 'Продолжить'}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lessons */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Уроки
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {course.lessons.map((lesson, index) => {
                const status = getLessonStatus(lesson.order);
                return (
                  <div 
                    key={lesson.id} 
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(status)}
                      <div>
                        <h4 className="font-medium text-gray-900">{lesson.title}</h4>
                        <p className="text-sm text-gray-600">Урок {index + 1}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(status)}
                      <Link href={`/learning/lesson/${lesson.id}`}>
                        <Button size="sm" variant="outline">
                          {status === 'completed' ? 'Повторить' : 'Открыть'}
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quizzes */}
        {course.quizzes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Тесты
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {course.quizzes.map((quiz) => (
                  <div 
                    key={quiz.id} 
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-gray-500" />
                      <div>
                        <h4 className="font-medium text-gray-900">{quiz.title}</h4>
                        <p className="text-sm text-gray-600">
                          {quiz.questions.length} вопрос{quiz.questions.length > 1 ? 'ов' : ''}
                        </p>
                      </div>
                    </div>
                    <Link href={`/learning/quiz/${quiz.id}`}>
                      <Button size="sm" variant="outline">
                        Пройти тест
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
