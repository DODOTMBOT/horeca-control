export default function SimplePage() {
  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Простая страница обучения</h1>
        <p className="text-gray-600">Эта страница не требует аутентификации</p>
        <div className="mt-8">
          <div className="bg-white rounded-xl p-8 shadow-sm border">
            <h2 className="text-xl font-semibold mb-4">Тест CSS</h2>
            <p className="text-gray-600">Если вы видите стилизованную страницу, значит CSS работает правильно.</p>
            <div className="mt-4">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                Тестовая кнопка
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
