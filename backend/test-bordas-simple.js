const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/bordas',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';

  console.log(`Status: ${res.statusCode}`);

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('Resposta:', JSON.stringify(json, null, 2));
    } catch (e) {
      console.log('Resposta (texto):', data);
    }
  });
});

req.on('error', (error) => {
  console.error('Erro:', error.message);
});

req.end();