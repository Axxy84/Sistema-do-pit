const db = require('../config/database');

const createMissingTables = async () => {
  try {
    console.log('🔧 Criando tabelas e colunas faltantes...');

    // Verificar e criar tabela despesas_receitas
    const despesasReceitasExists = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'despesas_receitas'
    `);
    
    if (despesasReceitasExists.rows.length === 0) {
      await db.query(`
        CREATE TABLE despesas_receitas (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tipo VARCHAR(20) CHECK (tipo IN ('despesa', 'receita')),
          valor DECIMAL(10,2) NOT NULL,
          descricao TEXT,
          categoria VARCHAR(100),
          data_transacao DATE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);
      console.log('✅ Tabela despesas_receitas criada');
    } else {
      console.log('ℹ️ Tabela despesas_receitas já existe');
    }

    // Verificar e adicionar updated_at na tabela fechamento_caixa se não existir
    const updatedAtFechamentoExists = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'fechamento_caixa' AND column_name = 'updated_at'
    `);
    
    if (updatedAtFechamentoExists.rows.length === 0) {
      await db.query('ALTER TABLE fechamento_caixa ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()');
      console.log('✅ Coluna updated_at adicionada na tabela fechamento_caixa');
    } else {
      console.log('ℹ️ Coluna updated_at já existe na tabela fechamento_caixa');
    }

    // Verificar e criar tabela ingredientes se não existir
    const ingredientesExists = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'ingredientes'
    `);
    
    if (ingredientesExists.rows.length === 0) {
      await db.query(`
        CREATE TABLE ingredientes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          nome VARCHAR(255) NOT NULL,
          unidade_medida VARCHAR(20) NOT NULL,
          quantidade_atual DECIMAL(10,2) DEFAULT 0,
          quantidade_minima DECIMAL(10,2) DEFAULT 0,
          custo_unitario DECIMAL(10,2),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);
      console.log('✅ Tabela ingredientes criada');
    } else {
      console.log('ℹ️ Tabela ingredientes já existe');
    }

    // Verificar e criar tabela produtos_ingredientes se não existir
    const produtosIngredientesExists = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'produtos_ingredientes'
    `);
    
    if (produtosIngredientesExists.rows.length === 0) {
      await db.query(`
        CREATE TABLE produtos_ingredientes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          produto_id UUID REFERENCES produtos(id) ON DELETE CASCADE,
          ingrediente_id UUID REFERENCES ingredientes(id) ON DELETE CASCADE,
          quantidade_necessaria DECIMAL(10,2) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);
      console.log('✅ Tabela produtos_ingredientes criada');
    } else {
      console.log('ℹ️ Tabela produtos_ingredientes já existe');
    }

    // Criar índices úteis
    try {
      await db.query('CREATE INDEX IF NOT EXISTS idx_despesas_receitas_data ON despesas_receitas(data_transacao)');
      await db.query('CREATE INDEX IF NOT EXISTS idx_despesas_receitas_tipo ON despesas_receitas(tipo)');
      console.log('✅ Índices criados');
    } catch (error) {
      console.log('ℹ️ Alguns índices já existem');
    }

    console.log('🎉 Migração concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao executar migração:', error);
    throw error;
  }
};

const main = async () => {
  try {
    await createMissingTables();
    process.exit(0);
  } catch (error) {
    console.error('❌ Falha na migração:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  main();
}

module.exports = { createMissingTables };