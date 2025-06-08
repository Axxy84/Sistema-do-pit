const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const config = require('./config/env');
const db = require('./config/database');

const app = express();

// Middlewares de segurança
app.use(helmet());

// Configuração de CORS mais flexível para desenvolvimento
const defaultLocalHostPort = '5173'; // Porta que você mais usa
const localHostOriginRegex = /^http:\/\/localhost:\d+$/;

const corsOptions = {
  credentials: true,
  origin: function (origin, callback) {
    console.log(`[CORS] Requisição da origem: ${origin}`); // Log da origem
    console.log(`[CORS] Config.CORS_ORIGIN: ${config.CORS_ORIGIN}`); // Log da configuração
    console.log(`[CORS] Teste da regex para localhost: ${localHostOriginRegex.test(origin)} (Origem: ${origin})`);

    let allowed = false;
    if (config.CORS_ORIGIN === '*') {
      allowed = true;
    } else if (!origin) { // requisições sem 'Origin' (ex: same-origin, server-to-server, ou algumas ferramentas)
      allowed = true;
    } else if (localHostOriginRegex.test(origin)) {
      allowed = true;
    } else if (origin === config.CORS_ORIGIN) {
      allowed = true;
    } else if (config.CORS_ORIGIN && typeof config.CORS_ORIGIN === 'string' && config.CORS_ORIGIN.includes(',')) {
      // Se CORS_ORIGIN for uma lista de URLs separadas por vírgula
      if (config.CORS_ORIGIN.split(',').map(item => item.trim()).includes(origin)) {
        allowed = true;
      }
    }
    // Adicione um log final para o resultado da verificação
    console.log(`[CORS] A origem "${origin}" é permitida? ${allowed}`);

    if (allowed) {
      // console.log(`[CORS] Origem permitida: ${origin}`); // Comentado pois o log acima já informa
      callback(null, true);
    } else {
      console.warn(`[CORS] Origem NÃO permitida: ${origin}. Verifique a variável de ambiente CORS_ORIGIN ou a configuração do servidor.`);
      callback(new Error('Não permitido pelo CORS. Verifique a origem da requisição e a configuração CORS_ORIGIN do servidor.'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token', 'Accept', 'Origin'], // Adicionando mais headers comuns
};

// Lidar com requisições OPTIONS globalmente ANTES de outras rotas
app.options('*', cors(corsOptions));

// Aplicar CORS para todas as outras requisições
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: config.NODE_ENV === 'development' ? 1000 : 100, // 1000 requests em dev, 100 em produção
  message: {
    error: 'Muitas requisições deste IP, tente novamente em alguns minutos.',
    retryAfter: Math.round(15 * 60 * 1000 / 1000)
  }
});
app.use(limiter);

// Middlewares de parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - Origem: ${req.headers.origin}`);
  next();
});

// Importar rotas
const authRoutes = require('./routes/auth');
const ordersRoutes = require('./routes/orders');
const productsRoutes = require('./routes/products');
const deliverersRoutes = require('./routes/deliverers');
const customersRoutes = require('./routes/customers');
const couponsRoutes = require('./routes/coupons');
const dashboardRoutes = require('./routes/dashboard');
const expensesRoutes = require('./routes/expenses');
const reportsRoutes = require('./routes/reports');
const cashClosingRoutes = require('./routes/cash-closing');
const migrateRoutes = require('./routes/migrate');
const cacheAdminRoutes = require('./routes/cache-admin');
const configurationsRoutes = require('./routes/configurations');
const profitCalculatorRoutes = require('./routes/profit-calculator');
const ownerRoutes = require('./routes/owner');

// Registrar rotas
app.use('/api/auth', authRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/deliverers', deliverersRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/coupons', couponsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/cash-closing', cashClosingRoutes);
app.use('/api/migrate', migrateRoutes);
app.use('/api/cache-admin', cacheAdminRoutes);
app.use('/api/configurations', configurationsRoutes);
app.use('/api/profit-calculator', profitCalculatorRoutes);
app.use('/api/owner', ownerRoutes);


// Ignorar requisições para favicon.ico
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Rota de health check
app.get('/api/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      database: 'Connected' 
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      timestamp: new Date().toISOString(),
      database: 'Disconnected',
      error: error.message 
    });
  }
});

