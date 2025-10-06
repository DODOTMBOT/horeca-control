// Используем встроенный fetch

async function testLogin() {
  try {
    console.log('🔧 Тестирование входа в систему...');
    
    // Получаем CSRF токен
    const csrfResponse = await fetch('http://localhost:3000/api/auth/csrf');
    const csrfData = await csrfResponse.json();
    console.log('✅ CSRF токен получен');
    
    // Пытаемся войти
    const loginResponse = await fetch('http://localhost:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: 'ar.em.v@yandex.ru',
        password: 'admin123',
        csrfToken: csrfData.csrfToken,
        callbackUrl: 'http://localhost:3000/dashboard'
      })
    });
    
    console.log('📊 Статус входа:', loginResponse.status);
    
    if (loginResponse.status === 200) {
      console.log('✅ Вход успешен!');
      
      // Проверяем сессию
      const sessionResponse = await fetch('http://localhost:3000/api/auth/session');
      const sessionData = await sessionResponse.json();
      console.log('👤 Данные сессии:', {
        user: sessionData.user?.email,
        role: sessionData.user?.role,
        isPlatformOwner: sessionData.user?.isPlatformOwner
      });
    } else {
      console.log('❌ Ошибка входа');
      const errorText = await loginResponse.text();
      console.log('📄 Ответ сервера:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error.message);
  }
}

testLogin();
