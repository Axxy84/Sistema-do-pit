#!/usr/bin/env node

/**
 * Script de teste para verificar sincronização de entrega com Dashboard e Caixa
 * 
 * Este script testa se ao marcar um pedido como entregue:
 * 1. O Dashboard é atualizado imediatamente
 * 2. O Fechamento de Caixa reflete a mudança
 * 3. As seções de Delivery e Mesa são atualizadas separadamente
 */

const http = require('http');

// Configurações
const API_URL = 'http://localhost:3001/api';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibmFtZSI6IkFkbWluaXN0cmFkb3IiLCJlbWFpbCI6ImFkbWluQHBpenphcmlhLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTczOTU5MzEzOCwiZXhwIjoxNzQwMTk3OTM4fQ.Md1EvQlGEV_1zxRRoKEe93bXqI8i8YG9YFGyAjhQIoc';

// Cores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Função para fazer requisições HTTP
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: `/api${path}`,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(response);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${response.error || body}`));
          }
        } catch (e) {
          reject(new Error(`Parse error: ${body}`));
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testSyncEntrega() {
  try {
    log('\n=== TESTE DE SINCRONIZAÇÃO DE ENTREGA ===\n', 'cyan');
    
    // 1. Buscar pedidos pendentes
    log('1. Buscando pedidos pendentes...', 'yellow');
    const ordersResponse = await makeRequest('GET', '/orders?status=pendente,preparando,pronto,saiu_para_entrega');
    const orders = ordersResponse.orders || [];
    
    if (orders.length === 0) {
      log('Nenhum pedido pendente encontrado. Criando um pedido de teste...', 'yellow');
      
      // Criar pedido de teste
      const newOrder = {
        tipo_pedido: 'delivery',
        cliente_id: 1,
        endereco_entrega: 'Rua Teste, 123',
        forma_pagamento: 'dinheiro',
        valor_troco: 0,
        items: [{
          produto_id: 1,
          quantidade: 1,
          preco_unitario: 35.00,
          observacoes: 'Teste de sincronização'
        }]
      };
      
      const createResponse = await makeRequest('POST', '/orders', newOrder);
      log(`✅ Pedido criado: ID ${createResponse.order.id}`, 'green');
      orders.push(createResponse.order);
    }
    
    const order = orders[0];
    log(`✅ Pedido encontrado: ID ${order.id} - Status: ${order.status_pedido}`, 'green');
    
    // 2. Capturar estado inicial do Dashboard
    log('\n2. Capturando estado inicial do Dashboard...', 'yellow');
    const dashboardBefore = await makeRequest('GET', '/dashboard');
    log(`Dashboard antes:`, 'blue');
    log(`  - Vendas do dia: R$ ${dashboardBefore.kpis?.salesToday || 0}`, 'blue');
    log(`  - Pedidos pendentes: ${dashboardBefore.kpis?.pendingOrders || 0}`, 'blue');
    
    // 3. Capturar estado inicial do Fechamento de Caixa
    log('\n3. Capturando estado inicial do Fechamento de Caixa...', 'yellow');
    const cashBefore = await makeRequest('GET', '/cash-closing/current');
    log(`Caixa antes:`, 'blue');
    log(`  - Total vendas: R$ ${cashBefore.cash_closing?.vendas_brutas || 0}`, 'blue');
    log(`  - Pedidos entregues: ${cashBefore.cash_closing?.total_pedidos || 0}`, 'blue');
    
    // 4. Marcar pedido como entregue
    log('\n4. Marcando pedido como ENTREGUE...', 'yellow');
    await makeRequest('PATCH', `/orders/${order.id}/status`, { status_pedido: 'entregue' });
    log(`✅ Pedido ${order.id} marcado como ENTREGUE`, 'green');
    
    // 5. Aguardar sincronização (simular delay de propagação de eventos)
    log('\n5. Aguardando sincronização (2 segundos)...', 'yellow');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 6. Verificar Dashboard atualizado
    log('\n6. Verificando Dashboard após entrega...', 'yellow');
    const dashboardAfter = await makeRequest('GET', '/dashboard');
    log(`Dashboard depois:`, 'green');
    log(`  - Vendas do dia: R$ ${dashboardAfter.kpis?.salesToday || 0}`, 'green');
    log(`  - Pedidos pendentes: ${dashboardAfter.kpis?.pendingOrders || 0}`, 'green');
    
    // 7. Verificar Fechamento de Caixa atualizado
    log('\n7. Verificando Fechamento de Caixa após entrega...', 'yellow');
    const cashAfter = await makeRequest('GET', '/cash-closing/current');
    log(`Caixa depois:`, 'green');
    log(`  - Total vendas: R$ ${cashAfter.cash_closing?.vendas_brutas || 0}`, 'green');
    log(`  - Pedidos entregues: ${cashAfter.cash_closing?.total_pedidos || 0}`, 'green');
    
    // 8. Verificar fechamento separado
    if (order.tipo_pedido === 'delivery') {
      log('\n8. Verificando fechamento separado (Delivery)...', 'yellow');
      const today = new Date().toISOString().split('T')[0];
      const separateData = await makeRequest('GET', `/cash-closing/separate/summary/${today}`);
      log(`Fechamento Delivery:`, 'green');
      log(`  - Total pedidos: ${separateData.delivery?.total_pedidos || 0}`, 'green');
      log(`  - Vendas brutas: R$ ${separateData.delivery?.vendas_brutas || 0}`, 'green');
    }
    
    // 9. Análise de resultados
    log('\n=== ANÁLISE DE RESULTADOS ===', 'cyan');
    
    const vendasAumentou = (dashboardAfter.kpis?.salesToday || 0) > (dashboardBefore.kpis?.salesToday || 0);
    const pendentesdiminuiu = (dashboardAfter.kpis?.pendingOrders || 0) < (dashboardBefore.kpis?.pendingOrders || 0);
    const caixaAtualizado = (cashAfter.cash_closing?.total_pedidos || 0) > (cashBefore.cash_closing?.total_pedidos || 0);
    
    log(`✅ Dashboard - Vendas aumentaram: ${vendasAumentou ? 'SIM' : 'NÃO'}`, vendasAumentou ? 'green' : 'red');
    log(`✅ Dashboard - Pendentes diminuíram: ${pendentesdiminuiu ? 'SIM' : 'NÃO'}`, pendentesdiminuiu ? 'green' : 'red');
    log(`✅ Caixa - Total pedidos aumentou: ${caixaAtualizado ? 'SIM' : 'NÃO'}`, caixaAtualizado ? 'green' : 'red');
    
    if (vendasAumentou && pendentesdiminuiu && caixaAtualizado) {
      log('\n🎉 SUCESSO! Sincronização funcionando corretamente!', 'green');
    } else {
      log('\n❌ FALHA! Sincronização não está funcionando completamente.', 'red');
    }
    
  } catch (error) {
    log(`\n❌ Erro durante o teste: ${error.message}`, 'red');
    console.error(error);
  }
}

// Executar teste
testSyncEntrega();