// Тест конфигурации NextAuth.js
const { authOptions } = require('./lib/auth.ts');

console.log('🔧 Тестирование конфигурации NextAuth.js...');

console.log('📋 Конфигурация:');
console.log(`  - Debug: ${authOptions.debug}`);
console.log(`  - Session strategy: ${authOptions.session?.strategy}`);
console.log(`  - Providers: ${authOptions.providers?.length || 0}`);
console.log(`  - Callbacks: ${Object.keys(authOptions.callbacks || {}).length}`);

if (authOptions.providers && authOptions.providers.length > 0) {
  const credentialsProvider = authOptions.providers.find(p => p.id === 'credentials');
  if (credentialsProvider) {
    console.log('✅ Credentials provider найден');
  } else {
    console.log('❌ Credentials provider не найден');
  }
}

console.log('✅ Конфигурация NextAuth.js проверена');
