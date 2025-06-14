const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/customers - Listar todos os clientes
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        c.*,
        COALESCE(
          (SELECT SUM(p.pontos_ganhos - p.pontos_resgatados) 
           FROM pedidos p 
           WHERE p.cliente_id = c.id), 
          0
        ) as pontos_atuais
      FROM clientes c
      ORDER BY c.created_at DESC
    `);
    res.json({ customers: result.rows });
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// GET /api/customers/phone/:phone - Buscar cliente por telefone
router.get('/phone/:phone', authenticateToken, async (req, res) => {
  console.log('[DEBUG] Rota /api/customers/phone/:phone alcançada. Telefone:', req.params.phone, 'Decodificado:', decodeURIComponent(req.params.phone)); // Log de depuração
  try {
    const { phone } = req.params;
    
    const result = await db.query(`
      SELECT 
        c.*,
        COALESCE(
          (SELECT SUM(p.pontos_ganhos - p.pontos_resgatados) 
           FROM pedidos p 
           WHERE p.cliente_id = c.id), 
          0
        ) as pontos_atuais
      FROM clientes c
      WHERE c.telefone = $1
    `, [phone]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    
    res.json({ customer: result.rows[0] });
  } catch (error) {
    console.error('Erro ao buscar cliente por telefone:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// GET /api/customers/:id - Buscar cliente por ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      SELECT 
        c.*,
        COALESCE(
          (SELECT SUM(p.pontos_ganhos - p.pontos_resgatados) 
           FROM pedidos p 
           WHERE p.cliente_id = c.id), 
          0
        ) as pontos_atuais
      FROM clientes c
      WHERE c.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    
    res.json({ customer: result.rows[0] });
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// GET /api/customers/:id/points - Buscar pontos do cliente
router.get('/:id/points', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      SELECT 
        COALESCE(SUM(pontos_ganhos - pontos_resgatados), 0) as pontos_atuais
      FROM pedidos
      WHERE cliente_id = $1
    `, [id]);
    
    res.json({ points: result.rows[0].pontos_atuais });
  } catch (error) {
    console.error('Erro ao buscar pontos do cliente:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// POST /api/customers - Criar novo cliente
router.post('/', authenticateToken, async (req, res) => {
  console.log('[Backend] POST /api/customers - Tentando criar cliente:', req.body);
  try {
    const { nome, telefone, endereco } = req.body;

    // Validações básicas
    if (!nome || !telefone) {
      console.log('[Backend] Erro: Nome e telefone são obrigatórios');
      return res.status(400).json({ 
        error: 'Nome e telefone são obrigatórios' 
      });
    }

    // Verificar se cliente já existe com esse telefone
    const existing = await db.query(
      'SELECT id FROM clientes WHERE telefone = $1',
      [telefone]
    );

    if (existing.rows.length > 0) {
      console.log('[Backend] Erro: Cliente já existe com telefone:', telefone);
      return res.status(409).json({ 
        error: 'Cliente já existe com esse telefone' 
      });
    }

    const result = await db.query(`
      INSERT INTO clientes (nome, telefone, endereco)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [nome, telefone, endereco]);

    console.log('[Backend] Cliente criado com sucesso:', result.rows[0]);
    res.status(201).json({ customer: result.rows[0] });
  } catch (error) {
    console.error('[Backend] Erro ao criar cliente:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// PATCH /api/customers/:id - Atualizar cliente
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, telefone, endereco } = req.body;

    // Verificar se cliente existe
    const existingCustomer = await db.query('SELECT id FROM clientes WHERE id = $1', [id]);
    if (existingCustomer.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    // Se mudando telefone, verificar se já não existe outro cliente com esse telefone
    if (telefone) {
      const phoneCheck = await db.query(
        'SELECT id FROM clientes WHERE telefone = $1 AND id != $2',
        [telefone, id]
      );
      if (phoneCheck.rows.length > 0) {
        return res.status(409).json({ 
          error: 'Telefone já cadastrado para outro cliente' 
        });
      }
    }

    // Construir query dinâmica
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (nome !== undefined) {
      fields.push(`nome = $${paramIndex++}`);
      values.push(nome);
    }
    if (telefone !== undefined) {
      fields.push(`telefone = $${paramIndex++}`);
      values.push(telefone);
    }
    if (endereco !== undefined) {
      fields.push(`endereco = $${paramIndex++}`);
      values.push(endereco);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    fields.push(`updated_at = $${paramIndex++}`);
    values.push(new Date());
    values.push(id);

    const query = `
      UPDATE clientes 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await db.query(query, values);
    res.json({ customer: result.rows[0] });

  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// POST /api/customers/manage - Criar ou atualizar cliente
router.post('/manage', authenticateToken, async (req, res) => {
  console.log('[Backend] POST /api/customers/manage - Dados recebidos:', req.body);
  try {
    const { nome, telefone, endereco } = req.body;

    // Validações básicas - apenas nome é obrigatório
    if (!nome) {
      console.log('[Backend] Erro: Nome é obrigatório');
      return res.status(400).json({ 
        error: 'Nome é obrigatório' 
      });
    }

    // Verificar se cliente já existe
    let existing;
    if (telefone) {
      // Se tem telefone, buscar por telefone (mais preciso)
      existing = await db.query(
        'SELECT * FROM clientes WHERE telefone = $1',
        [telefone]
      );
    } else {
      // Se não tem telefone, buscar por nome exato
      existing = await db.query(
        'SELECT * FROM clientes WHERE LOWER(nome) = LOWER($1) AND telefone IS NULL',
        [nome]
      );
    }

    if (existing.rows.length > 0) {
      // Cliente existe - atualizar se necessário
      const existingCustomer = existing.rows[0];
      console.log('[Backend] Cliente encontrado:', existingCustomer);
      
      // Verificar se precisa atualizar
      if (existingCustomer.nome !== nome || existingCustomer.endereco !== endereco) {
        const updateResult = await db.query(`
          UPDATE clientes 
          SET nome = $1, endereco = $2, updated_at = CURRENT_TIMESTAMP
          WHERE id = $3
          RETURNING *
        `, [nome, endereco, existingCustomer.id]);
        
        console.log('[Backend] Cliente atualizado:', updateResult.rows[0]);
        return res.json({ 
          customer: updateResult.rows[0],
          action: 'updated' 
        });
      } else {
        console.log('[Backend] Cliente já existe e não precisa atualização');
        return res.json({ 
          customer: existingCustomer,
          action: 'existing' 
        });
      }
    } else {
      // Cliente não existe - criar novo
      const result = await db.query(`
        INSERT INTO clientes (nome, telefone, endereco)
        VALUES ($1, $2, $3)
        RETURNING *
      `, [nome, telefone || null, endereco || null]);

      console.log('[Backend] Cliente criado com sucesso:', result.rows[0]);
      return res.status(201).json({ 
        customer: result.rows[0],
        action: 'created' 
      });
    }
  } catch (error) {
    console.error('[Backend] Erro em /manage:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// DELETE /api/customers/:id - Deletar cliente
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se cliente existe
    const existingCustomer = await db.query('SELECT id FROM clientes WHERE id = $1', [id]);
    if (existingCustomer.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    // Verificar se cliente tem pedidos
    const ordersCheck = await db.query(
      'SELECT COUNT(*) as count FROM pedidos WHERE cliente_id = $1',
      [id]
    );

    if (parseInt(ordersCheck.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'Cliente possui pedidos',
        message: 'Não é possível excluir cliente com pedidos registrados' 
      });
    }

    await db.query('DELETE FROM clientes WHERE id = $1', [id]);
    res.json({ message: 'Cliente removido com sucesso' });

  } catch (error) {
    console.error('Erro ao deletar cliente:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

module.exports = router; 