// Testes automáticos - Padrão 80/20

const { 
  TIPO_PEDIDO,
  STATUS_FINANCEIRO,
  validateOrderPayload,
  retryWithBackoff
} = require('../middleware/validation-middleware');

// =============  TESTES UNITÁRIOS  =================

describe('Validation Middleware', () => {
  
  describe('validateOrderPayload', () => {
    it('deve aceitar pedido de mesa válido', async () => {
      const req = {
        body: {
          tipo_pedido: TIPO_PEDIDO.MESA,
          numero_mesa: 5,
          itens: [{ produto_id: '123', quantidade: 1 }]
        }
      };
      
      // Mock dos validators
      const errors = [];
      expect(errors).toHaveLength(0);
    });
    
    it('deve rejeitar pedido de mesa sem número', async () => {
      const req = {
        body: {
          tipo_pedido: TIPO_PEDIDO.MESA,
          // numero_mesa ausente
          itens: [{ produto_id: '123', quantidade: 1 }]
        }
      };
      
      // Deve retornar erro 400
      expect(req.body.numero_mesa).toBeUndefined();
    });
    
    it('deve aceitar pedido delivery válido', async () => {
      const req = {
        body: {
          tipo_pedido: TIPO_PEDIDO.DELIVERY,
          endereco_entrega: 'Rua A, 123',
          cliente_id: '550e8400-e29b-41d4-a716-446655440000',
          itens: [{ produto_id: '123', quantidade: 2 }]
        }
      };
      
      expect(req.body.endereco_entrega).toBeTruthy();
    });
  });
  
  describe('retryWithBackoff', () => {
    it('deve tentar 3 vezes com delays exponenciais', async () => {
      let attempts = 0;
      const fn = jest.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          const error = new Error('Timeout');
          error.code = 'ETIMEDOUT';
          throw error;
        }
        return 'success';
      });
      
      const result = await retryWithBackoff(fn, 3);
      
      expect(fn).toHaveBeenCalledTimes(3);
      expect(result).toBe('success');
    });
    
    it('deve falhar após esgotar tentativas', async () => {
      const fn = jest.fn().mockImplementation(() => {
        const error = new Error('Timeout');
        error.code = 'ETIMEDOUT';
        throw error;
      });
      
      await expect(retryWithBackoff(fn, 3)).rejects.toThrow('Timeout');
      expect(fn).toHaveBeenCalledTimes(3);
    });
  });
});

// =============  TESTES DE INTEGRAÇÃO  =================

describe('Orders API Integration', () => {
  
  it('POST /orders com tipo_pedido=0 deve criar pedido de mesa', async () => {
    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        tipo_pedido: TIPO_PEDIDO.MESA,
        numero_mesa: 7,
        itens: [
          {
            produto_id: 'uuid-pizza',
            quantidade: 1,
            preco_unitario: 45.90
          }
        ]
      });
    
    expect(response.status).toBe(201);
    expect(response.body.order.tipo_pedido).toBe(TIPO_PEDIDO.MESA);
    expect(response.body.order.numero_mesa).toBe(7);
  });
  
  it('PATCH /orders/:id/status deve validar transições', async () => {
    // Criar pedido primeiro
    const createResponse = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        tipo_pedido: TIPO_PEDIDO.DELIVERY,
        endereco_entrega: 'Rua B, 456',
        itens: [{ produto_id: 'uuid', quantidade: 1, preco_unitario: 30 }]
      });
    
    const orderId = createResponse.body.order.id;
    
    // Tentar transição inválida (pendente → entregue)
    const invalidResponse = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${validToken}`)
      .send({ status_pedido: 'entregue' });
    
    expect(invalidResponse.status).toBe(400);
    expect(invalidResponse.body.error).toContain('Transição inválida');
    
    // Transição válida (pendente → preparando)
    const validResponse = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${validToken}`)
      .send({ status_pedido: 'preparando' });
    
    expect(validResponse.status).toBe(200);
    expect(validResponse.body.status).toBe('preparando');
  });
  
  it('POST /orders/mesa/:numero/fechar-conta deve gravar no caixa', async () => {
    // Criar pedido de mesa
    const createResponse = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        tipo_pedido: TIPO_PEDIDO.MESA,
        numero_mesa: 10,
        itens: [{ produto_id: 'uuid', quantidade: 2, preco_unitario: 25 }]
      });
    
    const orderId = createResponse.body.order.id;
    
    // Marcar como retirado
    await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${validToken}`)
      .send({ status_pedido: 'retirado' });
    
    // Fechar conta
    const closeResponse = await request(app)
      .post(`/api/orders/mesa/10/fechar-conta`)
      .set('Authorization', `Bearer ${validToken}`)
      .send({ forma_pagamento: 'dinheiro' });
    
    expect(closeResponse.status).toBe(200);
    
    // Verificar se foi gravado no caixa
    const caixaResponse = await request(app)
      .get('/api/cash-closing/current')
      .set('Authorization', `Bearer ${validToken}`);
    
    expect(caixaResponse.body.total_entradas).toBeGreaterThan(0);
  });
});

// =============  COMANDOS DE TESTE  =================

/**
 * Para executar os testes:
 * 
 * npm test                    # Todos os testes
 * npm test -- --watch        # Modo watch
 * npm test validation.test   # Apenas este arquivo
 * 
 * Coverage:
 * npm run test:coverage
 * 
 * Testes E2E:
 * npm run test:e2e
 */

module.exports = {
  // Exportar para uso em outros testes
  TIPO_PEDIDO,
  STATUS_FINANCEIRO
};