// Middleware de tratamento de erros
app.use((error, req, res, next) => {
  console.error('Erro:', error);
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    message: config.NODE_ENV === 'development' ? error.message : 'Algo deu errado'
  });
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

const PORT = config.PORT;

// Função para executar migração de tipos de produto
async function runProductTypesMigration() {
  try {
    console.log('🔄 Verificando e aplicando migração de tipos de produto...');
    
    // Verificar se a constraint já inclui 'borda'
    const checkResult = await db.query(`
      SELECT conname, pg_get_constraintdef(oid) as constraint_def
      FROM pg_constraint
      WHERE conrelid = 'produtos'::regclass AND conname = 'produtos_tipo_produto_check';
    `);
    
    if (checkResult.rows.length > 0) {
      const constraint = checkResult.rows[0].constraint_def;
      if (constraint.includes("'borda'")) {
        console.log('✅ Constraint já inclui tipo "borda" - migração não necessária');
      } else {
        console.log('📋 Atualizando constraint para incluir tipo "borda"...');
        
        // Remover constraint existente
        await db.query(`
          ALTER TABLE produtos
          DROP CONSTRAINT IF EXISTS produtos_tipo_produto_check;
        `);
        
        // Adicionar nova constraint com 'borda'
        await db.query(`
          ALTER TABLE produtos
          ADD CONSTRAINT produtos_tipo_produto_check 
          CHECK (tipo_produto IN ('pizza', 'bebida', 'sobremesa', 'acompanhamento', 'outro', 'borda'));
        `);
        
        console.log('✅ Migração de tipos de produto concluída com sucesso!');
      }
    }
    
    console.log('💡 Agora você pode cadastrar bordas de pizza no sistema!');
    
  } catch (error) {
    console.error('❌ Erro durante a migração de tipos de produto:', error.message);
    // Não parar o servidor por causa da migração
  }
}

// Função para executar migração de taxa de entrega
async function runTaxaEntregaMigration() {
  try {
    console.log('🔄 Verificando e aplicando migração de taxa de entrega...');
    
    // Verificar se a coluna taxa_entrega já existe
    const checkColumn = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'pedidos' 
      AND column_name = 'taxa_entrega';
    `);
    
    if (checkColumn.rows.length === 0) {
      console.log('📋 Adicionando coluna taxa_entrega à tabela pedidos...');
      
      await db.query(`
        ALTER TABLE pedidos 
        ADD COLUMN taxa_entrega NUMERIC(10,2) DEFAULT 0.00;
      `);
      
      await db.query(`
        COMMENT ON COLUMN pedidos.taxa_entrega IS 'Taxa de entrega aplicada ao pedido (apenas para delivery)';
      `);
      
      console.log('✅ Migração de taxa de entrega concluída com sucesso!');
    } else {
      console.log('✅ Coluna taxa_entrega já existe - migração não necessária');
    }

    // Verificar se a coluna entregador_nome já existe
    const checkEntregadorNome = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'pedidos' 
      AND column_name = 'entregador_nome';
    `);
    
    if (checkEntregadorNome.rows.length === 0) {
      console.log('📋 Adicionando coluna entregador_nome à tabela pedidos...');
      
      await db.query(`
        ALTER TABLE pedidos 
        ADD COLUMN entregador_nome VARCHAR(255) DEFAULT NULL;
      `);
      
      await db.query(`
        COMMENT ON COLUMN pedidos.entregador_nome IS 'Nome do entregador para exibição no cupom';
      `);
      
      console.log('✅ Migração de entregador_nome concluída com sucesso!');
    } else {
      console.log('✅ Coluna entregador_nome já existe - migração não necessária');
    }
    
  } catch (error) {
    console.error('❌ Erro durante a migração de taxa de entrega:', error.message);
    // Não parar o servidor por causa da migração
  }
}

