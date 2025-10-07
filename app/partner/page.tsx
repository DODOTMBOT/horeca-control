import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function PartnerPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/signin");
  }

  if (session.user?.role !== "PARTNER" && session.user?.role !== "OWNER") {
    redirect("/dashboard");
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Панель партнера</h1>
      <p className="text-lg text-gray-700 mb-6">
        Добро пожаловать, {session.user?.name || session.user?.email}!
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Точки продаж</h2>
          <p className="text-gray-600">Управление вашими точками продаж</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Персонал</h2>
          <p className="text-gray-600">Сотрудники и их роли</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Отчеты</h2>
          <p className="text-gray-600">Аналитика по точкам</p>
        </div>
      </div>
    </div>
  );
}
