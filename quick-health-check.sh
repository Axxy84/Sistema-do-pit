#!/bin/bash

# SCRIPT DE VERIFICAÇÃO RÁPIDA - PIT STOP PIZZARIA
# Execute este script para uma verificação rápida da saúde do sistema

echo "🍕 PIT STOP PIZZARIA - VERIFICAÇÃO DE SAÚDE DO SISTEMA"
echo "======================================================"
echo ""

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variáveis de configuração
API_URL="http://localhost:3001/api"
FRONTEND_URL="http://localhost:3000"

# Função para verificar status
check_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ $2${NC}"
        return 0
    else
        echo -e "${RED}✗ $2${NC}"
        return 1
    fi
}

# 1. Verificar se o backend está rodando
echo "1. VERIFICANDO BACKEND..."
curl -s -o /dev/null -w "%{http_code}" "$API_URL/health" | grep -q "200"
check_status $? "Backend está respondendo"

# 2. Verificar se o frontend está rodando
echo ""
echo "2. VERIFICANDO FRONTEND..."
curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL" | grep -q "200"
check_status $? "Frontend está respondendo"

# 3. Verificar conectividade com banco de dados
echo ""
echo "3. VERIFICANDO BANCO DE DADOS..."
RESPONSE=$(curl -s "$API_URL/health/db" 2>/dev/null)
if [[ $RESPONSE == *"ok"* ]]; then
    check_status 0 "Conexão com banco de dados OK"
else
    check_status 1 "Problema na conexão com banco de dados"
fi

# 4. Verificar rotas principais
echo ""
echo "4. VERIFICANDO ROTAS PRINCIPAIS..."

# Dashboard (rota pública)
curl -s -o /dev/null -w "%{http_code}" "$API_URL/dashboard" | grep -q "200"
check_status $? "Rota /dashboard acessível"

# 5. Verificar autenticação
echo ""
echo "5. VERIFICANDO AUTENTICAÇÃO..."

# Tentar acessar rota protegida sem token
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/orders")
if [ "$HTTP_CODE" = "401" ]; then
    check_status 0 "Rotas protegidas exigem autenticação"
else
    check_status 1 "Problema com proteção de rotas (código: $HTTP_CODE)"
fi

# 6. Verificar variáveis de ambiente
echo ""
echo "6. VERIFICANDO CONFIGURAÇÃO..."
if [ -f "backend/.env" ]; then
    check_status 0 "Arquivo .env encontrado"
    
    # Verificar variáveis essenciais
    if grep -q "JWT_SECRET" backend/.env; then
        check_status 0 "JWT_SECRET configurado"
    else
        check_status 1 "JWT_SECRET não encontrado"
    fi
else
    check_status 1 "Arquivo .env não encontrado"
fi

# 7. Verificar logs de erro
echo ""
echo "7. VERIFICANDO LOGS..."
if [ -f "backend/logs/error.log" ]; then
    ERROR_COUNT=$(tail -n 100 backend/logs/error.log | grep -c "ERROR")
    if [ $ERROR_COUNT -gt 0 ]; then
        echo -e "${YELLOW}⚠ $ERROR_COUNT erros encontrados nos últimos 100 logs${NC}"
    else
        check_status 0 "Sem erros recentes nos logs"
    fi
else
    echo -e "${YELLOW}⚠ Arquivo de log não encontrado${NC}"
fi

# 8. Verificar espaço em disco
echo ""
echo "8. VERIFICANDO RECURSOS DO SISTEMA..."
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -lt 90 ]; then
    check_status 0 "Espaço em disco adequado ($DISK_USAGE% usado)"
else
    check_status 1 "Espaço em disco crítico ($DISK_USAGE% usado)"
fi

# 9. Verificar processos
echo ""
echo "9. VERIFICANDO PROCESSOS..."
if pgrep -f "node.*backend" > /dev/null; then
    check_status 0 "Processo do backend rodando"
else
    check_status 1 "Processo do backend não encontrado"
fi

# 10. Teste de criação de pedido (simulado)
echo ""
echo "10. TESTE RÁPIDO DE FUNCIONALIDADE..."
# Este teste requer token válido - ajustar conforme necessário
echo -e "${YELLOW}⚠ Teste de criação de pedido requer autenticação válida${NC}"

# Resumo final
echo ""
echo "======================================================"
echo "RESUMO DA VERIFICAÇÃO:"
echo "======================================================"

# Contar sucessos e falhas
TOTAL_CHECKS=10
PASSED_CHECKS=$(grep -c "✓" /tmp/health_check_$$.log 2>/dev/null || echo "0")
FAILED_CHECKS=$((TOTAL_CHECKS - PASSED_CHECKS))

if [ $FAILED_CHECKS -eq 0 ]; then
    echo -e "${GREEN}✅ SISTEMA SAUDÁVEL - Todos os testes passaram!${NC}"
    exit 0
else
    echo -e "${RED}❌ PROBLEMAS DETECTADOS - $FAILED_CHECKS testes falharam${NC}"
    echo ""
    echo "Ações recomendadas:"
    echo "1. Verificar logs de erro"
    echo "2. Confirmar configuração do JWT"
    echo "3. Testar manualmente a autenticação"
    exit 1
fi 