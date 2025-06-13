const db = require('./config/database');

const pitStopMenu = {
  // PIZZAS SALGADAS
  pizzasSalgadas: [
    {
      nome: "Alho Frito",
      ingredientes: "Molho, mussarela, alho frito e orégano",
      tamanhos_precos: [
        { id_tamanho: "pequena", tamanho: "Pequena", preco: 29.00 },
        { id_tamanho: "media", tamanho: "Média", preco: 36.00 },
        { id_tamanho: "grande", tamanho: "Grande", preco: 47.00 },
        { id_tamanho: "familia", tamanho: "Família", preco: 53.00 }
      ]
    },
    {
      nome: "Atum",
      ingredientes: "Molho, mussarela, atum, cebola e orégano",
      tamanhos_precos: [
        { id_tamanho: "pequena", tamanho: "Pequena", preco: 29.00 },
        { id_tamanho: "media", tamanho: "Média", preco: 38.00 },
        { id_tamanho: "grande", tamanho: "Grande", preco: 46.00 },
        { id_tamanho: "familia", tamanho: "Família", preco: 55.00 }
      ]
    },
    {
      nome: "Bacon",
      ingredientes: "Molho, mussarela, bacon e orégano",
      tamanhos_precos: [
        { id_tamanho: "pequena", tamanho: "Pequena", preco: 29.00 },
        { id_tamanho: "media", tamanho: "Média", preco: 36.00 },
        { id_tamanho: "grande", tamanho: "Grande", preco: 47.00 },
        { id_tamanho: "familia", tamanho: "Família", preco: 53.00 }
      ]
    },
    {
      nome: "Bacon com Milho",
      ingredientes: "Molho, mussarela, bacon, milho verde e orégano",
      tamanhos_precos: [
        { id_tamanho: "pequena", tamanho: "Pequena", preco: 31.00 },
        { id_tamanho: "media", tamanho: "Média", preco: 38.00 },
        { id_tamanho: "grande", tamanho: "Grande", preco: 49.00 },
        { id_tamanho: "familia", tamanho: "Família", preco: 55.00 }
      ]
    },
    {
      nome: "Baiana",
      ingredientes: "Molho, mussarela, calabresa ralada, pimento calabresa, tomate em rodela e orégano",
      tamanhos_precos: [
        { id_tamanho: "pequena", tamanho: "Pequena", preco: 29.00 },
        { id_tamanho: "media", tamanho: "Média", preco: 38.00 },
        { id_tamanho: "grande", tamanho: "Grande", preco: 46.00 },
        { id_tamanho: "familia", tamanho: "Família", preco: 55.00 }
      ]
    },
    {
      nome: "Bauru",
      ingredientes: "Molho, mussarela, presunto, milho verde e orégano",
      tamanhos_precos: [
        { id_tamanho: "pequena", tamanho: "Pequena", preco: 28.00 },
        { id_tamanho: "media", tamanho: "Média", preco: 37.00 },
        { id_tamanho: "grande", tamanho: "Grande", preco: 45.00 },
        { id_tamanho: "familia", tamanho: "Família", preco: 50.00 }
      ]
    },
    {
      nome: "Brasileira",
      ingredientes: "Molho, mussarela, ervilha, milho verde, palmito e orégano",
      tamanhos_precos: [
        { id_tamanho: "pequena", tamanho: "Pequena", preco: 29.00 },
        { id_tamanho: "media", tamanho: "Média", preco: 38.00 },
        { id_tamanho: "grande", tamanho: "Grande", preco: 43.00 },
        { id_tamanho: "familia", tamanho: "Família", preco: 49.00 }
      ]
    },
    {
      nome: "Brócolis",
      ingredientes: "Molho, mussarela, brócolis e orégano",
      tamanhos_precos: [
        { id_tamanho: "pequena", tamanho: "Pequena", preco: 32.00 },
        { id_tamanho: "media", tamanho: "Média", preco: 36.00 },
        { id_tamanho: "grande", tamanho: "Grande", preco: 45.00 },
        { id_tamanho: "familia", tamanho: "Família", preco: 48.00 }
      ]
    },
    {
      nome: "Brócolis com Bacon",
      ingredientes: "Molho, mussarela, brócolis, bacon e orégano",
      tamanhos_precos: [
        { id_tamanho: "pequena", tamanho: "Pequena", preco: 33.00 },
        { id_tamanho: "media", tamanho: "Média", preco: 38.00 },
        { id_tamanho: "grande", tamanho: "Grande", preco: 46.00 },
        { id_tamanho: "familia", tamanho: "Família", preco: 49.00 }
      ]
    },
    {
      nome: "Calabresa",
      ingredientes: "Molho, mussarela, calabresa em rodelas, cebola e orégano",
      tamanhos_precos: [
        { id_tamanho: "pequena", tamanho: "Pequena", preco: 28.00 },
        { id_tamanho: "media", tamanho: "Média", preco: 38.00 },
        { id_tamanho: "grande", tamanho: "Grande", preco: 48.00 },
        { id_tamanho: "familia", tamanho: "Família", preco: 56.00 }
      ]
    },
    {
      nome: "Calabresa ao Catupiry",
      ingredientes: "Molho, mussarela, calabresa, catupiry, cebola e orégano",
      tamanhos_precos: [
        { id_tamanho: "pequena", tamanho: "Pequena", preco: 30.00 },
        { id_tamanho: "media", tamanho: "Média", preco: 39.00 },
        { id_tamanho: "grande", tamanho: "Grande", preco: 49.00 },
        { id_tamanho: "familia", tamanho: "Família", preco: 57.00 }
      ]
    },
    {
      nome: "Calabresa com Cheddar",
      ingredientes: "Molho, mussarela, calabresa, cheddar, cebola e orégano",
      tamanhos_precos: [
        { id_tamanho: "pequena", tamanho: "Pequena", preco: 32.00 },
        { id_tamanho: "media", tamanho: "Média", preco: 41.00 },
        { id_tamanho: "grande", tamanho: "Grande", preco: 50.00 },
        { id_tamanho: "familia", tamanho: "Família", preco: 59.00 }
      ]
    },
    {
      nome: "Calabresa Paulista (sem mussarela)",
      ingredientes: "Molho, calabresa em rodelas, cebola e orégano",
      tamanhos_precos: [
        { id_tamanho: "pequena", tamanho: "Pequena", preco: 27.00 },
        { id_tamanho: "media", tamanho: "Média", preco: 33.00 },
        { id_tamanho: "grande", tamanho: "Grande", preco: 42.00 },
        { id_tamanho: "familia", tamanho: "Família", preco: 45.00 }
      ]
    },
    {
      nome: "Camarão",
      ingredientes: "Molho, mussarela, camarão refogado, vinagrete e orégano",
      tamanhos_precos: [
        { id_tamanho: "pequena", tamanho: "Pequena", preco: 35.00 },
        { id_tamanho: "media", tamanho: "Média", preco: 39.00 },
        { id_tamanho: "grande", tamanho: "Grande", preco: 50.00 },
        { id_tamanho: "familia", tamanho: "Família", preco: 59.00 }
      ]
    },
    {
      nome: "Camarão ao Catupiry",
      ingredientes: "Molho, mussarela, camarão refogado, catupiry, vinagrete e orégano",
      tamanhos_precos: [
        { id_tamanho: "pequena", tamanho: "Pequena", preco: 38.00 },
        { id_tamanho: "media", tamanho: "Média", preco: 42.00 },
        { id_tamanho: "grande", tamanho: "Grande", preco: 53.00 },
        { id_tamanho: "familia", tamanho: "Família", preco: 62.00 }
      ]
    },
    {
      nome: "Canadense",
      ingredientes: "Molho, mussarela, lombo canadense, abacaxi, catupiry, bacon e orégano",
      tamanhos_precos: [
        { id_tamanho: "pequena", tamanho: "Pequena", preco: 34.00 },
        { id_tamanho: "media", tamanho: "Média", preco: 39.00 },
        { id_tamanho: "grande", tamanho: "Grande", preco: 45.00 },
        { id_tamanho: "familia", tamanho: "Família", preco: 52.00 }
      ]
    },
    {
      nome: "Frango ao Catupiry",
      ingredientes: "Molho, mussarela, peito de frango e orégano",
      tamanhos_precos: [
        { id_tamanho: "pequena", tamanho: "Pequena", preco: 29.00 },
        { id_tamanho: "media", tamanho: "Média", preco: 36.00 },
        { id_tamanho: "grande", tamanho: "Grande", preco: 47.00 },
        { id_tamanho: "familia", tamanho: "Família", preco: 53.00 }
      ]
    },
    {
      nome: "Marguerita",
      ingredientes: "Molho, mussarela, tomate, manjericão e orégano",
      tamanhos_precos: [
        { id_tamanho: "pequena", tamanho: "Pequena", preco: 28.00 },
        { id_tamanho: "media", tamanho: "Média", preco: 35.00 },
        { id_tamanho: "grande", tamanho: "Grande", preco: 42.00 },
        { id_tamanho: "familia", tamanho: "Família", preco: 48.00 }
      ]
    },
    {
      nome: "Luzitana",
      ingredientes: "Molho, mussarela, ervilha, ovo, cebola e orégano",
      tamanhos_precos: [
        { id_tamanho: "pequena", tamanho: "Pequena", preco: 30.00 },
        { id_tamanho: "media", tamanho: "Média", preco: 37.00 },
        { id_tamanho: "grande", tamanho: "Grande", preco: 44.00 },
        { id_tamanho: "familia", tamanho: "Família", preco: 51.00 }
      ]
    },
    {
      nome: "Milho Verde",
      ingredientes: "Molho, mussarela, milho verde e orégano",
      tamanhos_precos: [
        { id_tamanho: "pequena", tamanho: "Pequena", preco: 27.00 },
        { id_tamanho: "media", tamanho: "Média", preco: 34.00 },
        { id_tamanho: "grande", tamanho: "Grande", preco: 41.00 },
        { id_tamanho: "familia", tamanho: "Família", preco: 47.00 }
      ]
    },
    {
      nome: "Mussarela",
      ingredientes: "Molho, mussarela, tomate em rodela e orégano",
      tamanhos_precos: [
        { id_tamanho: "pequena", tamanho: "Pequena", preco: 26.00 },
        { id_tamanho: "media", tamanho: "Média", preco: 33.00 },
        { id_tamanho: "grande", tamanho: "Grande", preco: 40.00 },
        { id_tamanho: "familia", tamanho: "Família", preco: 46.00 }
      ]
    },
    {
      nome: "Portuguesa sem Palmito",
      ingredientes: "Molho, mussarela, presunto, cebola, vinagrete, milho verde, ovos, pimentão e orégano",
      tamanhos_precos: [
        { id_tamanho: "pequena", tamanho: "Pequena", preco: 32.00 },
        { id_tamanho: "media", tamanho: "Média", preco: 39.00 },
        { id_tamanho: "grande", tamanho: "Grande", preco: 46.00 },
        { id_tamanho: "familia", tamanho: "Família", preco: 53.00 }
      ]
    },
    {
      nome: "Lombo",
      ingredientes: "Molho, mussarela, presunto, lombo canadense e orégano",
      tamanhos_precos: [
        { id_tamanho: "pequena", tamanho: "Pequena", preco: 31.00 },
        { id_tamanho: "media", tamanho: "Média", preco: 38.00 },
        { id_tamanho: "grande", tamanho: "Grande", preco: 45.00 },
        { id_tamanho: "familia", tamanho: "Família", preco: 52.00 }
      ]
    }
  ],

  // PIZZAS DOCES
  pizzasDoces: [
    {
      nome: "Abacaxi Gratinado",
      ingredientes: "Leite condensado, mussarela, abacaxi em cubos gratinado e canela em pó",
      tamanhos_precos: [
        { id_tamanho: "pequena", tamanho: "Pequena", preco: 31.00 },
        { id_tamanho: "media", tamanho: "Média", preco: 35.00 },
        { id_tamanho: "grande", tamanho: "Grande", preco: 39.00 },
        { id_tamanho: "familia", tamanho: "Família", preco: 45.00 }
      ]
    },
    {
      nome: "Abacaxi ao Chocolate",
      ingredientes: "Leite condensado, abacaxi e chocolate branco",
      tamanhos_precos: [
        { id_tamanho: "pequena", tamanho: "Pequena", preco: 34.00 },
        { id_tamanho: "media", tamanho: "Média", preco: 38.00 },
        { id_tamanho: "grande", tamanho: "Grande", preco: 42.00 },
        { id_tamanho: "familia", tamanho: "Família", preco: 48.00 }
      ]
    },
    {
      nome: "Banana Caramelizada",
      ingredientes: "Leite condensado, mussarela, banana caramelizada e canela em pó",
      tamanhos_precos: [
        { id_tamanho: "pequena", tamanho: "Pequena", preco: 28.00 },
        { id_tamanho: "media", tamanho: "Média", preco: 34.00 },
        { id_tamanho: "grande", tamanho: "Grande", preco: 37.00 },
        { id_tamanho: "familia", tamanho: "Família", preco: 41.00 }
      ]
    },
    {
      nome: "Charge Branco",
      ingredientes: "Leite condensado, chocolate branco e amendoim triturado",
      tamanhos_precos: [
        { id_tamanho: "pequena", tamanho: "Pequena", preco: 34.00 },
        { id_tamanho: "media", tamanho: "Média", preco: 36.00 },
        { id_tamanho: "grande", tamanho: "Grande", preco: 40.00 },
        { id_tamanho: "familia", tamanho: "Família", preco: 45.00 }
      ]
    },
    {
      nome: "Nevada",
      ingredientes: "Leite condensado, banana, chocolate branco e canela",
      tamanhos_precos: [
        { id_tamanho: "pequena", tamanho: "Pequena", preco: 30.00 },
        { id_tamanho: "media", tamanho: "Média", preco: 33.00 },
        { id_tamanho: "grande", tamanho: "Grande", preco: 38.00 },
        { id_tamanho: "familia", tamanho: "Família", preco: 43.00 }
      ]
    },
    {
      nome: "Nutella com Morangos",
      ingredientes: "Creme de leite, Nutella e Morangos",
      tamanhos_precos: [
        { id_tamanho: "pequena", tamanho: "Pequena", preco: 30.00 },
        { id_tamanho: "media", tamanho: "Média", preco: 33.00 },
        { id_tamanho: "grande", tamanho: "Grande", preco: 38.00 },
        { id_tamanho: "familia", tamanho: "Família", preco: 43.00 }
      ]
    },
    {
      nome: "Romeu e Julieta",
      ingredientes: "Leite condensado, mussarela e goiabada",
      tamanhos_precos: [
        { id_tamanho: "pequena", tamanho: "Pequena", preco: 29.00 },
        { id_tamanho: "media", tamanho: "Média", preco: 35.00 },
        { id_tamanho: "grande", tamanho: "Grande", preco: 43.00 },
        { id_tamanho: "familia", tamanho: "Família", preco: 45.00 }
      ]
    },
    {
      nome: "Romeu e Julieta com Gorgonzola",
      ingredientes: "Leite condensado, mussarela, goiabada e gorgonzola",
      tamanhos_precos: [
        { id_tamanho: "pequena", tamanho: "Pequena", preco: 34.00 },
        { id_tamanho: "media", tamanho: "Média", preco: 37.00 },
        { id_tamanho: "grande", tamanho: "Grande", preco: 40.00 },
        { id_tamanho: "familia", tamanho: "Família", preco: 48.00 }
      ]
    }
  ],

  // BORDAS RECHEADAS
  bordas: [
    {
      nome: "Beijinho",
      preco_unitario: 8.00
    },
    {
      nome: "Brigadeiro", 
      preco_unitario: 8.00
    },
    {
      nome: "Doce de Leite",
      preco_unitario: 8.00
    },
    {
      nome: "Goiabada",
      preco_unitario: 7.00
    },
    {
      nome: "Romeu e Julieta",
      preco_unitario: 10.00
    },
    {
      nome: "Nutella",
      preco_unitario: 10.00
    },
    {
      nome: "Catupiry",
      preco_unitario: 7.00
    },
    {
      nome: "Cheddar",
      preco_unitario: 8.00
    },
    {
      nome: "Mussarela",
      preco_unitario: 7.00
    }
  ]
};

