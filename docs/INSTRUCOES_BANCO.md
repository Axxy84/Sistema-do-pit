# 🎯 Instruções para Configurar o Banco

## Problema Atual
O PostgreSQL está instalado e funcionando, mas precisa ser configurado manualmente porque o sudo requer senha interativa.

## ⚡ Configuração Rápida (Execute no Terminal)

### Opção 1: Script Automático
```bash
# Execute este comando no terminal WSL:
chmod +x setup_db.sh && ./setup_db.sh
```

### Opção 2: Comandos Manuais
```bash
# 1. Entrar como usuário postgres
sudo -i -u postgres

# 2. Criar banco e usuário
createdb pizzaria_db
createuser --pwprompt pizzaria_user
# (Digite a senha: 8477)

# 3. Configurar permissões
psql
GRANT ALL PRIVILEGES ON DATABASE pizzaria_db TO pizzaria_user;
ALTER USER postgres PASSWORD '8477';
\q

# 4. Sair do usuário postgres
exit
```

### Opção 3: Script SQL Direto
```bash
# Execute como postgres
sudo -i -u postgres
psql -f /mnt/c/Users/GAMER/Documents/sistema-pit/Sistema-do-pit/config_db.sql
exit
```

## ✅ Teste Final
Após configurar, execute:
```bash
node test-db.cjs
```

## 🚨 Se der Erro de Autenticação
Edite o arquivo de configuração:
```bash
sudo nano /etc/postgresql/16/main/pg_hba.conf
```

Mude a linha:
```
local   all             all                                     peer
```
Para:
```
local   all             all                                     md5
```

Reinicie:
```bash
sudo service postgresql restart
```

## Status Atual
- ✅ PostgreSQL instalado e funcionando
- ✅ Arquivos de configuração criados
- 🔄 Aguardando configuração do banco
- 📁 Scripts disponíveis: `setup_db.sh`, `config_db.sql`

**O sistema está 99% pronto! Só falta esta configuração final.** 🚀