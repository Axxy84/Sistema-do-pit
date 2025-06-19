// Script para limpar cache do frontend via console do navegador
// Copie e cole este código no console do navegador (F12)

console.log('🧹 Limpando todo o cache do frontend...');

// Limpar localStorage
localStorage.clear();
console.log('✅ localStorage limpo');

// Limpar sessionStorage
sessionStorage.clear();
console.log('✅ sessionStorage limpo');

// Limpar todos os caches específicos do sistema
const cacheKeys = [
  'pizzaria_products_cache',
  'pizzaria_pizzas_cache',
  'pizzaria_customers_cache',
  'pizzaria_orders_cache',
  'pizzaria_dashboard_cache'
];

cacheKeys.forEach(key => {
  if (localStorage.getItem(key)) {
    localStorage.removeItem(key);
    console.log(`✅ Cache ${key} removido`);
  }
});

// Forçar reload da página
console.log('🔄 Recarregando a página em 2 segundos...');
setTimeout(() => {
  window.location.reload(true);
}, 2000);