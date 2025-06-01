import { query } from './db.js';

async function debugCashClosing() {
    console.log('=== DEBUG FECHAMENTO DE CAIXA ===\n');
    
    try {
        // 1. Verificar total de pedidos no banco
        const allOrders = await query('SELECT COUNT(*) as total FROM pedidos');
        console.log('1. Total de pedidos no banco:', allOrders.rows[0].total);
        
        // 2. Verificar pedidos por status
        const ordersByStatus = await query(`
            SELECT status_pedido, COUNT(*) as total 
            FROM pedidos 
            GROUP BY status_pedido
        `);
        console.log('\n2. Pedidos por status:');
        ordersByStatus.rows.forEach(row => {
            console.log(`   - ${row.status_pedido}: ${row.total}`);
        });
        
        // 3. Verificar pedidos ENTREGUES de hoje
        const today = new Date().toISOString().split('T')[0];
        console.log('\n3. Verificando pedidos ENTREGUES de hoje:', today);
        
        const todayDelivered = await query(`
            SELECT id, total, forma_pagamento, created_at, data_pedido
            FROM pedidos 
            WHERE status_pedido = 'entregue'
            AND DATE(COALESCE(data_pedido, created_at)) = $1
        `, [today]);
        
        console.log('   Pedidos entregues hoje:', todayDelivered.rows.length);
        if (todayDelivered.rows.length > 0) {
            const total = todayDelivered.rows.reduce((sum, order) => sum + parseFloat(order.total), 0);
            console.log('   Total em vendas:', total.toFixed(2));
            console.log('   Detalhes:');
            todayDelivered.rows.forEach(order => {
                console.log(`     - ID: ${order.id.slice(-8)}, Total: R$ ${order.total}, Pagamento: ${order.forma_pagamento}`);
            });
        }
        
        // 4. Verificar se há diferença entre created_at e data_pedido
        const dateIssues = await query(`
            SELECT id, created_at, data_pedido,
                   DATE(created_at) as created_date,
                   DATE(data_pedido) as order_date
            FROM pedidos
            WHERE DATE(created_at) != DATE(data_pedido)
            OR data_pedido IS NULL
            LIMIT 5
        `);
        
        if (dateIssues.rows.length > 0) {
            console.log('\n4. ⚠️  ATENÇÃO: Pedidos com datas inconsistentes:');
            dateIssues.rows.forEach(order => {
                console.log(`   - ID: ${order.id.slice(-8)}`);
                console.log(`     created_at: ${order.created_date}`);
                console.log(`     data_pedido: ${order.order_date || 'NULL'}`);
            });
        }
        
        // 5. Verificar estrutura da busca
        console.log('\n5. Testando query de busca do orderService:');
        const testQuery = await query(`
            SELECT id, total, status_pedido, forma_pagamento
            FROM pedidos
            WHERE DATE(COALESCE(data_pedido, created_at)) >= $1
            AND DATE(COALESCE(data_pedido, created_at)) <= $2
            AND status_pedido = 'entregue'
        `, [today, today]);
        
        console.log('   Resultado da query:', testQuery.rows.length, 'pedidos');
        
        // 6. Sugestão de correção
        console.log('\n6. SUGESTÕES DE CORREÇÃO:');
        console.log('   - Verificar se o campo data_pedido está sendo preenchido corretamente');
        console.log('   - Verificar timezone do servidor vs cliente');
        console.log('   - Confirmar que os pedidos estão sendo marcados como "entregue"');
        console.log('   - Verificar se a API está usando os parâmetros de data corretamente');
        
    } catch (error) {
        console.error('Erro no debug:', error);
    }
}

debugCashClosing(); 