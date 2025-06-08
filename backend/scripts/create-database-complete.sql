-- =====================================================
-- SCRIPT COMPLETO PARA CRIAR O BANCO PIZZARIA_DB DO ZERO
-- =====================================================

-- 1. CRIAR O BANCO DE DADOS E USUÁRIO
-- Execute como superusuário (postgres)
-- =====================================================

-- Remover conexões ativas (se existirem)
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'pizzaria_db' AND pid <> pg_backend_pid();

-- Dropar banco se existir (CUIDADO: isso apaga todos os dados!)
DROP DATABASE IF EXISTS pizzaria_db;

-- Dropar usuário se existir
DROP USER IF EXISTS pizzaria_user;

-- Criar novo usuário
CREATE USER pizzaria_user WITH PASSWORD 'nova_senha_123';

-- Criar banco de dados
CREATE DATABASE pizzaria_db OWNER pizzaria_user;

-- Garantir todas as permissões
GRANT ALL PRIVILEGES ON DATABASE pizzaria_db TO pizzaria_user;

-- Conectar ao banco pizzaria_db
\c pizzaria_db

-- Garantir permissões no schema public
GRANT ALL ON SCHEMA public TO pizzaria_user;

-- =====================================================
-- 2. CRIAR EXTENSÕES NECESSÁRIAS
-- =====================================================

-- Habilitar UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 3. CRIAR TODAS AS TABELAS
-- =====================================================

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de perfis
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'atendente' CHECK (role IN ('admin', 'atendente', 'entregador')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de clientes
CREATE TABLE IF NOT EXISTS clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    endereco TEXT,
    pontos_fidelidade INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de entregadores
CREATE TABLE IF NOT EXISTS entregadores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de ingredientes
CREATE TABLE IF NOT EXISTS ingredientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    unidade_medida VARCHAR(20) NOT NULL,
    quantidade_atual DECIMAL(10,2) DEFAULT 0,
    quantidade_minima DECIMAL(10,2) DEFAULT 0,
    custo_unitario DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de produtos
CREATE TABLE IF NOT EXISTS produtos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    tipo_produto VARCHAR(50) NOT NULL CHECK (tipo_produto IN ('pizza', 'bebida', 'sobremesa', 'acompanhamento', 'outros')),
    categoria VARCHAR(100),
    preco_unitario DECIMAL(10,2),
    tamanhos_precos JSONB,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de produtos_ingredientes
CREATE TABLE IF NOT EXISTS produtos_ingredientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    produto_id UUID REFERENCES produtos(id) ON DELETE CASCADE,
    ingrediente_id UUID REFERENCES ingredientes(id) ON DELETE CASCADE,
    quantidade_necessaria DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de cupons
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
);

-- Tabela de pedidos
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
    taxa_entrega DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de itens_pedido
CREATE TABLE IF NOT EXISTS itens_pedido (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE,
    produto_id_ref UUID REFERENCES produtos(id),
    sabor_registrado VARCHAR(255),
    tamanho_registrado VARCHAR(50),
    quantidade INTEGER NOT NULL,
    valor_unitario DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de despesas_receitas
CREATE TABLE IF NOT EXISTS despesas_receitas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo VARCHAR(20) CHECK (tipo IN ('despesa', 'receita')),
    valor DECIMAL(10,2) NOT NULL,
    descricao TEXT,
    categoria VARCHAR(100),
    data_transacao DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de fechamento_caixa
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
);

