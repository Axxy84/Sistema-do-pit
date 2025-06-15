const db = require('./config/database');

async function createTransacoesTable() {
  try {
    console.log('🔧 Criando tabela de transações financeiras...\n');
    
    // Garantir que a extensão UUID está habilitada
    await db.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    
    // Criar tabela transacoes para sincronização automática
    await db.query(`
      CREATE TABLE IF NOT EXISTS transacoes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('venda', 'despesa', 'receita')),
        pedido_id UUID REFERENCES pedidos(id),
        despesa_receita_id UUID REFERENCES despesas_receitas(id),
        valor DECIMAL(10,2) NOT NULL,
        forma_pagamento VARCHAR(50),
        descricao TEXT,
        data_transacao DATE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ Tabela transacoes criada com sucesso!');
    
    // Criar índices para melhor performance
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_transacoes_data ON transacoes(data_transacao);
      CREATE INDEX IF NOT EXISTS idx_transacoes_tipo ON transacoes(tipo);
      CREATE INDEX IF NOT EXISTS idx_transacoes_pedido ON transacoes(pedido_id);
    `);
    
    console.log('✅ Índices criados com sucesso!');
    
    // Criar trigger para sincronizar pedidos com transações
    await db.query(`
      CREATE OR REPLACE FUNCTION sync_pedido_to_transacao()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Quando um pedido é entregue ou fechado, criar transação
        IF NEW.status_pedido IN ('entregue', 'fechada') AND 
           (OLD.status_pedido IS NULL OR OLD.status_pedido NOT IN ('entregue', 'fechada')) THEN
          
          INSERT INTO transacoes (
            tipo,
            pedido_id,
            valor,
            forma_pagamento,
            descricao,
            data_transacao
          ) VALUES (
            'venda',
            NEW.id,
            NEW.total,
            NEW.forma_pagamento,
            'Pedido ' || NEW.tipo_pedido || ' #' || LEFT(NEW.id::TEXT, 8),
            COALESCE(DATE(NEW.data_pedido), DATE(NEW.created_at))
          );
          
        END IF;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    console.log('✅ Função de trigger criada!');
    
    // Criar o trigger
    await db.query(`
      DROP TRIGGER IF EXISTS trigger_sync_pedido_transacao ON pedidos;
      
      CREATE TRIGGER trigger_sync_pedido_transacao
      AFTER INSERT OR UPDATE ON pedidos
      FOR EACH ROW
      EXECUTE FUNCTION sync_pedido_to_transacao();
    `);
    
    console.log('✅ Trigger de sincronização criado!');
    
    // Sincronizar pedidos existentes
    const result = await db.query(`
      INSERT INTO transacoes (tipo, pedido_id, valor, forma_pagamento, descricao, data_transacao)
      SELECT 
        'venda',
        id,
        total,
        forma_pagamento,
        'Pedido ' || tipo_pedido || ' #' || LEFT(id::TEXT, 8),
        COALESCE(DATE(data_pedido), DATE(created_at))
      FROM pedidos
      WHERE status_pedido IN ('entregue', 'fechada')
        AND NOT EXISTS (
          SELECT 1 FROM transacoes WHERE pedido_id = pedidos.id
        )
    `);
    
    console.log(`✅ ${result.rowCount} pedidos sincronizados com transações!`);
    
    // Verificar resultado
    const count = await db.query('SELECT COUNT(*) FROM transacoes');
    console.log(`\n📊 Total de transações na tabela: ${count.rows[0].count}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao criar tabela:', error);
    process.exit(1);
  }
}

createTransacoesTable();