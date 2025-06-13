const db = require('./config/database');

async function testOrganizacao() {
  try {
    console.log('📊 TESTANDO NOVA ORGANIZAÇÃO POR CATEGORIAS...\n');
    
    // Verificar produtos por tipo
    const tiposProdutos = ['pizza', 'bebida', 'sobremesa', 'acompanhamento', 'borda', 'outro'];
    
    for (const tipo of tiposProdutos) {
      const produtos = await db.query(`
        SELECT nome, categoria, preco_unitario 
        FROM produtos 
        WHERE tipo_produto = $1 
        ORDER BY nome
        LIMIT 5
      `, [tipo]);
      
      const total = await db.query(`
        SELECT COUNT(*) as total 
        FROM produtos 
        WHERE tipo_produto = $1
      `, [tipo]);
      
      console.log(`📁 ${tipo.toUpperCase()}: ${total.rows[0].total} produtos`);
      
      if (produtos.rows.length > 0) {
        produtos.rows.forEach(produto => {
          const preco = produto.preco_unitario ? `R$ ${parseFloat(produto.preco_unitario).toFixed(2)}` : 'Múltiplos preços';
          console.log(`   • ${produto.nome} ${produto.categoria ? `(${produto.categoria})` : ''} - ${preco}`);
        });
        if (produtos.rows.length === 5 && total.rows[0].total > 5) {
          console.log(`   ... e mais ${total.rows[0].total - 5} produtos`);
        }
      } else {
        console.log('   (Nenhum produto cadastrado)');
      }
      console.log('');
    }
    
    // Total geral
    const totalGeral = await db.query('SELECT COUNT(*) as total FROM produtos');
    console.log(`🎯 TOTAL GERAL: ${totalGeral.rows[0].total} produtos cadastrados`);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    process.exit(0);
  }
}

testOrganizacao(); 