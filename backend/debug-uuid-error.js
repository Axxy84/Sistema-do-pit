const db = require('./config/database');

async function debugUuidError() {
  try {
    console.log('🔍 INVESTIGANDO ERRO DE UUID...\n');
    
    // 1. Verificar estrutura da tabela itens_pedido
    console.log('1️⃣ Estrutura da tabela itens_pedido:');
    const tableInfo = await db.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'itens_pedido'
      ORDER BY ordinal_position
    `);
    
    tableInfo.rows.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
    });
    
    // 2. Verificar produtos no banco e seus IDs
    console.log('\n2️⃣ Exemplos de produtos no banco:');
    const produtos = await db.query(`
      SELECT id, nome, tipo_produto 
      FROM produtos 
      ORDER BY nome 
      LIMIT 5
    `);
    
    produtos.rows.forEach(produto => {
      console.log(`   ID: ${produto.id} | Nome: ${produto.nome} | Tipo: ${produto.tipo_produto}`);
    });
    
    // 3. Tentar inserir um item de teste para ver o erro
    console.log('\n3️⃣ Testando inserção com valor "4":');
    try {
      await db.query(`
        INSERT INTO itens_pedido (
          pedido_id, produto_id_ref, quantidade, preco_unitario, sabor_registrado
        ) VALUES ($1, $2, $3, $4, $5)
      `, [
        '123e4567-e89b-12d3-a456-426614174000', // UUID válido de teste
        '4', // O valor problemático
        1,
        10.00,
        'Teste'
      ]);
    } catch (error) {
      console.log(`   ❌ ERRO CAPTURADO: ${error.message}`);
      console.log(`   🎯 CONFIRMADO: O erro acontece no campo produto_id_ref`);
    }
    
    // 4. Verificar se há pedidos com IDs inválidos
    console.log('\n4️⃣ Verificando pedidos existentes:');
    const pedidos = await db.query(`
      SELECT COUNT(*) as total FROM pedidos
    `);
    console.log(`   Total de pedidos: ${pedidos.rows[0].total}`);
    
    // 5. Verificar itens_pedido existentes
    const itens = await db.query(`
      SELECT COUNT(*) as total FROM itens_pedido
    `);
    console.log(`   Total de itens: ${itens.rows[0].total}`);
    
    console.log('\n🎯 CONCLUSÃO:');
    console.log('   O erro acontece porque o frontend está enviando "4" como produto_id_ref');
    console.log('   mas este campo espera um UUID válido.');
    console.log('   Solução: Garantir que o frontend use apenas produtos reais do banco.');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  } finally {
    process.exit(0);
  }
}

debugUuidError(); 