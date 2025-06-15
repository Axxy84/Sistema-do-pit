const jwt = require('jsonwebtoken');

async function testOwnerEndpoint() {
  try {
    // Usar a mesma chave JWT do sistema
    const JWT_SECRET = 'sua_chave_secreta_muito_forte_aqui_change_me';
    
    // Gerar token válido para o usuário admin
    const token = jwt.sign(
      { userId: '99a62b24-7acd-4bd0-a84c-9ee2164cec26' }, 
      JWT_SECRET, 
      { expiresIn: '24h' }
    );

    console.log('🔑 Token de teste gerado para admin@pizzaria.com');
    console.log('Token:', token.substring(0, 50) + '...');

    // Testar o endpoint
    const response = await fetch('http://localhost:3001/api/owner/verify', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    console.log(`\n📡 Resposta HTTP ${response.status}:`);
    console.log(JSON.stringify(data, null, 2));

    if (response.ok && data.success && data.isOwner) {
      console.log('\n✅ Endpoint funcionando corretamente!');
      console.log(`👤 Owner: ${data.user.name} (${data.user.email})`);
    } else {
      console.log('\n❌ Endpoint com problema');
    }

  } catch (error) {
    console.error('❌ Erro ao testar endpoint:', error.message);
  }
}

testOwnerEndpoint();