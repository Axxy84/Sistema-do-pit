const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'pizzaria_db',
  user: 'postgres',
  password: '8477'
});

async function checkRealTimeData() {
  try {
    console.log('🔍 DEBUG SINCRONIZAÇÃO EM TEMPO REAL...');
    
    // 1. Verificar pedidos mais recentes
    const pedidosResult = await pool.query(`
      SELECT 
        id,
        tipo_pedido,
        status_pedido,
        total,
        created_at,
        data_pedido
      FROM pedidos 
      ORDER BY created_at DESC 
      LIMIT 3
    `);
    
    console.log('\n📊 ÚLTIMOS 3 PEDIDOS:');
    pedidosResult.rows.forEach((pedido, index) => {
      const minutosAtras = Math.round((new Date() - new Date(pedido.created_at)) / 1000 / 60);
      console.log(`${index + 1}. ${pedido.tipo_pedido.toUpperCase()} - ${pedido.status_pedido} - R$ ${parseFloat(pedido.total).toFixed(2)}`);
      console.log(`   Criado há ${minutosAtras} minutos`);
      console.log(`   ID: ${pedido.id.substring(0, 8)}...`);
    });
    
    // 2. Verificar endpoint dashboard em tempo real
    const hoje = new Date().toISOString().split('T')[0];
    console.log(`\n📡 Testando endpoint para hoje (${hoje})...`);
    
    const JWT_SECRET = 'sua_chave_secreta_muito_forte_aqui_change_me';
    const token = jwt.sign(
      { userId: '99a62b24-7acd-4bd0-a84c-9ee2164cec26' }, 
      JWT_SECRET, 
      { expiresIn: '1h' }
    );
    
    const response = await fetch(`http://localhost:3001/api/dashboard/fechamento-consolidado?data_inicio=${hoje}&data_fim=${hoje}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.log('❌ Erro na API:', await response.text());
      return;
    }
    
    const data = await response.json();
    
    console.log('\n💰 DADOS DO ENDPOINT:');
    if (data.totais_gerais) {
      console.log(`- Total pedidos: ${data.totais_gerais.total_pedidos}`);
      console.log(`- Vendas brutas: R$ ${data.totais_gerais.vendas_brutas.toFixed(2)}`);
    }
    
    if (data.vendas_por_tipo) {
      console.log('\n📋 Por tipo:');
      Object.entries(data.vendas_por_tipo).forEach(([tipo, vendas]) => {
        console.log(`- ${tipo}: ${vendas.total_pedidos} pedidos = R$ ${vendas.vendas_brutas.toFixed(2)}`);
      });
    }
    
    // 3. Verificar despesas mais recentes
    const despesasResult = await pool.query(`
      SELECT 
        id,
        tipo,
        categoria,
        valor,
        descricao,
        created_at
      FROM despesas_receitas 
      ORDER BY created_at DESC 
      LIMIT 3
    `);
    
    console.log('\n💸 ÚLTIMAS 3 DESPESAS/RECEITAS:');
    if (despesasResult.rows.length === 0) {
      console.log('❌ Nenhuma despesa/receita encontrada');
    } else {
      despesasResult.rows.forEach((despesa, index) => {
        const minutosAtras = Math.round((new Date() - new Date(despesa.created_at)) / 1000 / 60);
        console.log(`${index + 1}. ${despesa.tipo.toUpperCase()} - ${despesa.categoria} - R$ ${parseFloat(despesa.valor).toFixed(2)}`);
        console.log(`   ${despesa.descricao}`);
        console.log(`   Criado há ${minutosAtras} minutos`);
      });
    }
    
    // 4. Testar endpoint de despesas usado pelo Tony
    console.log('\n📡 Testando endpoint de despesas...');
    const expensesResponse = await fetch(`http://localhost:3001/api/expenses/summary?data_inicio=${hoje}&data_fim=${hoje}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (expensesResponse.ok) {
      const expensesData = await expensesResponse.json();
      console.log('💰 Resumo de despesas:', expensesData.summary);
    } else {
      console.log('❌ Erro no endpoint de despesas');
    }
    
    console.log('\n🎯 DIAGNÓSTICO:');
    const totalPedidosDB = pedidosResult.rows.filter(p => {
      const pedidoDate = new Date(p.data_pedido).toISOString().split('T')[0];
      return pedidoDate === hoje && ['entregue', 'fechada'].includes(p.status_pedido);
    }).length;
    
    const totalPedidosAPI = data.totais_gerais?.total_pedidos || 0;
    
    if (totalPedidosDB === totalPedidosAPI) {
      console.log('✅ Sincronização OK - dados batem');
    } else {
      console.log(`❌ PROBLEMA DE SINCRONIZAÇÃO:`);
      console.log(`   - Banco de dados: ${totalPedidosDB} pedidos`);
      console.log(`   - API retornando: ${totalPedidosAPI} pedidos`);
      console.log('   - POSSÍVEL CACHE DESATUALIZADO!');
    }
    
    await pool.end();
  } catch (error) {
    console.error('❌ Erro:', error.message);
    await pool.end();
  }
}

checkRealTimeData();