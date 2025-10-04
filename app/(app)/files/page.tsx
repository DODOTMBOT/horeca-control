import { requireSession } from "@/lib/guards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function FilesPage() {
  await requireSession();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Файлы</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Централизованное хранение и управление файлами организации
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Раздел в разработке</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 dark:text-gray-400">
          Функционал файлового хранилища будет добавлен в ближайшее время. Здесь вы сможете:
        </p>
        <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <li>• Загружать и скачивать файлы</li>
          <li>• Организовывать файлы по папкам</li>
          <li>• Настраивать права доступа</li>
          <li>• Искать файлы по содержимому</li>
        </ul>
        </CardContent>
      </Card>
    </div>
  );
}