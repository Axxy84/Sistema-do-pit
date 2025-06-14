# 🚀 Comandos Simples para Configurar PostgreSQL

## ⚡ Execute estes comandos no terminal WSL:

### 1. Primeiro, execute este comando:
```bash
sudo -i -u postgres
```
(Digite a senha do seu usuário quando solicitado)

### 2. Depois, execute estes comandos um por vez:
```bash
createdb pizzaria_db
createuser pizzaria_user
psql -c "ALTER USER pizzaria_user WITH PASSWORD '8477';"
psql -c "GRANT ALL PRIVILEGES ON DATABASE pizzaria_db TO pizzaria_user;"
psql -c "ALTER USER postgres PASSWORD '8477';"
exit
```

### 3. Configure autenticação (ainda no terminal):
```bash
sudo sed -i 's/peer/md5/g' /etc/postgresql/16/main/pg_hba.conf
sudo service postgresql restart
```

### 4. Teste a conexão:
```bash
node test-db.cjs
```

## 📋 Sequência Completa (Copie e Cole):
```bash
# Passo 1
sudo -i -u postgres

# Passo 2 (execute dentro do postgres)
createdb pizzaria_db
createuser pizzaria_user  
psql -c "ALTER USER pizzaria_user WITH PASSWORD '8477';"
psql -c "GRANT ALL PRIVILEGES ON DATABASE pizzaria_db TO pizzaria_user;"
psql -c "ALTER USER postgres PASSWORD '8477';"
exit

# Passo 3 (volta ao usuário normal)
sudo sed -i 's/peer/md5/g' /etc/postgresql/16/main/pg_hba.conf
sudo service postgresql restart

# Passo 4 (teste)
node test-db.cjs
```

## ✅ Resultado Esperado:
```
✅ Conectado ao PostgreSQL
✅ Tabelas verificadas
✅ Sistema pronto!
```

**Execute no terminal WSL fora do Claude Code!** 🖥️