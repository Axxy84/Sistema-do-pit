# 📁 ESTRUTURA ORGANIZADA DO PROJETO

O projeto foi reorganizado para melhor manutenção e clareza. Aqui está a nova estrutura:

## 🗂️ Estrutura de Pastas

```
Sistema-do-pit/
├── 📁 backend/          # Servidor Node.js/Express
│   ├── cache/          # Sistema de cache
│   ├── config/         # Configurações
│   ├── middleware/     # Middlewares
│   ├── routes/         # Rotas da API
│   ├── scripts/        # Scripts de migração
│   └── tests/          # Testes do backend
│
├── 📁 src/             # Frontend React
│   ├── components/     # Componentes React
│   ├── contexts/       # Contextos React
│   ├── hooks/          # Hooks customizados
│   ├── lib/            # Utilitários
│   ├── pages/          # Páginas
│   └── services/       # Serviços de API
│
├── 📁 public/          # Arquivos públicos
│   └── icon.ico       # Ícone do sistema
│
├── 📁 docs/            # TODA DOCUMENTAÇÃO
│   ├── *.md           # Guias e documentações
│   └── *.txt          # Instruções e notas
│
├── 📁 instaladores/    # INSTALAÇÃO E DEPLOY
│   ├── scripts/       # Scripts de build
│   │   ├── build-exe.bat
│   │   ├── build-portable.bat
│   │   └── criar-instalador-simples.bat
│   │
│   ├── INICIAR-INSTALACAO.bat
│   ├── instalar-automatico.bat
│   ├── deploy-lite.bat
│   └── subir-docker.bat
│
├── 📁 tools/           # FERRAMENTAS E UTILITÁRIOS
│   ├── diagnostico-instalacao.bat
│   ├── clear-cache.js
│   ├── find-free-port.js
│   └── jwt-refresh-solution.js
│
├── 📁 tests/           # TESTES E VERIFICAÇÕES
│   ├── debug/         # Scripts de debug
│   ├── check_data.js
│   └── check_tables.js
│
├── 📁 database-scripts/ # SCRIPTS DE BANCO
│   ├── add_test_data.js
│   └── *.sql
│
├── 📁 scripts/         # SCRIPTS SHELL
│   └── *.sh
│
├── 📁 infra/           # INFRAESTRUTURA
│   ├── docker-compose.yml
│   ├── Dockerfile
│   └── nginx.conf
│
├── 📁 dist/            # Build do frontend (gerado)
├── 📁 node_modules/    # Dependências (gerado)
│
├── 📄 README.md        # Documentação principal
├── 📄 package.json     # Configuração do projeto
├── 📄 vite.config.js   # Configuração Vite
└── 📄 start-backend.bat # Script essencial na raiz
```

## 🚀 Arquivos Importantes

### Na Raiz (Arquivos essenciais apenas)
- `README.md` - Documentação principal
- `package.json` - Dependências e scripts
- `start-backend.bat` - Iniciar backend rapidamente
- Arquivos de configuração (vite, eslint, postcss, etc)

### Para Instalar
- Use arquivos em `instaladores/`
- Execute `INICIAR-INSTALACAO.bat` 

### Para Documentação
- Veja pasta `docs/`
- Todos os guias e instruções estão lá

### Para Desenvolvimento
- Backend: `backend/`
- Frontend: `src/`
- Testes: `tests/` e `backend/tests/`

## 🎯 Benefícios da Organização

1. **Mais fácil de navegar** - Tudo categorizado
2. **Raiz limpa** - Apenas arquivos essenciais
3. **Documentação centralizada** - Tudo em `docs/`
4. **Instaladores organizados** - Fácil de encontrar
5. **Separação clara** - Backend, frontend, tools, etc

## 💡 Dicas

- Para instalar: Vá direto em `instaladores/`
- Para ler docs: Vá em `docs/`
- Para ferramentas: Vá em `tools/`
- Para testes: Vá em `tests/`