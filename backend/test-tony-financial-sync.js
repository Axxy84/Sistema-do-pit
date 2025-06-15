const http = require('http');
const db = require('./config/database');

const API_URL = 'http://localhost:3001';

function httpGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: headers
    };
    
    http.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ ok: res.statusCode === 200, json: () => JSON.parse(data) });
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function testFinancialSync() {
  console.log('🧪 Teste de Sincronização Financeira\n');
  
  try {
    // 1. Verificar pedidos e transações no banco
    console.log('📊 Verificando dados no banco...');
    
    const pedidosResult = await db.query(`
      SELECT COUNT(*) as total, COALESCE(SUM(total), 0) as valor_total
      FROM pedidos
      WHERE DATE(created_at) = CURRENT_DATE
        AND status_pedido IN ('entregue', 'fechada', 'retirado')
    `);
    
    const transacoesResult = await db.query(`
      SELECT COUNT(*) as total, COALESCE(SUM(valor), 0) as valor_total
      FROM transacoes
      WHERE DATE(data_transacao) = CURRENT_DATE
        AND tipo = 'venda'
        AND categoria IN ('venda', 'taxa_entrega')
    `);
    
    console.log(`\n✅ Pedidos finalizados hoje: ${pedidosResult.rows[0].total}`);
    console.log(`   Valor total: R$ ${parseFloat(pedidosResult.rows[0].valor_total).toFixed(2)}`);
    
    console.log(`\n✅ Transações de venda hoje: ${transacoesResult.rows[0].total}`);
    console.log(`   Valor total: R$ ${parseFloat(transacoesResult.rows[0].valor_total).toFixed(2)}`);
    
    // 2. Testar endpoint de expenses/summary
    console.log('\n📡 Testando API /expenses/summary...');
    
    const today = new Date().toISOString().split('T')[0];
    const response = await httpGet(`${API_URL}/api/expenses/summary?data_inicio=${today}&data_fim=${today}`, {
      'Authorization': `Bearer ${process.env.TEST_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5OWE2MmIyNC03YWNkLTRiZDAtYTg0Yy05ZWUyMTY0Y2VjMjYiLCJpYXQiOjE3NTAwMDcyNDEsImV4cCI6MTc1MDA5MzY0MX0.5_1_ulF50gysLgSYF041EZMLhPwebEz12xBn2xLgh58'}`
    });
    
    if (!response.ok) {
      throw new Error(`API retornou erro: ${response.status}`);
    }
    
    const data = await response.json();
    const summary = data.summary;
    
    console.log('\n📈 Resumo Financeiro:');
    console.log(`   - Total Vendas: R$ ${summary.total_vendas.toFixed(2)}`);
    console.log(`   - Total Despesas: R$ ${summary.total_despesas.toFixed(2)}`);
    console.log(`   - Receitas Extras: R$ ${summary.total_receitas.toFixed(2)}`);
    console.log(`   - Receitas Gerais: R$ ${summary.total_receitas_geral.toFixed(2)}`);
    console.log(`   - Saldo: R$ ${summary.saldo.toFixed(2)}`);
    
    // 3. Verificar sincronização
    const sincronizado = Math.abs(
      parseFloat(pedidosResult.rows[0].valor_total) - 
      parseFloat(transacoesResult.rows[0].valor_total)
    ) < 0.01;
    
    console.log('\n🔍 Status da Sincronização:');
    if (sincronizado) {
      console.log('   ✅ SINCRONIZADO - Vendas refletem corretamente no financeiro!');
    } else {
      console.log('   ❌ DESSINCRONIZADO - Vendas não refletem no financeiro');
      console.log(`   Diferença: R$ ${Math.abs(
        parseFloat(pedidosResult.rows[0].valor_total) - 
        parseFloat(transacoesResult.rows[0].valor_total)
      ).toFixed(2)}`);
    }
    
    // 4. Dicas para o usuário
    console.log('\n💡 PRÓXIMOS PASSOS:');
    console.log('1. Acesse o Centro Financeiro (Tony)');
    console.log('2. Verifique se as vendas aparecem nas receitas');
    console.log('3. O valor deve ser R$ ' + parseFloat(pedidosResult.rows[0].valor_total).toFixed(2));
    console.log('4. Se não aparecer, limpe o cache do navegador (Ctrl+F5)');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  } finally {
    await db.pool.end();
  }
}

// Executar teste
testFinancialSync();