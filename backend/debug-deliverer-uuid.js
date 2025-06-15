const express = require('express');
const db = require('./config/database');

async function testDelivererEndpoint() {
  try {
    console.log('🔍 Simulando endpoint de pedidos disponíveis...');
    
    const query = `
      SELECT 
        p.id,
        p.total,
        p.endereco_entrega,
        p.status_pedido,
        p.data_pedido,
        p.created_at,
        p.observacoes,
        p.taxa_entrega,
        p.forma_pagamento,
        c.nome as cliente_nome,
        c.telefone as cliente_telefone
      FROM pedidos p 
      LEFT JOIN clientes c ON p.cliente_id = c.id 
      WHERE p.tipo_pedido = 'delivery' 
        AND p.status_pedido IN ('preparando', 'pronto')
        AND p.entregador_id IS NULL
      ORDER BY p.created_at ASC
      LIMIT 10
    `;
    
    console.log('\n1. Executando query...');
    const result = await db.query(query);
    console.log(`✅ Query executada! ${result.rows.length} resultados`);
    
    console.log('\n2. Dados brutos do resultado:');
    result.rows.forEach((row, index) => {
      console.log(`\n   Pedido ${index + 1}:`);
      Object.keys(row).forEach(key => {
        const value = row[key];
        const type = typeof value;
        const length = value ? value.toString().length : 'null';
        console.log(`     ${key}: '${value}' (tipo: ${type}, length: ${length})`);
        
        // Check for problematic values
        if (value === '') {
          console.log(`     🚨 EMPTY STRING encontrada em ${key}!`);
        }
        if (type === 'string' && key.includes('id') && value && value.length !== 36) {
          console.log(`     ⚠️  UUID inválido em ${key}: comprimento ${value.length} (esperado: 36)`);
        }
      });
    });
    
    console.log('\n3. Tentando processar com map (como no código original)...');
    try {
      const pedidos = result.rows.map(pedido => {
        console.log(`   Processando pedido ID: ${pedido.id}`);
        
        return {
          id: pedido.id,
          total: parseFloat(pedido.total),
          endereco: pedido.endereco_entrega,
          status: pedido.status_pedido,
          data_pedido: pedido.data_pedido,
          observacoes: pedido.observacoes,
          taxa_entrega: parseFloat(pedido.taxa_entrega || 0),
          forma_pagamento: pedido.forma_pagamento,
          tempo_espera: Math.floor((new Date() - new Date(pedido.created_at)) / 60000),
          cliente: {
            nome: pedido.cliente_nome,
            telefone: pedido.cliente_telefone
          }
        };
      });
      
      console.log('✅ Map executado com sucesso!');
      console.log(`   Pedidos processados: ${pedidos.length}`);
      
      // Show final result
      console.log('\n4. Resultado final:');
      pedidos.forEach((pedido, index) => {
        console.log(`   ${index + 1}. ID: ${pedido.id}, Cliente: ${pedido.cliente.nome}, Total: R$ ${pedido.total}`);
      });
      
    } catch (mapError) {
      console.error('❌ Erro no processamento map:', mapError.message);
      console.error('   Stack:', mapError.stack);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    console.error('   Stack:', error.stack);
  }
  
  process.exit(0);
}

testDelivererEndpoint();