// Função para executar migração da tabela fechamento_caixa
async function runFechamentoCaixaMigration() {
  try {
    console.log('🔄 Verificando e aplicando migração da tabela fechamento_caixa...');
    
    // Lista de colunas que precisam existir na tabela fechamento_caixa
    const requiredColumns = [
      { name: 'total_pedidos', type: 'INTEGER DEFAULT 0' },
      { name: 'total_vendas', type: 'NUMERIC(10,2) DEFAULT 0.00' },
      { name: 'total_despesas_extras', type: 'NUMERIC(10,2) DEFAULT 0.00' },
      { name: 'total_receitas_extras', type: 'NUMERIC(10,2) DEFAULT 0.00' },
      { name: 'total_descontos', type: 'NUMERIC(10,2) DEFAULT 0.00' },
      { name: 'total_impostos', type: 'NUMERIC(10,2) DEFAULT 0.00' },
      { name: 'total_taxas_entrega', type: 'NUMERIC(10,2) DEFAULT 0.00' },
      { name: 'saldo_final', type: 'NUMERIC(10,2) DEFAULT 0.00' },
      { name: 'vendas_por_metodo', type: 'JSONB DEFAULT \'{}\'::jsonb' }
    ];
    
    // Verificar quais colunas existem
    const existingColumns = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'fechamento_caixa';
    `);
    
    const existingColumnNames = existingColumns.rows.map(row => row.column_name);
    
    // Adicionar colunas que não existem
    for (const column of requiredColumns) {
      if (!existingColumnNames.includes(column.name)) {
        console.log(`📋 Adicionando coluna ${column.name} à tabela fechamento_caixa...`);
        
        await db.query(`
          ALTER TABLE fechamento_caixa 
          ADD COLUMN ${column.name} ${column.type};
        `);
        
        console.log(`✅ Coluna ${column.name} adicionada com sucesso!`);
      } else {
        console.log(`✅ Coluna ${column.name} já existe`);
      }
    }
    
    console.log('✅ Migração da tabela fechamento_caixa concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante a migração da tabela fechamento_caixa:', error.message);
    // Não parar o servidor por causa da migração
  }
}

// Função para executar migração de múltiplos pagamentos
async function runMultiplePaymentsMigration() {
  try {
    console.log('🔄 Verificando e aplicando migração de múltiplos pagamentos...');
    
    // Verificar se a tabela pagamentos_pedido já existe
    const checkTable = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'pagamentos_pedido';
    `);
    
    if (checkTable.rows.length === 0) {
      console.log('📋 Criando tabela pagamentos_pedido...');
      
      await db.query(`
        CREATE TABLE pagamentos_pedido (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
          forma_pagamento VARCHAR(50) NOT NULL,
          valor NUMERIC(10,2) NOT NULL,
          observacoes TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
      
      await db.query(`
        CREATE INDEX idx_pagamentos_pedido_pedido_id ON pagamentos_pedido(pedido_id);
      `);
      
      await db.query(`
        COMMENT ON TABLE pagamentos_pedido IS 'Múltiplas formas de pagamento por pedido';
        COMMENT ON COLUMN pagamentos_pedido.forma_pagamento IS 'Forma de pagamento: dinheiro, cartao, pix, etc';
        COMMENT ON COLUMN pagamentos_pedido.valor IS 'Valor pago nesta forma de pagamento';
      `);
      
      console.log('✅ Tabela pagamentos_pedido criada com sucesso!');
    } else {
      console.log('✅ Tabela pagamentos_pedido já existe');
    }
    
    // Verificar se precisa adicionar coluna para indicar múltiplos pagamentos
    const checkMultipleColumn = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'pedidos' 
      AND column_name = 'multiplos_pagamentos';
    `);
    
    if (checkMultipleColumn.rows.length === 0) {
      console.log('📋 Adicionando coluna multiplos_pagamentos à tabela pedidos...');
      
      await db.query(`
        ALTER TABLE pedidos 
        ADD COLUMN multiplos_pagamentos BOOLEAN DEFAULT FALSE;
      `);
      
      await db.query(`
        COMMENT ON COLUMN pedidos.multiplos_pagamentos IS 'Indica se o pedido usa múltiplas formas de pagamento';
      `);
      
      console.log('✅ Coluna multiplos_pagamentos adicionada com sucesso!');
    } else {
      console.log('✅ Coluna multiplos_pagamentos já existe');
    }
    
    console.log('✅ Migração de múltiplos pagamentos concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante a migração de múltiplos pagamentos:', error.message);
    // Não parar o servidor por causa da migração
  }
}

