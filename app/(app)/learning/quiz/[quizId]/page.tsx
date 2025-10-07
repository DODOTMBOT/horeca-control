'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { 
  FileText, 
  ArrowLeft,
  CheckCircle,
  XCircle,
  Trophy,
  Clock
} from 'lucide-react';
import Link from 'next/link';

interface Quiz {
  id: string;
  title: string;
  questions: Array<{
    id: string;
    text: string;
    kind: 'single' | 'multiple';
    answers: Array<{
      id: string;
      text: string;
      isCorrect: boolean;
    }>;
  }>;
  course: {
    id: string;
    title: string;
  };
}

interface QuizResult {
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  questionResults: Array<{
    questionId: string;
    questionText: string;
    userAnswers: string[];
    correctAnswers: string[];
    isCorrect: boolean;
  }>;
}

export default function QuizPage() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [result, setResult] = useState<QuizResult | null>(null);

  const quizId = params.quizId as string;

  useEffect(() => {
    if (quizId) {
      fetchQuiz();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId]);

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/learning/quiz/${quizId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Тест не найден');
          router.push('/learning');
          return;
        }
        throw new Error('Ошибка загрузки теста');
      }

      const quizData = await response.json();
      setQuiz(quizData);
      
      // Инициализируем ответы
      const initialAnswers: Record<string, string[]> = {};
      quizData.questions.forEach((question: any) => {
        initialAnswers[question.id] = [];
      });
      setAnswers(initialAnswers);
    } catch (error) {
      console.error('Error fetching quiz:', error);
      toast.error('Ошибка загрузки теста');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, answerId: string, checked: boolean) => {
    setAnswers(prev => {
      const currentAnswers = prev[questionId] || [];
      
      if (checked) {
        return {
          ...prev,
          [questionId]: [...currentAnswers, answerId]
        };
      } else {
        return {
          ...prev,
          [questionId]: currentAnswers.filter(id => id !== answerId)
        };
      }
    });
  };

  const handleSingleAnswerChange = (questionId: string, answerId: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: [answerId]
    }));
  };

  const submitQuiz = async () => {
    try {
      setSubmitting(true);
      const response = await fetch(`/api/learning/quiz/${quizId}/attempt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answers }),
      });

      if (!response.ok) {
        throw new Error('Ошибка отправки теста');
      }

      const resultData = await response.json();
      setResult(resultData);
      toast.success('Тест завершен!');
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast.error('Ошибка отправки теста');
    } finally {
      setSubmitting(false);
    }
  };

  const isAllQuestionsAnswered = () => {
    if (!quiz) return false;
    return quiz.questions.every(question => 
      answers[question.id] && answers[question.id].length > 0
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreMessage = (score: number) => {
    if (score >= 90) return 'Отлично!';
    if (score >= 80) return 'Хорошо!';
    if (score >= 60) return 'Удовлетворительно';
    return 'Нужно повторить материал';
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

  if (!quiz) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Тест не найден</h3>
              <p className="text-gray-600 mb-4">Возможно, тест был удален или у вас нет доступа к нему</p>
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

  // Показываем результат
  if (result) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Link href={`/learning/course/${quiz.course.id}`}>
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                К курсу
              </Button>
            </Link>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Результат теста</h1>
            <p className="text-gray-600">{quiz.title}</p>
          </div>

          {/* Score Card */}
          <Card className="mb-6 bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
            <CardContent className="p-8 text-center">
              <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <div className={`text-4xl font-bold mb-2 ${getScoreColor(result.score)}`}>
                {result.score}%
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {getScoreMessage(result.score)}
              </h2>
              <p className="text-gray-600">
                Правильных ответов: {result.correctAnswers} из {result.totalQuestions}
              </p>
            </CardContent>
          </Card>

          {/* Question Results */}
          <Card>
            <CardHeader>
              <CardTitle>Детали результатов</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {result.questionResults.map((questionResult, index) => (
                  <div key={questionResult.questionId} className="border rounded-lg p-4">
                    <div className="flex items-start gap-3 mb-3">
                      {questionResult.isCorrect ? (
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-2">
                          Вопрос {index + 1}: {questionResult.questionText}
                        </h4>
                        
                        <div className="space-y-2">
                          <div>
                            <span className="text-sm font-medium text-gray-700">Ваш ответ:</span>
                            <div className="text-sm text-gray-600">
                              {questionResult.userAnswers.length > 0 
                                ? questionResult.userAnswers.join(', ')
                                : 'Не отвечено'
                              }
                            </div>
                          </div>
                          
                          <div>
                            <span className="text-sm font-medium text-gray-700">Правильный ответ:</span>
                            <div className="text-sm text-gray-600">
                              {questionResult.correctAnswers.join(', ')}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-center mt-6">
            <Link href={`/learning/course/${quiz.course.id}`}>
              <Button size="lg">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Вернуться к курсу
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Показываем тест
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href={`/learning/course/${quiz.course.id}`}>
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              К курсу
            </Button>
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{quiz.title}</h1>
          <p className="text-gray-600">Курс: {quiz.course.title}</p>
          <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>{quiz.questions.length} вопрос{quiz.questions.length > 1 ? 'ов' : ''}</span>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-6 mb-8">
          {quiz.questions.map((question, index) => (
            <Card key={question.id}>
              <CardHeader>
                <CardTitle className="text-lg">
                  Вопрос {index + 1}: {question.text}
                </CardTitle>
                <p className="text-sm text-gray-600">
                  {question.kind === 'single' ? 'Выберите один ответ' : 'Выберите один или несколько ответов'}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {question.answers.map((answer) => (
                    <div key={answer.id} className="flex items-center space-x-3">
                      {question.kind === 'single' ? (
                        <input
                          type="radio"
                          id={answer.id}
                          name={question.id}
                          checked={answers[question.id]?.includes(answer.id) || false}
                          onChange={() => handleSingleAnswerChange(question.id, answer.id)}
                          className="h-4 w-4 text-blue-600"
                        />
                      ) : (
                        <Checkbox
                          id={answer.id}
                          checked={answers[question.id]?.includes(answer.id) || false}
                          onCheckedChange={(checked) => 
                            handleAnswerChange(question.id, answer.id, checked as boolean)
                          }
                        />
                      )}
                      <label 
                        htmlFor={answer.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {answer.text}
                      </label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Submit Button */}
        <div className="flex justify-center">
          <Button 
            onClick={submitQuiz} 
            disabled={!isAllQuestionsAnswered() || submitting}
            size="lg"
            className="bg-green-600 hover:bg-green-700"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Отправка...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Завершить тест
              </>
            )}
          </Button>
        </div>

        {!isAllQuestionsAnswered() && (
          <p className="text-center text-sm text-gray-600 mt-4">
            Ответьте на все вопросы для завершения теста
          </p>
        )}
      </div>
    </div>
  );
}
