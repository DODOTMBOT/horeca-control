import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function PointPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/signin");
  }

  if (session.user?.role !== "POINT" && session.user?.role !== "PARTNER" && session.user?.role !== "OWNER") {
    redirect("/dashboard");
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Панель точки</h1>
      <p className="text-lg text-gray-700 mb-6">
        Добро пожаловать, {session.user?.name || session.user?.email}!
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Операции</h2>
          <p className="text-gray-600">Ежедневные операции и процессы</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Чек-листы</h2>
          <p className="text-gray-600">Контроль качества и соответствия</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Обучение</h2>
          <p className="text-gray-600">Курсы для сотрудников</p>
        </div>
      </div>
    </div>
  );
}
