# Guia para Resetar Senha do PostgreSQL

## Opções para resetar a senha do usuário pizzaria_user:

### 1. Via SSH no servidor (192.168.0.105)

Se você tem acesso SSH ao servidor:

```bash
# Conecte ao servidor
ssh seu_usuario@192.168.0.105

# Use sudo para executar como postgres
sudo -u postgres psql

# No prompt do PostgreSQL, execute:
ALTER USER pizzaria_user WITH PASSWORD 'nova_senha_aqui';
\q
```

### 2. Usando a senha do usuário postgres

Se você sabe a senha do usuário postgres:

```bash
psql -h 192.168.0.105 -U postgres -d pizzaria_db
# Digite a senha do postgres quando solicitado

# Depois execute:
ALTER USER pizzaria_user WITH PASSWORD 'nova_senha_aqui';
\q
```

### 3. Verificar se o usuário existe

Primeiro verifique se o usuário existe:

```bash
# Com sudo no servidor
sudo -u postgres psql -c "\du"

# Ou com senha do postgres
psql -h 192.168.0.105 -U postgres -c "\du"
```

### 4. Criar o usuário se não existir

Se o usuário não existir:

```sql
CREATE USER pizzaria_user WITH PASSWORD 'nova_senha_aqui';
GRANT ALL PRIVILEGES ON DATABASE pizzaria_db TO pizzaria_user;
```

## Após resetar a senha:

1. Atualize o arquivo `.env`:
   ```
   DB_PASSWORD=nova_senha_aqui
   ```

2. Ou execute o verificador:
   ```bash
   node verify_password.js
   ```
   E digite a nova senha quando solicitado.

## Senhas comuns para testar:

Se você configurou o sistema antes, tente estas senhas comuns:
- pizzaria_pass
- pizzaria123
- admin123
- postgres
- 123456

Para testar cada uma:
```bash
node verify_password.js
# Digite a senha quando solicitado
```