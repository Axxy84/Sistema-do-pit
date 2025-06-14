/**
 * Script para testar a API do dashboard diretamente
 */

const db = require('./config/database');
const axios = require('axios');

async function testarApiDashboard() {
  console.log('='.repeat(50));
  console.log('TESTE DA API DO DASHBOARD');
  console.log('='.repeat(50));

  try {
    // Verificar se há pedidos no banco
    const pedidosResult = await db.query('SELECT COUNT(*) FROM pedidos');
    console.log(`📊 Total de pedidos no banco: ${pedidosResult.rows[0].count}`);
    
    // Fazer uma chamada direta para a API do dashboard
    console.log(`⏳ Fazendo requisição para a API do dashboard...`);
    const response = await axios.get('http://localhost:3001/api/dashboard');
    const dashboardData = response.data;
    
    // Verificar se os dados foram retornados corretamente
    console.log('\n📋 RESULTADO DA API:');
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
    console.error('❌ Erro ao testar API do dashboard:', error.message);
    if (error.response) {
      console.error('Detalhes da resposta:', error.response.data);
    }
  }
}

// Executar a função principal
testarApiDashboard(); 