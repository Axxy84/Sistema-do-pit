# 💻 Instalação Windows 10 - Versão LITE (4GB RAM)

## ⚡ Otimizado para PCs com poucos recursos

Este guia é específico para Windows 10 com:
- 4GB RAM ou menos
- Processador Celeron ou similar
- Pouco espaço em disco

## 📋 Pré-requisitos

### 1. Instalar PostgreSQL

1. **Baixe o PostgreSQL**:
   - Acesse: https://www.postgresql.org/download/windows/
   - Baixe o instalador (cerca de 200MB)
   - Execute o instalador

2. **Durante a instalação**:
   - Password: `8477` (ou sua escolha)
   - Port: `5432` (padrão)
   - ✅ PostgreSQL Server
   - ✅ pgAdmin 4
   - ❌ Stack Builder (não precisa)

3. **Após instalar, configure para usar menos RAM**:
   - Abra pgAdmin 4
   - Crie um banco: `pizzaria_db`

### 2. Instalar Node.js

1. **Baixe o Node.js**:
   - Acesse: https://nodejs.org/
   - Baixe o Windows Installer (.msi)
   - Execute o instalador

2. **Aceite todas as opções padrão**

3. **Teste no PowerShell**:
   ```powershell
   node --version
   npm --version
   ```

## 🚀 Instalação do Sistema

### 1. Baixar o sistema

Se ainda não tem o código:
- Baixe o ZIP do repositório
- Extraia para `C:\sistema-pizzaria`

### 2. Configurar Backend

Abra PowerShell na pasta do sistema:

```powershell
# Entrar na pasta backend
cd C:\sistema-pizzaria\backend

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

## 📱 Como usar o sistema

### Iniciar sistema

**Terminal 1 - Backend:**
```powershell
cd C:\sistema-pizzaria\backend
npm start
```

**Terminal 2 - Frontend:**
```powershell
cd C:\sistema-pizzaria
npm install
npm run dev
```

### Acessar
- Abra o navegador
- Digite: `http://localhost:5173`
- Login: `admin@pizzaria.com`
- Senha: `admin123`

### Parar sistema (economizar recursos)
- Pressione `Ctrl+C` em cada terminal
- Ou feche as janelas

## 🔧 Otimizações aplicadas

A versão LITE tem as seguintes otimizações:

1. **PostgreSQL**: Configurado para usar no máximo 512MB RAM
2. **Backend**: Limitado a 512MB RAM
3. **Frontend**: Servido em modo desenvolvimento
4. **Cache**: Em memória do Node.js

## ⚠️ Dicas importantes

### 1. Feche outros programas
Antes de iniciar o sistema, feche:
- Chrome/Firefox (consomem muita RAM)
- Outros programas pesados

### 2. Performance
- O sistema pode demorar alguns segundos para responder
- Primeira inicialização demora mais
- Após instalado, inicia rapidamente

### 3. Backup regular
```powershell
cd C:\Program Files\PostgreSQL\15\bin
pg_dump -U postgres pizzaria_db > C:\backup_pizzaria.sql
```

### 4. Se travar
- Use `Ctrl+C` para parar
- Reinicie os serviços

## 🆘 Problemas comuns

### "npm: comando não reconhecido"
1. Reinicie o computador após instalar Node.js
2. Ou adicione ao PATH: `C:\Program Files\nodejs\`

### "Cannot connect to database"
1. Verifique se PostgreSQL está rodando
2. Veja em: Serviços → postgresql-x64-15

### Sistema muito lento
1. Use Chrome no modo anônimo (usa menos RAM)
2. Evite abrir muitas abas
3. Faça pausas entre operações

### "Port 3001 already in use"
1. Abra o Gerenciador de Tarefas
2. Procure por processos Node.js
3. Finalize esses processos

## 💡 Criar atalhos no Desktop

### Atalho "Iniciar Sistema"
Crie arquivo `iniciar-sistema.bat`:
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

### Atalho "Parar Sistema"
Crie arquivo `parar-sistema.bat`:
```batch
@echo off
echo Parando sistema...
taskkill /F /IM node.exe
echo Sistema parado!
pause
```

## 📊 Requisitos vs Realidade

| Componente | Ideal | Versão LITE | Seu PC |
|------------|-------|-------------|---------|
| RAM | 8GB | 2GB | 4GB ✓ |
| CPU | i5 | 2 cores | Celeron ✓ |
| Disco | SSD | 10GB | HDD ✓ |

A versão LITE foi testada em PCs similares ao seu!

---

**Dica final**: Esta instalação manual é mais leve e eficiente para PCs com recursos limitados.