-- Tabela de usuários (tabela nova do migrate-tables.sql)
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('admin', 'atendente', 'caixa', 'entregador')),
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de configurações
CREATE TABLE IF NOT EXISTS configuracoes (
    id SERIAL PRIMARY KEY,
    chave VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT,
    tipo VARCHAR(50) DEFAULT 'text',
    descricao TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de mesas
CREATE TABLE IF NOT EXISTS mesas (
    id SERIAL PRIMARY KEY,
    numero INTEGER UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'livre' CHECK (status IN ('livre', 'ocupada', 'reservada', 'indisponivel')),
    capacidade INTEGER DEFAULT 4,
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de bordas
CREATE TABLE IF NOT EXISTS bordas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    preco_adicional DECIMAL(10,2) NOT NULL DEFAULT 0,
    disponivel BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de fechamentos_caixa (versão corrigida)
CREATE TABLE IF NOT EXISTS fechamentos_caixa (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id),
    data_abertura TIMESTAMP NOT NULL,
    data_fechamento TIMESTAMP,
    valor_inicial DECIMAL(10,2) NOT NULL,
    valor_final DECIMAL(10,2),
    total_entradas DECIMAL(10,2) DEFAULT 0,
    total_saidas DECIMAL(10,2) DEFAULT 0,
    total_dinheiro DECIMAL(10,2) DEFAULT 0,
    total_cartao_credito DECIMAL(10,2) DEFAULT 0,
    total_cartao_debito DECIMAL(10,2) DEFAULT 0,
    total_pix DECIMAL(10,2) DEFAULT 0,
    observacoes TEXT,
    status VARCHAR(50) DEFAULT 'aberto' CHECK (status IN ('aberto', 'fechado')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de transacoes
CREATE TABLE IF NOT EXISTS transacoes (
    id SERIAL PRIMARY KEY,
    fechamento_id INTEGER REFERENCES fechamentos_caixa(id),
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('entrada', 'saida')),
    categoria VARCHAR(100) NOT NULL,
    descricao TEXT,
    valor DECIMAL(10,2) NOT NULL,
    forma_pagamento VARCHAR(50),
    data_transacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 4. CRIAR ÍNDICES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos(status_pedido);
CREATE INDEX IF NOT EXISTS idx_pedidos_data ON pedidos(data_pedido);
CREATE INDEX IF NOT EXISTS idx_clientes_telefone ON clientes(telefone);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_produtos_tipo ON produtos(tipo_produto);
CREATE INDEX IF NOT EXISTS idx_cupons_codigo ON cupons(codigo);
CREATE INDEX IF NOT EXISTS idx_fechamento_data ON fechamento_caixa(data_fechamento);
CREATE INDEX IF NOT EXISTS idx_despesas_data ON despesas_receitas(data_transacao);

-- =====================================================
-- 5. APLICAR MIGRAÇÕES ADICIONAIS
-- =====================================================

-- Migration: add_owner_access_column.sql
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS owner_access BOOLEAN DEFAULT false;

-- Migration: add_taxa_entrega_column.sql (já aplicada na criação da tabela pedidos)

-- Migration: add_total_pedidos_column.sql (já aplicada na criação da tabela fechamento_caixa)

-- Migration: add_categoria_despesas.sql (já aplicada na criação da tabela despesas_receitas)

-- Migration: update_product_type_check_constraint.sql
ALTER TABLE produtos DROP CONSTRAINT IF EXISTS produtos_tipo_produto_check;
ALTER TABLE produtos ADD CONSTRAINT produtos_tipo_produto_check 
    CHECK (tipo_produto IN ('pizza', 'bebida', 'sobremesa', 'acompanhamento', 'outros'));

-- =====================================================
-- 6. INSERIR DADOS INICIAIS
-- =====================================================

-- Criar usuário admin padrão (senha: admin123)
INSERT INTO usuarios (nome, email, senha, tipo, owner_access) 
VALUES ('Administrador', 'admin@pizzaria.com', '$2a$10$YourHashedPasswordHere', 'admin', true)
ON CONFLICT (email) DO NOTHING;

-- Inserir configurações padrão
INSERT INTO configuracoes (chave, valor, tipo, descricao) VALUES
    ('nome_estabelecimento', 'Pizzaria Sistema', 'text', 'Nome do estabelecimento'),
    ('endereco', 'Rua Principal, 123', 'text', 'Endereço do estabelecimento'),
    ('telefone', '(11) 1234-5678', 'text', 'Telefone principal'),
    ('horario_funcionamento', 'Ter-Dom: 18h às 23h', 'text', 'Horário de funcionamento'),
    ('taxa_entrega_padrao', '5.00', 'number', 'Taxa de entrega padrão'),
    ('pedido_minimo', '25.00', 'number', 'Valor mínimo do pedido'),
    ('tempo_entrega', '40', 'number', 'Tempo médio de entrega em minutos'),
    ('aceita_cartao', 'true', 'boolean', 'Aceita pagamento com cartão'),
    ('aceita_pix', 'true', 'boolean', 'Aceita pagamento com PIX')
ON CONFLICT (chave) DO NOTHING;

-- =====================================================
-- 7. CONCEDER PERMISSÕES FINAIS
-- =====================================================

-- Garantir que o usuário pizzaria_user tem todas as permissões
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO pizzaria_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO pizzaria_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO pizzaria_user;

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================

-- Mensagem de sucesso
DO $$
BEGIN
    RAISE NOTICE 'Banco de dados pizzaria_db criado com sucesso!';
    RAISE NOTICE 'Usuário: pizzaria_user';
    RAISE NOTICE 'Senha: nova_senha_123 (ALTERE IMEDIATAMENTE!)';
    RAISE NOTICE 'Usuário admin: admin@pizzaria.com';
    RAISE NOTICE 'Senha admin: admin123 (ALTERE APÓS O PRIMEIRO LOGIN!)';
END $$;