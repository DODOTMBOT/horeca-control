import { requireSession, requireTenant } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tag, FileText, BookOpen, CreditCard, Package, Calendar, Zap } from "lucide-react";

export default async function DashboardPage() {
  await requireSession();
  const tenantSession = await requireTenant();

  if (!tenantSession.user?.tenantId) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">Дашборд</h1>
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-400">
            Организация не назначена. Обратитесь к администратору.
          </p>
        </div>
      </div>
    );
  }

  const tenantId = tenantSession.user.tenantId;

  // Получаем данные для дашборда
  const [
    productsCount,
    labelsCount,
    filesCount,
    coursesCount,
    subscription
  ] = await Promise.all([
    // Количество продуктов
    prisma.product.count({
      where: { tenantId }
    }),
    
    // Количество этикеток за последние 7 дней
    prisma.label.count({
      where: {
        tenantId,
        printedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    }),
    
    // Количество файлов
    prisma.file.count({
      where: { tenantId }
    }),
    
    // Количество курсов
    prisma.course.count({
      where: { tenantId }
    }),
    
    // Подписка
    prisma.subscription.findUnique({
      where: { tenantId }
    })
  ]);

  const stats = [
    {
      title: "Маркировки",
      icon: Tag,
      items: [
        { label: "Продукты", value: productsCount, icon: Package, badge: undefined },
        { label: "Этикетки (7 дней)", value: labelsCount, icon: Calendar, badge: undefined }
      ]
    },
    {
      title: "Файлы",
      icon: FileText,
      items: [
        { label: "Загружено файлов", value: filesCount, icon: FileText, badge: undefined }
      ]
    },
    {
      title: "Обучение",
      icon: BookOpen,
      items: [
        { label: "Курсы", value: coursesCount, icon: BookOpen, badge: undefined }
      ]
    },
    {
      title: "Подписка",
      icon: CreditCard,
      items: [
        { 
          label: "План", 
          value: subscription?.plan || "BASIC",
          icon: Zap,
          badge: subscription?.status === "ACTIVE" ? "success" : "secondary"
        },
        { 
          label: "Статус", 
          value: subscription?.status === "ACTIVE" ? "Активна" : "Неактивна",
          icon: CreditCard,
          badge: subscription?.status === "ACTIVE" ? "success" : "destructive"
        }
      ]
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Дашборд</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Добро пожаловать, {tenantSession.user?.name || tenantSession.user?.email}!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stat.items.map((item, itemIndex) => {
                    const ItemIcon = item.icon;
                    return (
                      <div key={itemIndex} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <ItemIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {item.label}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {item.badge ? (
                            <Badge 
                              variant={item.badge === "success" ? "default" : 
                                      item.badge === "destructive" ? "destructive" : "secondary"}
                            >
                              {item.value}
                            </Badge>
                          ) : (
                            <span className="text-2xl font-bold">
                              {item.value}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Дополнительная информация */}
      <Card>
        <CardHeader>
          <CardTitle>Быстрые действия</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2 p-3 border rounded-lg">
              <Tag className="h-5 w-5 text-blue-500" />
              <div>
                <p className="font-medium">Маркировки</p>
                <p className="text-sm text-muted-foreground">
                  Управление продуктами и этикетками
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 p-3 border rounded-lg">
              <FileText className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium">Файлы</p>
                <p className="text-sm text-muted-foreground">
                  Централизованное хранение документов
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 p-3 border rounded-lg">
              <BookOpen className="h-5 w-5 text-purple-500" />
              <div>
                <p className="font-medium">Обучение</p>
                <p className="text-sm text-muted-foreground">
                  Курсы и обучение сотрудников
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}