const db = require('./config/database');

async function addBebidaExemplos() {
  try {
    console.log('🥤 ADICIONANDO EXEMPLOS DE BEBIDAS...\n');
    
    const bebidas = [
      { nome: 'Coca-Cola 2L', categoria: 'Refrigerante', preco: 8.50 },
      { nome: 'Guaraná Antarctica 2L', categoria: 'Refrigerante', preco: 8.00 },
      { nome: 'Pepsi 2L', categoria: 'Refrigerante', preco: 8.50 },
      { nome: 'Fanta Laranja 2L', categoria: 'Refrigerante', preco: 8.00 },
      { nome: 'Sprite 2L', categoria: 'Refrigerante', preco: 8.00 },
      { nome: 'Coca-Cola Lata 350ml', categoria: 'Refrigerante', preco: 4.50 },
      { nome: 'Guaraná Antarctica Lata 350ml', categoria: 'Refrigerante', preco: 4.00 },
      { nome: 'Água Mineral 500ml', categoria: 'Água', preco: 3.00 },
      { nome: 'Água com Gás 500ml', categoria: 'Água', preco: 3.50 },
      { nome: 'Suco de Laranja Natural 500ml', categoria: 'Suco', preco: 6.00 },
      { nome: 'Suco de Uva Natural 500ml', categoria: 'Suco', preco: 6.50 },
      { nome: 'Cerveja Skol 350ml', categoria: 'Cerveja', preco: 4.50 },
      { nome: 'Cerveja Brahma 350ml', categoria: 'Cerveja', preco: 4.50 }
    ];

    let adicionadas = 0;
    
    for (const bebida of bebidas) {
      try {
        await db.query(`
          INSERT INTO produtos (
            nome, tipo_produto, categoria, preco_unitario, ativo
          ) VALUES ($1, $2, $3, $4, $5)
        `, [
          bebida.nome,
          'bebida',
          bebida.categoria,
          bebida.preco,
          true
        ]);
        
        console.log(`✅ ${bebida.nome} - R$ ${bebida.preco.toFixed(2)}`);
        adicionadas++;
      } catch (error) {
        if (error.code === '23505') { // Duplicate key
          console.log(`⚠️  ${bebida.nome} já existe`);
        } else {
          console.error(`❌ Erro ao adicionar ${bebida.nome}:`, error.message);
        }
      }
    }

    console.log(`\n🎉 CONCLUÍDO! ${adicionadas} bebidas adicionadas com sucesso!`);
    
    // Verificar total de bebidas no banco
    const totalBebidas = await db.query(`
      SELECT COUNT(*) as total 
      FROM produtos 
      WHERE tipo_produto = 'bebida' AND ativo = true
    `);
    
    console.log(`📊 Total de bebidas ativas no banco: ${totalBebidas.rows[0].total}`);
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  } finally {
    process.exit(0);
  }
}

addBebidaExemplos(); 