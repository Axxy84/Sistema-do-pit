const pool = require('./config/database');

const pizzas = [
  {
    nome: 'Bacon',
    descricao: 'Molho, mussarela, bacon e orégano',
    precos: { pequena: 29.00, media: 36.00, grande: 47.00, familia: 53.00 }
  },
  {
    nome: 'Bacon com Milho',
    descricao: 'Molho, mussarela, bacon, milho verde e orégano',
    precos: { pequena: 31.00, media: 38.00, grande: 49.00, familia: 55.00 }
  },
  {
    nome: 'Baiana',
    descricao: 'Molho, mussarela, calabresa ralada, pimento calabresa, tomate em rodela e orégano',
    precos: { pequena: 29.00, media: 38.00, grande: 46.00, familia: 55.00 }
  },
  {
    nome: 'Bauru',
    descricao: 'Molho, mussarela, presunto, milho verde, e orégano',
    precos: { pequena: 28.00, media: 37.00, grande: 45.00, familia: 50.00 }
  },
  {
    nome: 'Brasileira',
    descricao: 'Molho, mussarela, ervilha, milho verde, palmito e orégano',
    precos: { pequena: 29.00, media: 38.00, grande: 43.00, familia: 49.00 }
  },
  {
    nome: 'Brócolis',
    descricao: 'Molho, mussarela, brócolis, e orégano',
    precos: { pequena: 32.00, media: 36.00, grande: 45.00, familia: 48.00 }
  },
  {
    nome: 'Brócolis com Bacon',
    descricao: 'Molho, mussarela, brócolis, bacon e orégano',
    precos: { pequena: 33.00, media: 38.00, grande: 46.00, familia: 49.00 }
  },
  {
    nome: 'Calabresa',
    descricao: 'Molho, mussarela, calabresa em rodelas, cebola e orégano',
    precos: { pequena: 28.00, media: 38.00, grande: 48.00, familia: 56.00 }
  },
  {
    nome: 'Calabresa ao Catupiry',
    descricao: 'Molho, mussarela, calabresa, catupiry, cebola e orégano',
    precos: { pequena: 30.00, media: 39.00, grande: 49.00, familia: 57.00 }
  },
  {
    nome: 'Calabresa com Cheddar',
    descricao: 'Molho, mussarela, calabresa, cheddar, cebola e orégano',
    precos: { pequena: 32.00, media: 41.00, grande: 50.00, familia: 59.00 }
  },
  {
    nome: 'Calabresa Paulista',
    descricao: 'Molho, calabresa em rodelas, cebola e orégano (sem mussarela)',
    precos: { pequena: 27.00, media: 33.00, grande: 42.00, familia: 45.00 }
  },
  {
    nome: 'Camarão',
    descricao: 'Molho, mussarela, camarão refogado, vinagrete e orégano',
    precos: { pequena: 35.00, media: 39.00, grande: 50.00, familia: 59.00 }
  },
  {
    nome: 'Camarão ao Catupiry',
    descricao: 'Molho, mussarela, camarão refogado, catupiry, vinagrete e orégano',
    precos: { pequena: 38.00, media: 42.00, grande: 53.00, familia: 62.00 }
  },
  {
    nome: 'Canadense',
    descricao: 'Molho, mussarela, lombo canadense, abacaxi, catupiry, bacon e orégano',
    precos: { pequena: 34.00, media: 39.00, grande: 45.00, familia: 52.00 }
  }
];

async function insertPizzas() {
  try {
    console.log('🍕 Iniciando inserção das pizzas do cardápio...\n');

    for (const pizza of pizzas) {
      // Preparar o array de tamanhos_precos no formato esperado
      const tamanhos_precos = [
        { id_tamanho: 'pequena', tamanho: 'Pequena', preco: pizza.precos.pequena },
        { id_tamanho: 'media', tamanho: 'Média', preco: pizza.precos.media },
        { id_tamanho: 'grande', tamanho: 'Grande', preco: pizza.precos.grande },
        { id_tamanho: 'familia', tamanho: 'Família', preco: pizza.precos.familia }
      ];

      // Verificar se a pizza já existe
      const checkQuery = 'SELECT id FROM produtos WHERE nome = $1 AND tipo_produto = $2';
      const checkResult = await pool.query(checkQuery, [pizza.nome, 'pizza']);

      if (checkResult.rows.length > 0) {
        console.log(`⚠️  Pizza "${pizza.nome}" já existe, atualizando...`);
        
        // Atualizar pizza existente
        const updateQuery = `
          UPDATE produtos 
          SET tamanhos_precos = $1,
              updated_at = NOW()
          WHERE nome = $2 AND tipo_produto = 'pizza'
        `;
        
        await pool.query(updateQuery, [
          JSON.stringify(tamanhos_precos),
          pizza.nome
        ]);
        
        console.log(`✅ Pizza "${pizza.nome}" atualizada com sucesso!`);
      } else {
        // Inserir nova pizza
        const insertQuery = `
          INSERT INTO produtos (nome, tipo_produto, categoria, tamanhos_precos, ativo)
          VALUES ($1, $2, $3, $4, $5)
        `;
        
        await pool.query(insertQuery, [
          pizza.nome,
          'pizza',
          'salgada',
          JSON.stringify(tamanhos_precos),
          true
        ]);
        
        console.log(`✅ Pizza "${pizza.nome}" inserida com sucesso!`);
      }
    }

    // Mostrar resumo
    const countQuery = 'SELECT COUNT(*) as total FROM produtos WHERE tipo_produto = $1';
    const countResult = await pool.query(countQuery, ['pizza']);
    
    console.log('\n📊 Resumo:');
    console.log(`   Total de pizzas no sistema: ${countResult.rows[0].total}`);
    console.log(`   Pizzas processadas: ${pizzas.length}`);
    
    // Mostrar algumas pizzas como exemplo
    const sampleQuery = `
      SELECT nome, tamanhos_precos 
      FROM produtos 
      WHERE tipo_produto = 'pizza' 
      ORDER BY nome 
      LIMIT 3
    `;
    const sampleResult = await pool.query(sampleQuery);
    
    console.log('\n🍕 Exemplo de pizzas inseridas:');
    sampleResult.rows.forEach(pizza => {
      console.log(`\n   ${pizza.nome}:`);
      const precos = typeof pizza.tamanhos_precos === 'string' 
        ? JSON.parse(pizza.tamanhos_precos) 
        : pizza.tamanhos_precos;
      precos.forEach(p => {
        console.log(`   - ${p.tamanho}: R$ ${p.preco.toFixed(2)}`);
      });
    });

    console.log('\n✨ Todas as pizzas foram processadas com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao inserir pizzas:', error.message);
    console.error('Detalhes:', error);
  } finally {
    // pool é gerenciado pelo módulo database.js, não precisa fechar
  }
}

// Executar o script
insertPizzas();