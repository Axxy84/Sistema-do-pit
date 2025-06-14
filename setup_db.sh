#!/bin/bash
echo "🔧 Configurando PostgreSQL..."

# Configurar peer authentication para permitir acesso
echo "Configurando autenticação..."
sudo sed -i 's/local   all             all                                     peer/local   all             all                                     trust/' /etc/postgresql/16/main/pg_hba.conf

# Reiniciar PostgreSQL
echo "Reiniciando PostgreSQL..."
sudo service postgresql restart

# Aguardar PostgreSQL inicializar
sleep 3

# Conectar e criar banco/usuário
echo "Criando banco e usuário..."
psql -U postgres -c "CREATE DATABASE pizzaria_db;" 2>/dev/null || echo "Banco já existe"
psql -U postgres -c "CREATE USER pizzaria_user WITH PASSWORD '8477';" 2>/dev/null || echo "Usuário já existe"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE pizzaria_db TO pizzaria_user;"
psql -U postgres -c "ALTER USER postgres PASSWORD '8477';"

# Configurar de volta para md5
echo "Restaurando autenticação md5..."
sudo sed -i 's/local   all             all                                     trust/local   all             all                                     md5/' /etc/postgresql/16/main/pg_hba.conf

# Reiniciar novamente
sudo service postgresql restart

echo "✅ Configuração concluída!"
echo "Testando conexão..."
sleep 3