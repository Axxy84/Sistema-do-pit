📄 Mini Documentação do Sistema Pizzaria ERP
🧩 Visão Geral
O projeto é um ERP de pizzaria fullstack, rodando com arquitetura DevOps moderna:

Backend: Node.js + Express (conectado ao PostgreSQL no neural)

Frontend: React + Vite (rodando na raiz do projeto, porta 5173)

Banco: PostgreSQL rodando em Docker no servidor neural (IP fixo)

Autenticação: Tela de login integrada, usuário admin criado na migração inicial

Infraestrutura: Docker Compose, variáveis de ambiente, scripts automatizados

🔗 Como acessar
Frontend:
http://localhost:5173
(Login com admin@pizzaria.com / admin123)

Backend:
Roda na porta 3001 (npm run dev em /backend)

🔒 Autenticação
Usuário padrão:
Email: admin@pizzaria.com
Senha: admin123
(Senha gerada e criptografada via bcryptjs na migração; altere no primeiro login)

📊 Dashboard
No painel lateral (menu) do sistema, estão disponíveis os seguintes módulos:

Dashboard:
Visão geral dos dados da pizzaria (pedidos do dia, faturamento, métricas rápidas)

Produtos:
Cadastro e gerenciamento de pizzas, bebidas, combos, etc

Ingredientes:
Controle de estoque e insumos (possível mapear produtos por ingredientes)

Pedidos:
Registro e acompanhamento dos pedidos em andamento, concluídos, cancelados, etc

Clientes:
Cadastro, histórico e busca de clientes

Entregas:
Logística e status das entregas (entregadores, rotas, horários)

Fechamento de Caixa:
Controle financeiro do fechamento diário (entradas, saídas, balanço)

Relatórios:
Gráficos, KPIs, análises de vendas, fluxo de caixa, etc (integrável com Power BI)

Cupons:
Gerenciamento de cupons de desconto/promos

Área do Dono:
Configurações avançadas, gestão de permissões, logs administrativos

⚙️ Funcionalidades implementadas e testadas
Infra completa com IP fixo, SSH e Docker Compose

Migração automática do banco: tabelas, índices, usuário admin padrão

Backend testado via health check /api/health (retorna status e conexão)

Login integrado ao backend (admin e futuros usuários)

Frontend e backend rodando localmente, comunicação via REST API

Código modular e pronto para expansão (CRUD, autenticação, integrações)

📝 Instruções para DEV/LLM continuar
Sempre rode os comandos do backend na pasta /backend

npm run dev para iniciar o servidor

npm run migrate para migrar/criar o banco

Frontend roda na raiz

npm run dev (porta 5173)

Acesse o painel pelo navegador

http://localhost:5173

Para evoluir:

Implementar rotas e CRUD para cada módulo (produtos, pedidos, etc)

Melhorar relatórios/dashboards

Criar testes automatizados

Documentar endpoints e payloads das APIs

🛡️ Recomendações
Nunca subir .env para o git (contém dados sensíveis)

Sempre revisar dependências de segurança antes de deploy

Manter a documentação atualizada para facilitar o onboarding de outros devs/LLMs

Resumo para LLM/DEV
“Sistema ERP de pizzaria moderno, backend Node/Express, frontend React/Vite, banco em Docker/PostgreSQL. Pronto para escalar, seguro, documentado, e já com módulos principais de gestão. Priorize criação e evolução das rotas, integrações e dashboards.”

