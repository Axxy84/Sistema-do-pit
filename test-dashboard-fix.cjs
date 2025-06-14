#!/usr/bin/env node

/**
 * Script para testar se o dashboard está funcionando após correção
 */

const http = require('http');

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibmFtZSI6IkFkbWluaXN0cmFkb3IiLCJlbWFpbCI6ImFkbWluQHBpenphcmlhLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTczOTU5MzEzOCwiZXhwIjoxNzQwMTk3OTM4fQ.Md1EvQlGEV_1zxRRoKEe93bXqI8i8YG9YFGyAjhQIoc';

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: `/api${path}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (res.statusCode === 200) {
            resolve(result);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${result.error || data}`));
          }
        } catch (e) {
          reject(new Error(`Parse error: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function testDashboard() {
  console.log('🔍 Testando endpoint /api/dashboard...\n');
  
  try {
    const data = await makeRequest('/dashboard');
    
    console.log('✅ Dashboard respondeu com sucesso!');
    console.log('\n📊 Estrutura dos dados:');
    console.log('- kpis:', data.kpis ? '✓' : '✗');
    console.log('- recentOrders:', data.recentOrders ? '✓' : '✗');
    console.log('- topPizzas:', data.topPizzas ? '✓' : '✗');
    console.log('- salesOverTime:', data.salesOverTime ? '✓' : '✗');
    
    if (data.kpis) {
      console.log('\n💰 KPIs:');
      console.log(`  - Vendas hoje: R$ ${data.kpis.salesToday}`);
      console.log(`  - Novos clientes: ${data.kpis.newCustomersToday}`);
      console.log(`  - Pizzas vendidas: ${data.kpis.pizzasSoldToday}`);
      console.log(`  - Pedidos pendentes: ${data.kpis.pendingOrders}`);
    }
    
    console.log('\n✅ Tudo funcionando corretamente!');
    
  } catch (error) {
    console.error('❌ Erro ao testar dashboard:', error.message);
  }
}

testDashboard();