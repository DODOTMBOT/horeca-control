import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function SubscriptionsPage() {
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
        <h1 className="text-3xl font-bold">Управление подписками</h1>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Создать тариф
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Активные подписки</h2>
          <p className="text-3xl font-bold text-blue-600">45</p>
          <p className="text-sm text-gray-600">+3 за неделю</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">MRR</h2>
          <p className="text-3xl font-bold text-green-600">₽180K</p>
          <p className="text-sm text-gray-600">+12% рост</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Churn Rate</h2>
          <p className="text-3xl font-bold text-red-600">3.2%</p>
          <p className="text-sm text-gray-600">-0.5% улучшение</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">ARPU</h2>
          <p className="text-3xl font-bold text-purple-600">₽4.2K</p>
          <p className="text-sm text-gray-600">+8% рост</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Тарифные планы */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Тарифные планы</h2>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold">Basic</h3>
                <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm">₽2,990/мес</span>
              </div>
              <p className="text-gray-600 mb-3">До 3 точек, базовые функции</p>
              <div className="flex space-x-2">
                <button className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm hover:bg-blue-200">
                  Редактировать
                </button>
                <button className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm hover:bg-red-200">
                  Удалить
                </button>
              </div>
            </div>
            
            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold">Premium</h3>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">₽5,990/мес</span>
              </div>
              <p className="text-gray-600 mb-3">До 10 точек, расширенные функции</p>
              <div className="flex space-x-2">
                <button className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm hover:bg-blue-200">
                  Редактировать
                </button>
                <button className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm hover:bg-red-200">
                  Удалить
                </button>
              </div>
            </div>
            
            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold">Enterprise</h3>
                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm">₽12,990/мес</span>
              </div>
              <p className="text-gray-600 mb-3">Безлимитные точки, все функции</p>
              <div className="flex space-x-2">
                <button className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm hover:bg-blue-200">
                  Редактировать
                </button>
                <button className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm hover:bg-red-200">
                  Удалить
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Статистика по подпискам */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Распределение по тарифам</h2>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Basic</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{width: '45%'}}></div>
                  </div>
                  <span className="text-sm text-gray-600">20 (45%)</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Premium</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{width: '40%'}}></div>
                  </div>
                  <span className="text-sm text-gray-600">18 (40%)</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Enterprise</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{width: '15%'}}></div>
                  </div>
                  <span className="text-sm text-gray-600">7 (15%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
