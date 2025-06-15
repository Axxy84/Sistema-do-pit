const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const cache = require('../cache/cache-manager');
const { CacheKeys } = require('../cache/cache-keys');

const router = express.Router();

// GET /api/products - Listar todos os produtos (COM CACHE)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { tipo_produto } = req.query;
    
    // Gerar chave de cache baseada no filtro
    const cacheKey = tipo_produto ? 
      CacheKeys.PRODUCTS_BY_TYPE(tipo_produto) : 
      CacheKeys.PRODUCTS_LIST;
    
    // Implementar Cache-Aside pattern
    const products = await cache.getOrFetch(cacheKey, async () => {
      const whereClause = tipo_produto ? 'WHERE tipo_produto = $1' : '';
      const queryParams = tipo_produto ? [tipo_produto] : [];
      
      const result = await db.query(`
        SELECT * FROM produtos 
        ${whereClause}
        ORDER BY created_at DESC
      `, queryParams);
      
      // Converter preços para números
      return result.rows.map(product => {
        // Converter preco_unitario para número se existir
        if (product.preco_unitario !== null && product.preco_unitario !== undefined) {
          product.preco_unitario = parseFloat(product.preco_unitario);
        }
        
        // Converter preços em tamanhos_precos para números se existir
        if (product.tamanhos_precos && Array.isArray(product.tamanhos_precos)) {
          product.tamanhos_precos = product.tamanhos_precos.map(tp => ({
            ...tp,
            preco: tp.preco !== null && tp.preco !== undefined ? parseFloat(tp.preco) : tp.preco
          }));
        }
        
        return product;
      });
    }, 900); // TTL: 15 minutos - dados mudam raramente
    
    // Verificar os produtos do tipo borda para debug
    const bordas = products.filter(p => p.tipo_produto === 'borda');
    console.log(`[API] Retornando ${bordas.length} bordas (cache: ${cacheKey}):`);
    bordas.forEach(borda => {
      console.log(`   • ${borda.nome}: R$ ${borda.preco_unitario} (${typeof borda.preco_unitario})`);
    });
    
    res.json({ products });
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// GET /api/products/:id - Buscar produto por ID (COM CACHE)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = CacheKeys.PRODUCTS_BY_ID(id);
    
    // Cache-Aside pattern para produto individual
    const product = await cache.getOrFetch(cacheKey, async () => {
      const result = await db.query('SELECT * FROM produtos WHERE id = $1', [id]);
      return result.rows.length > 0 ? result.rows[0] : null;
    }, 1800); // TTL: 30 minutos - produto individual muda raramente
    
    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    res.json({ product });
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// POST /api/products - Criar novo produto
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      nome,
      tipo_produto,
      categoria,
      tamanhos_precos,
      ingredientes,
      preco_unitario,
      estoque_disponivel,
      ativo = true
    } = req.body;

    // Validações básicas
    if (!nome || !tipo_produto) {
      return res.status(400).json({ 
        error: 'Nome e tipo do produto são obrigatórios' 
      });
    }

    const result = await db.query(`
      INSERT INTO produtos (
        nome, tipo_produto, categoria, tamanhos_precos, 
        ingredientes, preco_unitario, estoque_disponivel, ativo
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      nome,
      tipo_produto,
      categoria,
      tamanhos_precos ? JSON.stringify(tamanhos_precos) : null,
      ingredientes,
      preco_unitario,
      estoque_disponivel,
      ativo
    ]);

    // Invalidar cache após criação
    cache.deletePattern('products:.*');
    console.log('💥 Cache invalidated: products patterns (CREATE)');

    res.status(201).json({ product: result.rows[0] });
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// PUT /api/products/:id - Atualizar produto (alias para PATCH)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('=== UPDATE PRODUCT DEBUG ===');
    console.log('Product ID:', id);
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('User:', req.user?.id);
    
    const {
      nome,
      tipo_produto,
      categoria,
      tamanhos_precos,
      ingredientes,
      preco_unitario,
      estoque_disponivel,
      ativo
    } = req.body;

    // Verificar se produto existe
    const existingProduct = await db.query('SELECT id FROM produtos WHERE id = $1', [id]);
    if (existingProduct.rows.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    // Construir query dinâmica
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (nome !== undefined) {
      fields.push(`nome = $${paramIndex++}`);
      values.push(nome);
    }
    if (tipo_produto !== undefined) {
      fields.push(`tipo_produto = $${paramIndex++}`);
      values.push(tipo_produto);
    }
    if (categoria !== undefined) {
      fields.push(`categoria = $${paramIndex++}`);
      values.push(categoria);
    }
    if (tamanhos_precos !== undefined) {
      fields.push(`tamanhos_precos = $${paramIndex++}`);
      values.push(tamanhos_precos ? JSON.stringify(tamanhos_precos) : null);
    }
    if (ingredientes !== undefined) {
      fields.push(`ingredientes = $${paramIndex++}`);
      values.push(ingredientes);
    }
    if (preco_unitario !== undefined) {
      fields.push(`preco_unitario = $${paramIndex++}`);
      values.push(preco_unitario);
    }
    if (estoque_disponivel !== undefined) {
      fields.push(`estoque_disponivel = $${paramIndex++}`);
      values.push(estoque_disponivel);
    }
    if (ativo !== undefined) {
      fields.push(`ativo = $${paramIndex++}`);
      values.push(ativo);
    }

    fields.push(`updated_at = $${paramIndex++}`);
    values.push(new Date());

    values.push(id); // Para o WHERE

    const query = `
      UPDATE produtos 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await db.query(query, values);
    
    // Invalidar cache após atualização (PUT)
    cache.delete(CacheKeys.PRODUCTS_BY_ID(id));
    cache.deletePattern('products:.*');
    console.log(`💥 Cache invalidated: product ${id} and patterns (PUT)`);
    
    res.json({ product: result.rows[0] });

  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// PATCH /api/products/:id - Atualizar produto
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nome,
      tipo_produto,
      categoria,
      tamanhos_precos,
      ingredientes,
      preco_unitario,
      estoque_disponivel,
      ativo
    } = req.body;

    // Verificar se produto existe
    const existingProduct = await db.query('SELECT id FROM produtos WHERE id = $1', [id]);
    if (existingProduct.rows.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    // Construir query dinâmica
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (nome !== undefined) {
      fields.push(`nome = $${paramIndex++}`);
      values.push(nome);
    }
    if (tipo_produto !== undefined) {
      fields.push(`tipo_produto = $${paramIndex++}`);
      values.push(tipo_produto);
    }
    if (categoria !== undefined) {
      fields.push(`categoria = $${paramIndex++}`);
      values.push(categoria);
    }
    if (tamanhos_precos !== undefined) {
      fields.push(`tamanhos_precos = $${paramIndex++}`);
      values.push(tamanhos_precos ? JSON.stringify(tamanhos_precos) : null);
    }
    if (ingredientes !== undefined) {
      fields.push(`ingredientes = $${paramIndex++}`);
      values.push(ingredientes);
    }
    if (preco_unitario !== undefined) {
      fields.push(`preco_unitario = $${paramIndex++}`);
      values.push(preco_unitario);
    }
    if (estoque_disponivel !== undefined) {
      fields.push(`estoque_disponivel = $${paramIndex++}`);
      values.push(estoque_disponivel);
    }
    if (ativo !== undefined) {
      fields.push(`ativo = $${paramIndex++}`);
      values.push(ativo);
    }

    fields.push(`updated_at = $${paramIndex++}`);
    values.push(new Date());

    values.push(id); // Para o WHERE

    const query = `
      UPDATE produtos 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await db.query(query, values);
    
    // Invalidar cache após atualização (PATCH)
    cache.delete(CacheKeys.PRODUCTS_BY_ID(id));
    cache.deletePattern('products:.*');
    console.log(`💥 Cache invalidated: product ${id} and patterns (PATCH)`);
    
    res.json({ product: result.rows[0] });

  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// DELETE /api/products/:id - Deletar produto
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se produto existe
    const existingProduct = await db.query('SELECT id FROM produtos WHERE id = $1', [id]);
    if (existingProduct.rows.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    // Verificar se produto está em uso em pedidos
    const inUse = await db.query(`
      SELECT COUNT(*) as count 
      FROM itens_pedido 
      WHERE produto_id_ref = $1
    `, [id]);

    if (parseInt(inUse.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'Produto em uso',
        message: 'Este produto não pode ser excluído pois está associado a pedidos existentes.'
      });
    }

    await db.query('DELETE FROM produtos WHERE id = $1', [id]);
    
    // Invalidar cache após deleção
    cache.delete(CacheKeys.PRODUCTS_BY_ID(id));
    cache.deletePattern('products:.*');
    console.log(`💥 Cache invalidated: product ${id} and patterns (DELETE)`);
    
    res.json({ message: 'Produto removido com sucesso' });

  } catch (error) {
    console.error('Erro ao deletar produto:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

module.exports = router; 