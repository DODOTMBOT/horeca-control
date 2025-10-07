import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/signin");
  }

  if (session.user?.role !== "OWNER") {
    redirect("/dashboard");
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Аналитика системы</h1>
        <div className="flex space-x-2">
          <select className="px-3 py-2 border border-gray-300 rounded-lg">
            <option>Последние 30 дней</option>
            <option>Последние 7 дней</option>
            <option>Последние 90 дней</option>
            <option>За год</option>
          </select>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Экспорт отчета
          </button>
        </div>
      </div>
      
      {/* Ключевые метрики */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Общий доход</h2>
          <p className="text-3xl font-bold text-green-600">₽2.4M</p>
          <p className="text-sm text-gray-600">+15% к прошлому месяцу</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Активные пользователи</h2>
          <p className="text-3xl font-bold text-blue-600">1,247</p>
          <p className="text-sm text-gray-600">+8% рост</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Конверсия</h2>
          <p className="text-3xl font-bold text-purple-600">12.3%</p>
          <p className="text-sm text-gray-600">+2.1% улучшение</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">NPS Score</h2>
          <p className="text-3xl font-bold text-orange-600">67</p>
          <p className="text-sm text-gray-600">+5 пунктов</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* График доходов */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Динамика доходов</h2>
          </div>
          <div className="p-6">
            <div className="h-64 flex items-end justify-between space-x-2">
              <div className="flex flex-col items-center">
                <div className="w-8 bg-blue-600 rounded-t" style={{height: '60%'}}></div>
                <span className="text-xs text-gray-600 mt-2">Янв</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-8 bg-blue-600 rounded-t" style={{height: '70%'}}></div>
                <span className="text-xs text-gray-600 mt-2">Фев</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-8 bg-blue-600 rounded-t" style={{height: '80%'}}></div>
                <span className="text-xs text-gray-600 mt-2">Мар</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-8 bg-blue-600 rounded-t" style={{height: '90%'}}></div>
                <span className="text-xs text-gray-600 mt-2">Апр</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-8 bg-blue-600 rounded-t" style={{height: '100%'}}></div>
                <span className="text-xs text-gray-600 mt-2">Май</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-8 bg-green-600 rounded-t" style={{height: '95%'}}></div>
                <span className="text-xs text-gray-600 mt-2">Июн</span>
              </div>
            </div>
          </div>
        </div>

        {/* Топ партнеры */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Топ партнеры по доходу</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">ООО "Ресторан Групп"</p>
                  <p className="text-sm text-gray-600">5 точек</p>
                </div>
                <span className="font-semibold text-green-600">₽245K</span>
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">ИП Иванов А.А.</p>
                  <p className="text-sm text-gray-600">2 точки</p>
                </div>
                <span className="font-semibold text-green-600">₽189K</span>
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">ООО "Кафе Сеть"</p>
                  <p className="text-sm text-gray-600">8 точек</p>
                </div>
                <span className="font-semibold text-green-600">₽156K</span>
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">ИП Петрова М.В.</p>
                  <p className="text-sm text-gray-600">3 точки</p>
                </div>
                <span className="font-semibold text-green-600">₽134K</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Детальная аналитика */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Детальная аналитика</h2>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">География</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Москва</span>
                  <span className="text-sm font-medium">45%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">СПб</span>
                  <span className="text-sm font-medium">25%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Другие</span>
                  <span className="text-sm font-medium">30%</span>
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Типы заведений</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Рестораны</span>
                  <span className="text-sm font-medium">40%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Кафе</span>
                  <span className="text-sm font-medium">35%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Бары</span>
                  <span className="text-sm font-medium">25%</span>
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Активность</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Высокая</span>
                  <span className="text-sm font-medium">60%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Средняя</span>
                  <span className="text-sm font-medium">30%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Низкая</span>
                  <span className="text-sm font-medium">10%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
