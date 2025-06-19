#!/bin/bash

# Script para limpar arquivos de desenvolvimento/teste
# Execute com: bash cleanup-dev-files.sh

echo "🧹 Limpando arquivos de desenvolvimento e teste..."
echo ""

# Contar arquivos antes
BEFORE_COUNT=$(find . -type f -name "test-*" -o -name "debug-*" -o -name "check-*" | wc -l)

# Remover arquivos de teste
echo "📝 Removendo arquivos de teste..."
find . -name "test-*.js" -type f -delete 2>/dev/null
find . -name "test-*.cjs" -type f -delete 2>/dev/null
find . -name "test-*.html" -type f -delete 2>/dev/null
find . -name "test_*.js" -type f -delete 2>/dev/null
find . -name "test_*.cjs" -type f -delete 2>/dev/null
find . -name "testar-*.js" -type f -delete 2>/dev/null

# Remover arquivos de debug
echo "🐛 Removendo arquivos de debug..."
find . -name "debug-*.js" -type f -delete 2>/dev/null
find . -name "debug-*.cjs" -type f -delete 2>/dev/null

# Remover arquivos de verificação
echo "✔️  Removendo arquivos de verificação temporários..."
find . -name "check-*.js" -type f -delete 2>/dev/null
find . -name "check-*.cjs" -type f -delete 2>/dev/null
find . -name "check_*.js" -type f -delete 2>/dev/null
find . -name "verificar-*.js" -type f -delete 2>/dev/null

# Remover arquivos de correção temporários
echo "🔧 Removendo scripts de correção temporários..."
find . -name "fix-*.js" -type f -delete 2>/dev/null
find . -name "fix-*.cjs" -type f -delete 2>/dev/null

# Remover arquivos de população de dados
echo "📊 Removendo scripts de população de teste..."
rm -f backend/populate-*.js 2>/dev/null
rm -f backend/add-bebidas-exemplo.js 2>/dev/null
rm -f backend/add-*-column.js 2>/dev/null
rm -f backend/create-test-order.js 2>/dev/null
rm -f backend/criar-pedido-*.js 2>/dev/null

# Remover arquivos de migração temporários
echo "🔄 Removendo scripts de migração temporários..."
rm -f backend/migrate-product-types.js 2>/dev/null
rm -f backend/migrate-bordas-to-produtos.js 2>/dev/null

# Remover outros arquivos temporários
echo "🗑️  Removendo outros arquivos temporários..."
rm -f backend/example-connection.js 2>/dev/null
rm -f backend/verify_password.js 2>/dev/null
rm -f backend/generate-test-token.js 2>/dev/null
rm -f backend/create-admin-profile.js 2>/dev/null
rm -f backend/create-transacoes-table.js 2>/dev/null
rm -f backend/setup-deliverer-table.js 2>/dev/null
rm -f backend/limpar-*.js 2>/dev/null
rm -f backend/limpar-*.bat 2>/dev/null
rm -f backend/limpar-*.sh 2>/dev/null
rm -f clear-*.js 2>/dev/null
rm -f criar-icones-pwa.html 2>/dev/null
rm -f force-reload.html 2>/dev/null

# Remover source do teste
rm -f src/test-*.js 2>/dev/null

# Contar arquivos depois
AFTER_COUNT=$(find . -type f -name "test-*" -o -name "debug-*" -o -name "check-*" | wc -l 2>/dev/null || echo "0")

echo ""
echo "✅ Limpeza concluída!"
echo "📈 Arquivos removidos: $((BEFORE_COUNT - AFTER_COUNT))"
echo ""
echo "💡 Dica: Execute 'git status' para ver os arquivos removidos"