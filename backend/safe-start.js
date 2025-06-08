const { exec, spawn } = require('child_process');
const net = require('net');

function killPortProcesses(port) {
  return new Promise((resolve) => {
    exec(`lsof -ti:${port}`, (error, stdout) => {
      if (error || !stdout.trim()) {
        console.log(`✅ Porta ${port} já está livre`);
        resolve();
        return;
      }
      
      const pids = stdout.trim().split('\n');
      console.log(`⚠️  Processos encontrados na porta ${port}: ${pids.join(', ')}`);
      console.log('🔪 Encerrando processos...');
      
      let killed = 0;
      pids.forEach(pid => {
        exec(`kill -9 ${pid}`, () => {
          killed++;
          console.log(`✅ Processo ${pid} encerrado`);
          if (killed === pids.length) {
            setTimeout(() => {
              console.log(`✅ Porta ${port} liberada`);
              resolve();
            }, 1000);
          }
        });
      });
    });
  });
}

function checkPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    
    server.on('error', () => resolve(false));
  });
}

async function startServer() {
  const port = process.env.PORT || 3001;
  
  console.log('🚀 INICIADOR SEGURO DO BACKEND PIZZARIA');
  console.log(`🔍 Verificando porta ${port}...\n`);
  
  // Verificar se porta está livre
  const isFree = await checkPortFree(port);
  
  if (!isFree) {
    console.log(`⚠️  Porta ${port} está ocupada`);
    await killPortProcesses(port);
  }
  
  // Verificar novamente
  const isNowFree = await checkPortFree(port);
  
  if (!isNowFree) {
    console.log(`❌ Não foi possível liberar a porta ${port}`);
    console.log('💡 Tente usar uma porta diferente: PORT=3002 npm start');
    process.exit(1);
  }
  
  console.log(`🎯 Iniciando servidor na porta ${port}...\n`);
  
  // Iniciar servidor com nodemon ou node
  const useNodemon = process.argv.includes('--nodemon');
  const command = useNodemon ? 'nodemon' : 'node';
  const args = ['server.js'];
  
  const serverProcess = spawn(command, args, {
    stdio: 'inherit',
    env: { ...process.env, PORT: port }
  });
  
  serverProcess.on('error', (error) => {
    if (error.code === 'ENOENT' && command === 'nodemon') {
      console.log('⚠️  nodemon não encontrado, tentando com node...');
      startServer();
    } else {
      console.error('❌ Erro ao iniciar servidor:', error.message);
    }
  });
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Encerrando servidor...');
    serverProcess.kill('SIGTERM');
    process.exit(0);
  });
}

startServer();