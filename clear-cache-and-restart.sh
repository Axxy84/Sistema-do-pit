#!/bin/bash

echo "🧹 Limpando cache e reiniciando sistema..."

# Parar servidor frontend se estiver rodando
echo "📍 Parando servidor frontend..."
kill $(lsof -t -i:5173) 2>/dev/null || echo "Frontend não estava rodando"

# Limpar node_modules e reinstalar
echo "📦 Limpando dependências do frontend..."
rm -rf node_modules package-lock.json
npm install

# Rebuild completo
echo "🔨 Rebuild do frontend..."
npm run build

# Reiniciar frontend
echo "🚀 Iniciando frontend..."
npm run dev &

echo "✅ Sistema reiniciado!"
echo "⚠️  IMPORTANTE: Faça hard refresh no navegador (Ctrl+Shift+R ou Cmd+Shift+R)"
echo "📌 Ou acesse: http://localhost:5173/?_t=$(date +%s)"