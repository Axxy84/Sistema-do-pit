#!/bin/bash
# =====================================================
# SCRIPT PARA LIBERAR PORTA 3001
# =====================================================

PORT=3001
echo "🔍 Verificando processos na porta $PORT..."

# Função para matar processos na porta
kill_port_processes() {
    local port=$1
    echo "🔪 Encerrando processos na porta $port..."
    
    # Linux - usando lsof
    if command -v lsof &> /dev/null; then
        PIDS=$(lsof -ti:$port 2>/dev/null)
        if [ -n "$PIDS" ]; then
            echo "PIDs encontrados: $PIDS"
            for PID in $PIDS; do
                echo "Matando processo $PID..."
                kill -9 $PID 2>/dev/null
                if [ $? -eq 0 ]; then
                    echo "✅ Processo $PID encerrado"
                else
                    echo "❌ Falha ao encerrar processo $PID"
                fi
            done
        else
            echo "ℹ️  Nenhum processo encontrado na porta $port"
        fi
    
    # Linux alternativo - usando fuser
    elif command -v fuser &> /dev/null; then
        echo "Usando fuser para encerrar processos..."
        fuser -k $port/tcp 2>/dev/null
        if [ $? -eq 0 ]; then
            echo "✅ Processos encerrados com fuser"
        else
            echo "ℹ️  Nenhum processo encontrado com fuser"
        fi
    
    # Windows - usando netstat e taskkill
    elif command -v netstat &> /dev/null && command -v taskkill &> /dev/null; then
        echo "Detectado Windows - usando netstat..."
        PIDS=$(netstat -ano | findstr :$port | awk '{print $5}' | sort -u)
        if [ -n "$PIDS" ]; then
            for PID in $PIDS; do
                echo "Matando processo Windows $PID..."
                taskkill /PID $PID /F
            done
        else
            echo "ℹ️  Nenhum processo encontrado no Windows"
        fi
    else
        echo "❌ Ferramentas de diagnóstico não encontradas"
        return 1
    fi
    
    # Verificar se porta foi liberada
    sleep 1
    if command -v lsof &> /dev/null; then
        REMAINING=$(lsof -ti:$port 2>/dev/null)
        if [ -z "$REMAINING" ]; then
            echo "✅ Porta $port liberada com sucesso!"
            return 0
        else
            echo "⚠️  Ainda há processos na porta $port: $REMAINING"
            return 1
        fi
    fi
}

# Mostrar processos atuais
echo "📋 Processos atuais na porta $PORT:"
if command -v lsof &> /dev/null; then
    lsof -i :$PORT 2>/dev/null || echo "Nenhum processo encontrado"
elif command -v netstat &> /dev/null; then
    netstat -tlnp 2>/dev/null | grep :$PORT || echo "Nenhum processo encontrado"
fi

echo ""

# Executar limpeza
kill_port_processes $PORT

echo ""
echo "🚀 Agora você pode executar: npm run dev"