# 🖥️ Instalação Manual no Windows

Para instalação do sistema com Node.js e PostgreSQL nativos.

## 📦 Downloads necessários

1. **PostgreSQL 15**
   - https://www.postgresql.org/download/windows/
   - Baixe o instalador (cerca de 200MB)

2. **Node.js 18 LTS**
   - https://nodejs.org/
   - Baixe o Windows Installer (.msi)

3. **Git** (opcional, para clonar o código)
   - https://git-scm.com/download/win

## 🔧 Passo 1: Instalar PostgreSQL

1. Execute o instalador PostgreSQL
2. Durante a instalação:
   - Password: `8477` (ou sua escolha)
   - Port: `5432` (padrão)
   - ✅ PostgreSQL Server
   - ✅ pgAdmin 4
   - ❌ Stack Builder (não precisa)

3. Após instalar, abra pgAdmin 4
4. Crie um banco:
   - Clique direito em "Databases"
   - Create → Database
   - Name: `pizzaria_db`

## 🔧 Passo 2: Instalar Node.js

1. Execute o instalador Node.js
2. Aceite todas as opções padrão
3. Teste no PowerShell:
   ```powershell
   node --version
   npm --version
   ```

## 🔧 Passo 3: Configurar o Sistema

### 1. Extrair código
- Extraia o ZIP do sistema para `C:\sistema-pizzaria`

### 2. Configurar banco de dados
Abra PowerShell na pasta `C:\sistema-pizzaria`:

```powershell
# Entrar na pasta backend
cd backend

# Instalar dependências
npm install

# Criar arquivo .env
copy production.env .env

# Editar .env (abra com Notepad)
notepad .env
```

Configure o `.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pizzaria_db
DB_USER=postgres
DB_PASSWORD=8477
JWT_SECRET=coloque_uma_senha_segura_aqui_123456
PORT=3001
NODE_ENV=production
CORS_ORIGIN=http://localhost:5173
```

### 3. Criar tabelas no banco
```powershell
# Ainda na pasta backend
node scripts/migrate.js
```

## 🚀 Passo 4: Iniciar o Sistema

### Terminal 1 - Backend
```powershell
cd C:\sistema-pizzaria\backend
npm start
```
Deixe rodando. Deve mostrar: "Servidor rodando na porta 3001"

### Terminal 2 - Frontend
Abra OUTRO PowerShell:
```powershell
cd C:\sistema-pizzaria
npm install
npm run dev
```

## ✅ Passo 5: Acessar

- Abra o navegador
- Digite: `http://localhost:5173`
- Login: `admin@pizzaria.com`
- Senha: `admin123`

## 🛠️ Criar atalhos no Desktop

### Atalho "Iniciar Sistema"
1. Crie arquivo `iniciar-sistema.bat`:
```batch
@echo off
echo Iniciando Sistema Pizzaria...
start "Backend" cmd /k "cd /d C:\sistema-pizzaria\backend && npm start"
timeout /t 5
start "Frontend" cmd /k "cd /d C:\sistema-pizzaria && npm run dev"
echo.
echo Sistema iniciado!
echo Frontend: http://localhost:5173
pause
```

2. Salve em `C:\sistema-pizzaria\`
3. Crie atalho no Desktop

### Atalho "Parar Sistema"
1. Crie arquivo `parar-sistema.bat`:
```batch
@echo off
echo Parando sistema...
taskkill /F /IM node.exe
echo Sistema parado!
pause
```

## 🔧 Otimizações para PC fraco

### 1. Configurar PostgreSQL para usar menos RAM
Edite `C:\Program Files\PostgreSQL\15\data\postgresql.conf`:
```conf
shared_buffers = 128MB
work_mem = 2MB
maintenance_work_mem = 32MB
effective_cache_size = 256MB
```

### 2. Limitar Node.js
No arquivo `iniciar-sistema.bat`, mude para:
```batch
start "Backend" cmd /k "cd /d C:\sistema-pizzaria\backend && set NODE_OPTIONS=--max-old-space-size=512 && npm start"
```

### 3. Build de produção (mais rápido)
```powershell
cd C:\sistema-pizzaria
npm run build
npm install -g serve
serve -s dist -l 5173
```

## 🔍 Verificar se está funcionando

1. Backend: http://localhost:3001/health
2. Frontend: http://localhost:5173
3. PostgreSQL: Abra pgAdmin e veja o banco `pizzaria_db`

## ❌ Problemas comuns

### "npm: comando não reconhecido"
- Reinicie o computador após instalar Node.js
- Ou adicione ao PATH: `C:\Program Files\nodejs\`

### "Porta 3001 já em uso"
```powershell
netstat -ano | findstr :3001
taskkill /PID [numero_do_pid] /F
```

### "Cannot connect to database"
- Verifique se PostgreSQL está rodando
- Veja em: Serviços → postgresql-x64-15

### PC muito lento
- Feche o pgAdmin após criar o banco
- Use Chrome no modo anônimo
- Considere usar o Edge (mais leve)

## 💾 Backup manual

```powershell
cd C:\Program Files\PostgreSQL\15\bin
pg_dump -U postgres pizzaria_db > C:\backup_pizzaria.sql
```

## 🎯 Resumo dos comandos

```powershell
# Iniciar backend
cd C:\sistema-pizzaria\backend
npm start

# Iniciar frontend
cd C:\sistema-pizzaria
npm run dev

# Parar tudo
Ctrl+C nas janelas ou fechar
```

---

**Vantagem**: Instalação simples e direta
**Desvantagem**: Precisa iniciar manualmente

Esta instalação funciona bem em PCs com 2-4GB RAM!