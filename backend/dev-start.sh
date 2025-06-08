#!/bin/bash
# =====================================================
# SCRIPT PARA INICIAR BACKEND SEM CONFLITOS DE PORTA
# =====================================================

PORT=${PORT:-3001}
echo "🚀 Iniciando backend na porta $PORT..."

# Função para matar processos na porta
kill_port() {
    local port=$1
    echo "🔍 Verificando porta $port..."
    
    PIDS=$(lsof -ti:$port 2>/dev/null)
    if [ -n "$PIDS" ]; then
        echo "⚠️  Processos encontrados na porta $port: $PIDS"
        echo "🔪 Encerrando processos..."
        
        for PID in $PIDS; do
            kill -9 $PID 2>/dev/null
            if [ $? -eq 0 ]; then
                echo "✅ Processo $PID encerrado"
            else
                echo "❌ Falha ao encerrar $PID"
            fi
        done
        
        # Aguardar liberação
        sleep 1
        
        # Verificar se foi liberada
        REMAINING=$(lsof -ti:$port 2>/dev/null)
        if [ -z "$REMAINING" ]; then
            echo "✅ Porta $port liberada com sucesso"
        else
            echo "⚠️  Ainda há processos na porta $port"
            return 1
        fi
    else
        echo "✅ Porta $port já está livre"
    fi
}

# Liberar porta
kill_port $PORT

# Verificar se nodemon está disponível
if ! command -v nodemon &> /dev/null; then
    echo "❌ nodemon não encontrado, usando node diretamente"
    node server.js
else
    echo "🔄 Iniciando com nodemon..."
    nodemon server.js
fi