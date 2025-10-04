import { requireSession } from "@/lib/guards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function LearningPage() {
  await requireSession();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Обучение</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Система обучения сотрудников и управления знаниями
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Раздел в разработке</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 dark:text-gray-400">
          Функционал обучения будет добавлен в ближайшее время. Здесь вы сможете:
        </p>
        <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <li>• Создавать курсы и уроки</li>
          <li>• Назначать обучение сотрудникам</li>
          <li>• Отслеживать прогресс обучения</li>
          <li>• Проводить тестирования</li>
        </ul>
        </CardContent>
      </Card>
    </div>
  );
}