async function populateMenu() {
  try {
    console.log('🍕 INICIALIZANDO CARDÁPIO DA PIT STOP PIZZARIA...\n');

    // Limpar produtos existentes (opcional - comentar se quiser manter)
    console.log('🗑️ Limpando produtos existentes...');
    await db.query('DELETE FROM produtos');
    console.log('✅ Produtos limpos\n');

    let totalProdutos = 0;

    // INSERIR PIZZAS SALGADAS
    console.log('🍕 Inserindo Pizzas Salgadas...');
    for (const pizza of pitStopMenu.pizzasSalgadas) {
      await db.query(`
        INSERT INTO produtos (
          nome, tipo_produto, categoria, tamanhos_precos, 
          ingredientes, ativo
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        pizza.nome,
        'pizza',
        'salgada',
        JSON.stringify(pizza.tamanhos_precos),
        pizza.ingredientes,
        true
      ]);
      console.log(`  ✅ ${pizza.nome}`);
      totalProdutos++;
    }

    // INSERIR PIZZAS DOCES
    console.log('\n🍰 Inserindo Pizzas Doces...');
    for (const pizza of pitStopMenu.pizzasDoces) {
      await db.query(`
        INSERT INTO produtos (
          nome, tipo_produto, categoria, tamanhos_precos, 
          ingredientes, ativo
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        pizza.nome,
        'pizza',
        'doce',
        JSON.stringify(pizza.tamanhos_precos),
        pizza.ingredientes,
        true
      ]);
      console.log(`  ✅ ${pizza.nome}`);
      totalProdutos++;
    }

    // INSERIR BORDAS
    console.log('\n🥖 Inserindo Bordas Recheadas...');
    for (const borda of pitStopMenu.bordas) {
      await db.query(`
        INSERT INTO produtos (
          nome, tipo_produto, preco_unitario, ativo
        ) VALUES ($1, $2, $3, $4)
      `, [
        `Borda ${borda.nome}`,
        'borda',
        borda.preco_unitario,
        true
      ]);
      console.log(`  ✅ Borda ${borda.nome} - R$ ${borda.preco_unitario.toFixed(2)}`);
      totalProdutos++;
    }

    // RESUMO FINAL
    console.log('\n📊 RESUMO DO CARDÁPIO IMPORTADO:');
    console.log(`├── Pizzas Salgadas: ${pitStopMenu.pizzasSalgadas.length}`);
    console.log(`├── Pizzas Doces: ${pitStopMenu.pizzasDoces.length}`);
    console.log(`├── Bordas Recheadas: ${pitStopMenu.bordas.length}`);
    console.log(`└── TOTAL: ${totalProdutos} produtos\n`);

    // VERIFICAR INSERÇÃO
    const verificacao = await db.query('SELECT tipo_produto, COUNT(*) as quantidade FROM produtos GROUP BY tipo_produto');
    console.log('🔍 VERIFICAÇÃO NO BANCO:');
    verificacao.rows.forEach(row => {
      console.log(`  ${row.tipo_produto}: ${row.quantidade} produtos`);
    });

    console.log('\n🎉 CARDÁPIO DA PIT STOP PIZZARIA IMPORTADO COM SUCESSO!');
    console.log('🚀 Sistema pronto para DEPLOY!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao popular cardápio:', error.message);
    console.error(error);
    process.exit(1);
  }
}

populateMenu(); 