// Função para executar migração da tabela de configurações
async function runConfigurationsMigration() {
  try {
    console.log('🔄 Verificando e aplicando migração da tabela configuracoes...');
    
    // Verificar se a tabela configuracoes já existe
    const checkTable = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'configuracoes';
    `);
    
    if (checkTable.rows.length === 0) {
      console.log('📋 Criando tabela configuracoes...');
      
      await db.query(`
        CREATE TABLE configuracoes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          chave VARCHAR(100) UNIQUE NOT NULL,
          valor TEXT,
          descricao TEXT,
          tipo VARCHAR(50) DEFAULT 'texto',
          ativo BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
      
      await db.query(`
        CREATE INDEX idx_configuracoes_chave ON configuracoes(chave);
        CREATE INDEX idx_configuracoes_ativo ON configuracoes(ativo);
      `);
      
      await db.query(`
        COMMENT ON TABLE configuracoes IS 'Configurações gerais do sistema (PIX, impressora, etc)';
        COMMENT ON COLUMN configuracoes.chave IS 'Chave única da configuração';
        COMMENT ON COLUMN configuracoes.valor IS 'Valor da configuração (pode ser texto, JSON, etc)';
        COMMENT ON COLUMN configuracoes.tipo IS 'Tipo da configuração: texto, json, url, boolean, numero';
      `);
      
      // Inserir configuração padrão do PIX
      await db.query(`
        INSERT INTO configuracoes (chave, valor, descricao, tipo) 
        VALUES (
          'pix_qr_code', 
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
          'QR Code PIX para pagamentos (base64 ou URL)',
          'texto'
        ),
        (
          'pix_chave',
          'pitstop.pizzaria@exemplo.com',
          'Chave PIX da pizzaria',
          'texto'
        ),
        (
          'empresa_nome',
          'PIT STOP PIZZARIA',
          'Nome da empresa para cupons',
          'texto'
        );
      `);
      
      console.log('✅ Tabela configuracoes criada com configurações padrão!');
    } else {
      console.log('✅ Tabela configuracoes já existe');
      
      // Verificar se as configurações padrão existem
      const existingConfigs = await db.query(`
        SELECT chave FROM configuracoes 
        WHERE chave IN ('pix_qr_code', 'pix_chave', 'empresa_nome')
      `);
      
      const existingKeys = existingConfigs.rows.map(row => row.chave);
      
      if (!existingKeys.includes('pix_qr_code')) {
        await db.query(`
          INSERT INTO configuracoes (chave, valor, descricao, tipo) 
          VALUES (
            'pix_qr_code', 
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
            'QR Code PIX para pagamentos (base64 ou URL)',
            'texto'
          );
        `);
        console.log('✅ Configuração pix_qr_code adicionada');
      }
      
      if (!existingKeys.includes('pix_chave')) {
        await db.query(`
          INSERT INTO configuracoes (chave, valor, descricao, tipo) 
          VALUES (
            'pix_chave',
            'pitstop.pizzaria@exemplo.com',
            'Chave PIX da pizzaria',
            'texto'
          );
        `);
        console.log('✅ Configuração pix_chave adicionada');
      }
      
      if (!existingKeys.includes('empresa_nome')) {
        await db.query(`
          INSERT INTO configuracoes (chave, valor, descricao, tipo) 
          VALUES (
            'empresa_nome',
            'PIT STOP PIZZARIA',
            'Nome da empresa para cupons',
            'texto'
          );
        `);
        console.log('✅ Configuração empresa_nome adicionada');
      }
    }
    
    console.log('✅ Migração da tabela configuracoes concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro na migração da tabela configuracoes:', error.message);
    throw error;
  }
}

// Função principal para executar todas as migrações
async function runAllMigrations() {
  try {
    await runTaxaEntregaMigration();
    await runFechamentoCaixaMigration();
    await runMultiplePaymentsMigration();
    await runConfigurationsMigration(); // Adicionar nova migração
    console.log('✅ Todas as migrações executadas com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao executar migrações:', error);
    process.exit(1);
  }
}

app.listen(PORT, async () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`🌐 Environment: ${config.NODE_ENV}`);
  console.log(`🔗 CORS habilitado para: ${config.CORS_ORIGIN}`);
  
  // Executar migrações
  await runAllMigrations();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM recebido, fechando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT recebido, fechando servidor...');
  process.exit(0);
}); 