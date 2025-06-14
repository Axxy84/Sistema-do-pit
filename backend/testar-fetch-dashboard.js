/**
 * Script para testar diretamente a função fetchDashboardData
 */

const db = require('./config/database');
const { fetchDashboardData } = require('./routes/dashboard');

async function testarFetchDashboard() {
  try {
    console.log('='.repeat(50));
    console.log('TESTANDO FUNÇÃO fetchDashboardData DIRETAMENTE');
    console.log('='.repeat(50));
    
    const today = new Date();
    const todayKey = today.toISOString().split('T')[0];
    
    console.log(`📅 Data de hoje: ${todayKey}`);
    console.log(`⏳ Executando fetchDashboardData...`);
    
    // Chamar a função diretamente
    const dashboardData = await fetchDashboardData(today, todayKey);
    
    // Verificar se os dados foram retornados corretamente
    console.log('\n📋 RESULTADO DA FUNÇÃO:');
    console.log(JSON.stringify(dashboardData, null, 2));
    
    // Verificar especificamente os KPIs
    console.log('\n🔍 KPIs:');
    if (dashboardData && dashboardData.kpis) {
      console.log(JSON.stringify(dashboardData.kpis, null, 2));
    } else {
      console.log('❌ KPIs não encontrados na resposta!');
    }
    
    console.log('\n✅ Teste concluído!');
  } catch (error) {
    console.error('❌ Erro ao testar fetchDashboardData:', error);
  }
}

// Executar a função principal
testarFetchDashboard(); 