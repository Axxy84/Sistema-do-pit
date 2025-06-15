const db = require('./config/database');

/**
 * Script completo para corrigir sincronização financeira
 * Adiciona categoria à tabela transacoes e sincroniza vendas
 */

async function fixFinancialSync() {
  console.log('🔧 Correção Completa da Sincronização Financeira\n');
  
  try {
    // 1. Adicionar coluna categoria se não existir
    console.log('1️⃣ Verificando coluna categoria...');
    
    const categoryExists = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'transacoes' 
        AND column_name = 'categoria'
    `);

    if (categoryExists.rows.length === 0) {
      console.log('   📝 Adicionando coluna categoria...');
      await db.query(`
        ALTER TABLE transacoes 
        ADD COLUMN categoria VARCHAR(100)
      `);
      console.log('   ✅ Coluna categoria adicionada!');
    } else {
      console.log('   ✅ Coluna categoria já existe');
    }

    // 2. Criar função e trigger para sincronização automática
    console.log('\n2️⃣ Criando sincronização automática...');
    
    // Criar função
    await db.query(`
      CREATE OR REPLACE FUNCTION sync_pedido_to_transacao()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Só sincronizar quando pedido for finalizado
        IF NEW.status_pedido IN ('entregue', 'fechada', 'retirado') AND 
           (OLD.status_pedido IS NULL OR OLD.status_pedido NOT IN ('entregue', 'fechada', 'retirado')) THEN
          
          -- Inserir transação de venda
          INSERT INTO transacoes (
            tipo, categoria, descricao, valor, forma_pagamento, 
            data_transacao, pedido_id, created_at
          ) VALUES (
            'venda',
            'venda',
            'Pedido - ' || NEW.tipo_pedido || ' - ID: ' || NEW.id,
            NEW.total - COALESCE(NEW.desconto_aplicado, 0),
            NEW.forma_pagamento,
            COALESCE(NEW.data_pedido, NEW.created_at),
            NEW.id,
            NOW()
          );
          
          -- Se tem taxa de entrega, criar registro separado
          IF NEW.taxa_entrega IS NOT NULL AND NEW.taxa_entrega > 0 THEN
            INSERT INTO transacoes (
              tipo, categoria, descricao, valor, forma_pagamento,
              data_transacao, pedido_id, created_at
            ) VALUES (
              'venda',
              'taxa_entrega',
              'Taxa entrega - Pedido ID: ' || NEW.id,
              NEW.taxa_entrega,
              NEW.forma_pagamento,
              COALESCE(NEW.data_pedido, NEW.created_at),
              NEW.id,
              NOW()
            );
          END IF;
        END IF;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    // Criar trigger
    await db.query(`DROP TRIGGER IF EXISTS trigger_sync_pedido_to_transacao ON pedidos`);
    await db.query(`
      CREATE TRIGGER trigger_sync_pedido_to_transacao
      AFTER INSERT OR UPDATE ON pedidos
      FOR EACH ROW
      EXECUTE FUNCTION sync_pedido_to_transacao()
    `);
    
    console.log('   ✅ Trigger de sincronização criado!');

    // 3. Sincronizar pedidos existentes
    console.log('\n3️⃣ Sincronizando pedidos existentes...');
    
    // Verificar se pedido_id existe, se não, adicionar
    const pedidoIdExists = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'transacoes' 
        AND column_name = 'pedido_id'
    `);
    
    if (pedidoIdExists.rows.length === 0) {
      console.log('   📝 Adicionando coluna pedido_id...');
      
      // Verificar tipo de ID em pedidos
      const pedidoIdType = await db.query(`
        SELECT data_type 
        FROM information_schema.columns 
        WHERE table_name = 'pedidos' 
          AND column_name = 'id'
      `);
      
      const idType = pedidoIdType.rows[0]?.data_type === 'uuid' ? 'UUID' : 'INTEGER';
      await db.query(`ALTER TABLE transacoes ADD COLUMN pedido_id ${idType} REFERENCES pedidos(id)`);
      console.log('   ✅ Coluna pedido_id adicionada!');
    }
    
    const pedidosResult = await db.query(`
      SELECT 
        p.id,
        p.total,
        p.desconto_aplicado,
        p.taxa_entrega,
        p.forma_pagamento,
        p.tipo_pedido,
        p.status_pedido,
        p.created_at,
        p.data_pedido,
        c.nome as cliente_nome
      FROM pedidos p
      LEFT JOIN clientes c ON p.cliente_id = c.id
      WHERE p.status_pedido IN ('entregue', 'fechada', 'retirado')
        AND NOT EXISTS (
          SELECT 1 FROM transacoes t 
          WHERE t.pedido_id = p.id
        )
      ORDER BY p.created_at DESC
    `);

    console.log(`   📊 Encontrados ${pedidosResult.rows.length} pedidos sem transação`);

    let successCount = 0;
    let totalValue = 0;

    for (const pedido of pedidosResult.rows) {
      try {
        const valorLiquido = parseFloat(pedido.total) - parseFloat(pedido.desconto_aplicado || 0);
        
        // Inserir transação de venda
        await db.query(`
          INSERT INTO transacoes (
            tipo, categoria, descricao, valor, forma_pagamento,
            data_transacao, pedido_id, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        `, [
          'venda',
          'venda',
          `Pedido ${pedido.tipo_pedido} - ${pedido.cliente_nome || 'Cliente'} - ID: ${pedido.id}`,
          valorLiquido,
          pedido.forma_pagamento,
          pedido.data_pedido || pedido.created_at,
          pedido.id
        ]);

        // Taxa de entrega se houver
        if (pedido.taxa_entrega && parseFloat(pedido.taxa_entrega) > 0) {
          await db.query(`
            INSERT INTO transacoes (
              tipo, categoria, descricao, valor, forma_pagamento,
              data_transacao, pedido_id, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
          `, [
            'venda',
            'taxa_entrega',
            `Taxa de entrega - Pedido ID: ${pedido.id}`,
            parseFloat(pedido.taxa_entrega),
            pedido.forma_pagamento,
            pedido.data_pedido || pedido.created_at,
            pedido.id
          ]);
        }

        successCount++;
        totalValue += valorLiquido;
        
      } catch (error) {
        console.error(`   ❌ Erro ao sincronizar pedido ${pedido.id}:`, error.message);
      }
    }

    if (successCount > 0) {
      console.log(`   ✅ ${successCount} pedidos sincronizados`);
      console.log(`   💰 Total sincronizado: R$ ${totalValue.toFixed(2)}`);
    }

    // 4. Verificar resultado final
    console.log('\n4️⃣ Verificando resultado final...');
    
    const pedidosTotal = await db.query(`
      SELECT COUNT(*) as total, COALESCE(SUM(total - COALESCE(desconto_aplicado, 0)), 0) as valor
      FROM pedidos
      WHERE status_pedido IN ('entregue', 'fechada', 'retirado')
    `);
    
    const transacoesTotal = await db.query(`
      SELECT COUNT(*) as total, COALESCE(SUM(valor), 0) as valor
      FROM transacoes
      WHERE tipo = 'venda' AND categoria IN ('venda', 'taxa_entrega')
    `);
    
    console.log(`\n✅ SINCRONIZAÇÃO COMPLETA:`);
    console.log(`   - Pedidos finalizados: ${pedidosTotal.rows[0].total}`);
    console.log(`   - Transações de venda: ${transacoesTotal.rows[0].total}`);
    
    const diferenca = Math.abs(
      parseFloat(pedidosTotal.rows[0].valor) - 
      parseFloat(transacoesTotal.rows[0].valor)
    );
    
    if (diferenca < 0.01) {
      console.log(`   - Status: ✅ SINCRONIZADO`);
    } else {
      console.log(`   - Status: ⚠️ Diferença de R$ ${diferenca.toFixed(2)}`);
    }
    
    console.log('\n🎉 Sistema financeiro corrigido!');
    console.log('📌 Próximos passos:');
    console.log('   1. Acesse o Centro Financeiro (Tony)');
    console.log('   2. As vendas agora devem aparecer nas receitas');
    console.log('   3. Novos pedidos serão sincronizados automaticamente');
    
  } catch (error) {
    console.error('❌ Erro durante correção:', error);
  } finally {
    await db.pool.end();
  }
}

// Executar
fixFinancialSync();