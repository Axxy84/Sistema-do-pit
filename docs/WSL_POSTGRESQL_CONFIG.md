# Configuração PostgreSQL Windows para WSL

## Problema Identificado
O sistema está executando no WSL, mas o PostgreSQL está instalado no Windows. A conexão está sendo recusada pelo arquivo `pg_hba.conf`.

## IPs Detectados
- **WSL IP (eth0)**: `192.168.223.24/20`
- **Windows vEthernet (WSL)**: `192.168.208.1`
- **Windows Ethernet principal**: `192.168.0.101`

## Análise de Conexão
- Quando usamos `DB_HOST=192.168.208.1`: PostgreSQL vê conexão de `192.168.223.24`
- Quando usamos `DB_HOST=192.168.0.101`: PostgreSQL vê conexão de `192.168.0.101`

## Configuração Necessária

### 1. Localizar o arquivo pg_hba.conf
O arquivo está normalmente em:
```
C:\Program Files\PostgreSQL\16\data\pg_hba.conf
```

### 2. Adicionar entrada para WSL
Adicione uma dessas linhas no arquivo `pg_hba.conf`:

**Opção 1 - Para DB_HOST=192.168.208.1 (vEthernet WSL):**
```
host    all             all             192.168.223.24/32       scram-sha-256
```

**Opção 2 - Para DB_HOST=192.168.0.101 (Ethernet principal):**
```
host    all             all             192.168.0.101/32        scram-sha-256
```

**Opção 3 - Range completo (mais flexível):**
```
host    all             all             192.168.0.0/16          scram-sha-256
```

### 3. Configurar postgresql.conf
No arquivo `postgresql.conf` (mesmo diretório), certifique-se que:
```
listen_addresses = '*'
port = 5432
```

### 4. Reiniciar PostgreSQL
**IMPORTANTE**: Você deve reiniciar o PostgreSQL no Windows após modificar o pg_hba.conf:

**Opção 1 - Via Serviços:**
- Pressione `Win + R`, digite `services.msc`
- Procure por "postgresql-x64-16" (ou similar)
- Clique direito → Reiniciar

**Opção 2 - Via PowerShell (como Admin):**
```powershell
net stop postgresql-x64-16
net start postgresql-x64-16
```

**Opção 3 - Via pg_ctl:**
```cmd
pg_ctl reload -D "C:\Program Files\PostgreSQL\16\data"
```

### 5. Teste a Conexão
Execute no WSL:
```bash
node test-db.cjs
```

## Alternativa: Usar localhost
Se não quiser modificar as configurações do PostgreSQL, pode usar:
```
DB_HOST=localhost
```

E configurar port forwarding:
```bash
netsh interface portproxy add v4tov4 listenport=5432 listenaddress=0.0.0.0 connectport=5432 connectaddress=192.168.208.1
```