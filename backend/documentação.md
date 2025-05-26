📄 Documentação de Repasse: Sistema para Pizzaria — Infraestrutura + Backend
1. Arquitetura
Banco de Dados: PostgreSQL rodando em container Docker, no servidor neural (Ubuntu, IP fixo: 192.168.0.105)

Backend: Node.js, padrão Express (pode ser adaptado para Fastify), estrutura modular (config, middleware, routes, scripts)

Conexão: Backend conecta ao banco pelo IP fixo via variáveis de ambiente (arquivo .env)

Acesso seguro: Servidor neural acessível via SSH, com atalho neural

2. Estrutura de Pastas
bash
Copiar código
Projetos/pizzaria/
├── backend/
│   ├── config/
│   │   ├── db.cjs     # Conexão com PostgreSQL (CommonJS)
│   │   └── ...
│   ├── middleware/
│   ├── routes/
│   ├── scripts/
│   ├── .env           # Variáveis do banco (NUNCA subir para o git)
│   ├── package.json
│   ├── server.js      # Ponto de entrada do backend
│   └── test-db.cjs    # Teste de conexão
├── infra/
│   ├── docker-compose.yml
│   └── .env           # Variáveis do Docker Compose
└── ...
3. Variáveis de ambiente (exemplo de .env no backend)
env
Copiar código
DB_HOST=192.168.0.105
DB_PORT=5432
DB_USER=pizzaria_user
DB_PASS=pizzaria_pass
DB_NAME=pizzaria_db
4. Exemplo de Conexão (backend/config/db.cjs)
js
Copiar código
const dotenv = require('dotenv');
const { Client } = require('pg');
dotenv.config();

const client = new Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

client.connect()
  .then(() => console.log('✅ Conectado ao PostgreSQL do neural!'))
  .catch(err => console.error('❌ Erro de conexão com o PostgreSQL:', err));

module.exports = client;
5. Teste rápido (backend/test-db.cjs)
js
Copiar código
const db = require('./config/db.cjs');

db.query('SELECT NOW()')
  .then(res => {
    console.log('Hora atual do PostgreSQL:', res.rows[0]);
    db.end();
  })
  .catch(err => {
    console.error('Erro ao consultar o banco:', err);
    db.end();
  });
6. Rodando o Backend
bash
Copiar código
cd backend
npm install
node test-db.cjs    # Teste de conexão
node server.js      # (depois, rode o servidor principal)
7. Como avançar no desenvolvimento
Implementar as rotas REST: (exemplo: /pedidos, /produtos, /clientes)

CRUD para entidades principais: pizzas, ingredientes, pedidos, usuários (funcionários), clientes

Validação de dados: (middlewares)

Autenticação: JWT ou session para usuários do sistema

Integração futura: Power BI, dashboards, bots financeiros, admin web

Documentar sempre que criar rotas novas e usar migrations

8. Dicas DevOps
Nunca subir .env para o Git!

Usar volumes Docker para persistir dados do banco.

Fazer backup periódico do banco (pode agendar script ou usar Docker volume).

Manter a documentação do setup sempre atualizada para novos devs/LLMs.

9. Como rodar o banco (no neural):
bash
Copiar código
cd ~/Projetos/pizzaria/infra
docker compose up -d
10. Acesso remoto ao banco e ao neural
SSH:

bash
Copiar código
ssh neural
PostgreSQL:
Host: 192.168.0.105
Porta: 5432