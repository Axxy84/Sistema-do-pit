const express = require('express');
const db = require('../config/database');

const router = express.Router();

// POST /api/migrate/product-types - Migrar constraint de tipos de produto
router.post('/product-types', async (req, res) => {
  try {
    console.log('🔄 Iniciando migração da constraint produtos_tipo_produto_check...');
    
    // Remover constraint existente
    console.log('📋 Removendo constraint existente...');
    await db.query(`
      ALTER TABLE produtos
      DROP CONSTRAINT IF EXISTS produtos_tipo_produto_check;
    `);
    
    // Adicionar nova constraint com 'borda'
    console.log('✅ Adicionando nova constraint com tipo "borda"...');
    await db.query(`
      ALTER TABLE produtos
      ADD CONSTRAINT produtos_tipo_produto_check 
      CHECK (tipo_produto IN ('pizza', 'bebida', 'sobremesa', 'acompanhamento', 'outro', 'borda'));
    `);
    
    // Verificar se foi aplicada
    console.log('🔍 Verificando constraint aplicada...');
    const result = await db.query(`
      SELECT conname, pg_get_constraintdef(oid) as constraint_def
      FROM pg_constraint
      WHERE conrelid = 'produtos'::regclass AND conname = 'produtos_tipo_produto_check';
    `);
    
    const success = result.rows.length > 0;
    
    res.json({
      success,
      message: success 
        ? '✅ Constraint atualizada com sucesso! Agora você pode cadastrar bordas de pizza.' 
        : '❌ Constraint não foi encontrada após a migração',
      constraint: success ? result.rows[0] : null
    });
    
  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    res.status(500).json({
      success: false,
      message: 'Erro durante a migração',
      error: error.message
    });
  }
});

module.exports = router; 