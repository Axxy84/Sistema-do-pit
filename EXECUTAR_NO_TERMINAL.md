# 🖥️ Execute estes comandos no TERMINAL (fora do Claude Code)

## 🔧 Configurar Permissões PostgreSQL

### Opção 1: Executar estes comandos no terminal WSL:

```bash
# 1. Entrar como postgres
sudo -i -u postgres

# 2. Abrir PostgreSQL
psql

# 3. Executar estes comandos SQL (um por vez):
ALTER USER pizzaria_user CREATEDB;
GRANT ALL PRIVILEGES ON SCHEMA public TO pizzaria_user;
GRANT ALL PRIVILEGES ON DATABASE pizzaria_db TO pizzaria_user;
ALTER SCHEMA public OWNER TO pizzaria_user;
\q

# 4. Sair do postgres
exit

# 5. Voltar para o projeto e testar
cd /mnt/c/Users/GAMER/Documents/sistema-pit/Sistema-do-pit/backend
node scripts/migrate.js
```

### Opção 2: Script SQL direto

```bash
# Execute este comando no terminal:
sudo -u postgres psql pizzaria_db << 'EOF'
ALTER USER pizzaria_user CREATEDB;
GRANT ALL PRIVILEGES ON SCHEMA public TO pizzaria_user;
GRANT ALL PRIVILEGES ON DATABASE pizzaria_db TO pizzaria_user;
ALTER SCHEMA public OWNER TO pizzaria_user;
EOF
```

### ✅ Depois teste:
```bash
cd backend
node scripts/migrate.js
```

## 🎯 Resultado Esperado:
```
🚀 Iniciando criação das tabelas...
✅ Conectado ao PostgreSQL WSL (localhost)
✅ Tabela 'usuarios' criada com sucesso!
✅ Tabela 'clientes' criada com sucesso!
[... mais tabelas ...]
✅ Admin user criado com sucesso!
🎉 Migração concluída com sucesso!
```

**Execute no terminal WSL, não no Claude Code!** 🖥️