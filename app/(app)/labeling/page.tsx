import { requireSession } from "@/lib/guards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function LabelingPage() {
  await requireSession();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Маркировки</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Управление маркировками продуктов и отслеживание сроков годности
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Раздел в разработке</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 dark:text-gray-400">
          Функционал маркировок будет добавлен в ближайшее время. Здесь вы сможете:
        </p>
        <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <li>• Создавать и управлять продуктами</li>
          <li>• Печатать этикетки с QR-кодами</li>
          <li>• Отслеживать сроки годности</li>
          <li>• Анализировать статистику по продуктам</li>
        </ul>
        </CardContent>
      </Card>
    </div>
  );
}