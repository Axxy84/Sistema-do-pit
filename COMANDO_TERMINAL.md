# 🖥️ Como Executar Comandos Sudo no Terminal

## O Problema
O Claude Code não pode executar comandos `sudo` que requerem senha porque não tem acesso ao terminal interativo.

## ✅ Solução: Execute no Terminal WSL

### 1. Abrir Terminal WSL
**Opções:**
- **Windows Terminal**: `Ctrl + Shift + ~` ou abra "Windows Terminal"
- **CMD**: Digite `wsl` e pressione Enter
- **PowerShell**: Digite `wsl` e pressione Enter

### 2. Navegar até o Projeto
```bash
cd /mnt/c/Users/GAMER/Documents/sistema-pit/Sistema-do-pit
```

### 3. Executar Configuração do PostgreSQL

**Opção A - Script Automático:**
```bash
chmod +x setup_db.sh
./setup_db.sh
```

**Opção B - Comandos Manuais:**
```bash
# 1. Entrar como usuário postgres
sudo -i -u postgres

# 2. Criar banco
createdb pizzaria_db

# 3. Criar usuário (vai pedir senha: digite 8477)
createuser --pwprompt pizzaria_user

# 4. Configurar permissões
psql
GRANT ALL PRIVILEGES ON DATABASE pizzaria_db TO pizzaria_user;
ALTER USER postgres PASSWORD '8477';
\q

# 5. Sair
exit
```

### 4. Testar Conexão
```bash
node test-db.cjs
```

## 🔑 Senha do Usuario WSL
Se pedir senha do sudo, use a senha do seu usuário Windows/WSL.

## 🎯 Resultado Esperado
```
✅ Conectado ao PostgreSQL
✅ Banco pizzaria_db criado
✅ Usuário pizzaria_user configurado
✅ Sistema pronto para uso
```

## 🚀 Depois da Configuração
Volte ao Claude Code e eu posso:
- Testar a conexão
- Verificar saúde do backend
- Executar testes de integração
- Fazer commit final

**O terminal interativo é necessário apenas para esta configuração inicial!**