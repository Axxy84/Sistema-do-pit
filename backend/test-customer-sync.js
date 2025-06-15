// Script para testar sincronização de clientes após criar/deletar

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const db = require('./config/database');

async function testCustomerSync() {
  try {
    console.log('🔍 Testando sincronização de clientes...\n');
    
    // 1. Contar clientes atuais
    console.log('📊 1. Contando clientes atuais...');
    const countResult = await db.query('SELECT COUNT(*) as total FROM clientes');
    console.log(`✅ Total de clientes no banco: ${countResult.rows[0].total}`);
    
    // 2. Listar últimos 5 clientes
    console.log('\n📋 2. Últimos 5 clientes cadastrados:');
    const recentResult = await db.query(`
      SELECT 
        c.id, 
        c.nome, 
        c.telefone, 
        c.endereco,
        c.created_at,
        COALESCE(
          (SELECT SUM(p.pontos_ganhos - p.pontos_resgatados) 
           FROM pedidos p 
           WHERE p.cliente_id = c.id), 
          0
        ) as pontos_atuais
      FROM clientes c
      ORDER BY c.created_at DESC
      LIMIT 5
    `);
    
    recentResult.rows.forEach((cliente, index) => {
      console.log(`${index + 1}. ${cliente.nome}`);
      console.log(`   Telefone: ${cliente.telefone || 'Não informado'}`);
      console.log(`   Pontos: ${cliente.pontos_atuais}`);
      console.log(`   Criado em: ${new Date(cliente.created_at).toLocaleString('pt-BR')}`);
      console.log('');
    });
    
    // 3. Verificar estrutura da tabela
    console.log('🔧 3. Verificando estrutura da tabela clientes...');
    const columnsResult = await db.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'clientes'
      ORDER BY ordinal_position
    `);
    
    console.log('Colunas da tabela:');
    columnsResult.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    // 4. Verificar se há clientes com telefones duplicados
    console.log('\n🔍 4. Verificando telefones duplicados...');
    const duplicatesResult = await db.query(`
      SELECT telefone, COUNT(*) as quantidade
      FROM clientes
      WHERE telefone IS NOT NULL
      GROUP BY telefone
      HAVING COUNT(*) > 1
    `);
    
    if (duplicatesResult.rows.length === 0) {
      console.log('✅ Nenhum telefone duplicado encontrado');
    } else {
      console.log('⚠️  Telefones duplicados encontrados:');
      duplicatesResult.rows.forEach(dup => {
        console.log(`  - ${dup.telefone}: ${dup.quantidade} clientes`);
      });
    }
    
    // 5. Verificar clientes sem telefone
    console.log('\n📱 5. Verificando clientes sem telefone...');
    const noPhoneResult = await db.query(`
      SELECT COUNT(*) as total
      FROM clientes
      WHERE telefone IS NULL OR telefone = ''
    `);
    console.log(`Clientes sem telefone: ${noPhoneResult.rows[0].total}`);
    
    console.log('\n✅ Teste de sincronização concluído!');
    
  } catch (error) {
    console.error('❌ Erro ao testar sincronização:', error);
  } finally {
    await db.end();
  }
}

testCustomerSync();