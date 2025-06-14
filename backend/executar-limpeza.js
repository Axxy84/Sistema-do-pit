require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'pizzaria_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '8477'
});

async function executarLimpeza() {
  let client;
  try {
    client = await pool.connect();
    
    console.log('🔄 Iniciando limpeza do dashboard via SQL direto...\n');
    
    // Ler o arquivo SQL
    const sqlPath = path.join(__dirname, 'limpar-dashboard.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Dividir o SQL em comandos individuais
    const comandos = sql.split(';').filter(cmd => cmd.trim());
    
    // Executar cada comando individualmente
    for (let i = 0; i < comandos.length; i++) {
      const comando = comandos[i].trim();
      if (comando) {
        try {
          console.log(`🔄 Executando comando ${i + 1}/${comandos.length}...`);
          const result = await client.query(comando);
          
          // Se o comando é um SELECT, mostrar os resultados
          if (comando.toLowerCase().includes('select') && result.rows) {
            console.log('📊 Resultado:');
            console.table(result.rows);
          } else {
            console.log('✅ Comando executado com sucesso');
          }
        } catch (error) {
          console.error(`❌ Erro ao executar comando: ${error.message}`);
          console.error(`Comando: ${comando}`);
        }
      }
    }
    
    console.log('\n✅ Limpeza do dashboard concluída!');
    console.log('🔄 Agora você pode testar os cálculos reais do dashboard.');
    console.log('⚠️ IMPORTANTE: Reinicie o servidor backend para limpar o cache em memória!');
    
  } catch (error) {
    console.error('\n❌ Erro durante a limpeza dos dados:', error.message);
    console.error(error.stack);
  } finally {
    if (client) {
      client.release();
    }
    process.exit(0);
  }
}

executarLimpeza(); 