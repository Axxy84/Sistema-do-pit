const db = require('../config/database');

const createTables = async () => {
  try {
    console.log('🚀 Iniciando criação das tabelas...');

    // Tabela de usuários (substitui auth.users do Supabase)
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    console.log('✅ Tabela users criada');

    // Tabela de perfis
    await db.query(`
      CREATE TABLE IF NOT EXISTS profiles (
        id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        full_name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'atendente' CHECK (role IN ('admin', 'atendente', 'entregador')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    console.log('✅ Tabela profiles criada');

    // Tabela de clientes
    await db.query(`
      CREATE TABLE IF NOT EXISTS clientes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nome VARCHAR(255) NOT NULL,
        telefone VARCHAR(20),
        endereco TEXT,
        pontos_fidelidade INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    console.log('✅ Tabela clientes criada');

    // Tabela de entregadores
    await db.query(`
      CREATE TABLE IF NOT EXISTS entregadores (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nome VARCHAR(255) NOT NULL,
        telefone VARCHAR(20),
        ativo BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    console.log('✅ Tabela entregadores criada');

    // Tabela de ingredientes
    await db.query(`
      CREATE TABLE IF NOT EXISTS ingredientes (
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

    // Tabela de produtos
    await db.query(`
      CREATE TABLE IF NOT EXISTS produtos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nome VARCHAR(255) NOT NULL,
        tipo_produto VARCHAR(50) NOT NULL CHECK (tipo_produto IN ('pizza', 'bebida', 'sobremesa', 'acompanhamento')),
        categoria VARCHAR(100),
        preco_unitario DECIMAL(10,2),
        tamanhos_precos JSONB,
        ativo BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    console.log('✅ Tabela produtos criada');

    // Tabela de produtos_ingredientes
    await db.query(`
      CREATE TABLE IF NOT EXISTS produtos_ingredientes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        produto_id UUID REFERENCES produtos(id) ON DELETE CASCADE,
        ingrediente_id UUID REFERENCES ingredientes(id) ON DELETE CASCADE,
        quantidade_necessaria DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    console.log('✅ Tabela produtos_ingredientes criada');

    // Tabela de cupons
    await db.query(`
      CREATE TABLE IF NOT EXISTS cupons (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        codigo VARCHAR(50) UNIQUE NOT NULL,
        descricao TEXT,
        tipo_desconto VARCHAR(20) CHECK (tipo_desconto IN ('percentual', 'valor_fixo')),
        valor_desconto DECIMAL(10,2) NOT NULL,
        data_validade TIMESTAMP WITH TIME ZONE,
        usos_maximos INTEGER,
        usos_atuais INTEGER DEFAULT 0,
        valor_minimo_pedido DECIMAL(10,2),
        ativo BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    console.log('✅ Tabela cupons criada');

    // Tabela de pedidos
    await db.query(`
      CREATE TABLE IF NOT EXISTS pedidos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        cliente_id UUID REFERENCES clientes(id),
        entregador_id UUID REFERENCES entregadores(id),
        status_pedido VARCHAR(50) DEFAULT 'pendente' CHECK (status_pedido IN ('pendente', 'preparando', 'pronto', 'saiu_entrega', 'entregue', 'cancelado')),
        total DECIMAL(10,2) NOT NULL,
        forma_pagamento VARCHAR(50),
        valor_pago DECIMAL(10,2),
        troco_calculado DECIMAL(10,2),
        cupom_id UUID REFERENCES cupons(id),
        desconto_aplicado DECIMAL(10,2) DEFAULT 0,
        pontos_ganhos INTEGER DEFAULT 0,
        pontos_resgatados INTEGER DEFAULT 0,
        observacoes TEXT,
        data_pedido TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    console.log('✅ Tabela pedidos criada');

    // Tabela de itens_pedido
    await db.query(`
      CREATE TABLE IF NOT EXISTS itens_pedido (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE,
        produto_id_ref UUID REFERENCES produtos(id),
        sabor_registrado VARCHAR(255),
        tamanho_registrado VARCHAR(50),
        quantidade INTEGER NOT NULL,
        valor_unitario DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    console.log('✅ Tabela itens_pedido criada');

    // Tabela de despesas_receitas
    await db.query(`
      CREATE TABLE IF NOT EXISTS despesas_receitas (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tipo VARCHAR(20) CHECK (tipo IN ('despesa', 'receita')),
        valor DECIMAL(10,2) NOT NULL,
        descricao TEXT,
        data_transacao DATE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    console.log('✅ Tabela despesas_receitas criada');

    // Tabela de fechamento_caixa
    await db.query(`
      CREATE TABLE IF NOT EXISTS fechamento_caixa (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        data_fechamento DATE NOT NULL,
        total_vendas DECIMAL(10,2) NOT NULL,
        total_descontos DECIMAL(10,2) DEFAULT 0,
        total_impostos DECIMAL(10,2) DEFAULT 0,
        total_taxas_entrega DECIMAL(10,2) DEFAULT 0,
        total_despesas_extras DECIMAL(10,2) DEFAULT 0,
        total_receitas_extras DECIMAL(10,2) DEFAULT 0,
        saldo_final DECIMAL(10,2) NOT NULL,
        observacoes TEXT,
        total_pedidos_dia INTEGER DEFAULT 0,
        vendas_por_metodo JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    console.log('✅ Tabela fechamento_caixa criada');

    // Criar índices importantes
    await db.query('CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos(status_pedido)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_pedidos_data ON pedidos(data_pedido)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_clientes_telefone ON clientes(telefone)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    console.log('✅ Índices criados');

    console.log('🎉 Todas as tabelas foram criadas com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error);
    throw error;
  }
};

const createDefaultAdmin = async () => {
  try {
    const bcrypt = require('bcryptjs');
    
    // Verificar se já existe um admin
    const { rows } = await db.query(`
      SELECT u.id FROM users u 
      JOIN profiles p ON u.id = p.id 
      WHERE p.role = 'admin' 
      LIMIT 1
    `);
    
    if (rows.length > 0) {
      console.log('ℹ️ Usuário admin já existe');
      return;
    }

    // Criar usuário admin padrão
    const adminEmail = 'admin@pizzaria.com';
    const adminPassword = 'admin123'; // Mude isso em produção!
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    
    const userResult = await db.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
      [adminEmail, passwordHash]
    );
    
    await db.query(
      'INSERT INTO profiles (id, full_name, role) VALUES ($1, $2, $3)',
      [userResult.rows[0].id, 'Administrador', 'admin']
    );
    
    console.log('✅ Usuário admin criado:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Senha: ${adminPassword}`);
    console.log('⚠️  IMPORTANTE: Altere a senha após o primeiro login!');
    
  } catch (error) {
    console.error('❌ Erro ao criar admin padrão:', error);
  }
};

const main = async () => {
  try {
    await createTables();
    await createDefaultAdmin();
    console.log('🚀 Migração concluída com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Falha na migração:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  main();
}

module.exports = { createTables, createDefaultAdmin }; 