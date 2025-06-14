#!/bin/bash
echo "🔧 Configurando permissões PostgreSQL..."

# Tentar configurar permissões via peer authentication
echo "Tentando configurar permissões..."

# Método 1: Temporariamente usar trust authentication
sudo sed -i 's/local   all             all                                     md5/local   all             all                                     trust/' /etc/postgresql/16/main/pg_hba.conf
sudo service postgresql restart
sleep 2

# Configurar permissões
sudo -u postgres psql -c "ALTER USER pizzaria_user CREATEDB;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON SCHEMA public TO pizzaria_user;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE pizzaria_db TO pizzaria_user;"

# Restaurar md5 authentication
sudo sed -i 's/local   all             all                                     trust/local   all             all                                     md5/' /etc/postgresql/16/main/pg_hba.conf
sudo service postgresql restart
sleep 2

echo "✅ Permissões configuradas!"
echo "Teste: node scripts/migrate.js"