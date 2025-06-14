// Debug simples do endpoint de status
const express = require('express');
const app = express();
app.use(express.json());

// Simular o endpoint
app.patch('/test/:id/status', (req, res) => {
  const { status_pedido } = req.body;
  const validStatuses = ['pendente', 'preparando', 'pronto', 'saiu_entrega', 'entregue', 'retirado', 'cancelado'];
  
  console.log('Recebido status:', status_pedido);
  console.log('Status válidos:', validStatuses);
  console.log('Status é válido?', validStatuses.includes(status_pedido));
  
  if (!validStatuses.includes(status_pedido)) {
    return res.status(400).json({ 
      error: 'Status inválido',
      message: `Status deve ser um dos: ${validStatuses.join(', ')}`,
      receivedStatus: status_pedido,
      validStatuses: validStatuses
    });
  }
  
  res.json({ success: true, status: status_pedido });
});

// Testar
app.listen(4000, () => {
  console.log('Servidor de teste rodando na porta 4000');
  
  // Fazer requisição de teste
  const http = require('http');
  const data = JSON.stringify({ status_pedido: 'retirado' });
  
  const options = {
    hostname: 'localhost',
    port: 4000,
    path: '/test/123/status',
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };
  
  const req = http.request(options, (res) => {
    let responseData = '';
    
    res.on('data', (chunk) => {
      responseData += chunk;
    });
    
    res.on('end', () => {
      console.log('\nResposta:', res.statusCode);
      console.log('Dados:', responseData);
      process.exit(0);
    });
  });
  
  req.on('error', (error) => {
    console.error('Erro:', error);
    process.exit(1);
  });
  
  req.write(data);
  req.end();
});