#!/bin/bash
# Script de teste de conectividade API
# Testa todos os endpoints principais do sistema

API_BASE="http://localhost:3001/api"
FRONTEND_ORIGIN="http://localhost:5173"

echo "============================================="
echo "TESTE DE CONECTIVIDADE DA API"
echo "============================================="
echo "API Base: $API_BASE"
echo "Frontend Origin: $FRONTEND_ORIGIN"
echo ""

# Função para testar endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    echo -n "[$method] $endpoint - $description: "
    
    start_time=$(date +%s.%N)
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}\n%{time_total}" \
            -H "Origin: $FRONTEND_ORIGIN" \
            "$API_BASE$endpoint" 2>/dev/null)
    else
        response=$(curl -s -w "\n%{http_code}\n%{time_total}" \
            -X "$method" \
            -H "Content-Type: application/json" \
            -H "Origin: $FRONTEND_ORIGIN" \
            -d "$data" \
            "$API_BASE$endpoint" 2>/dev/null)
    fi
    
    # Extrair status code e tempo
    http_code=$(echo "$response" | tail -n 2 | head -n 1)
    time_total=$(echo "$response" | tail -n 1)
    response_body=$(echo "$response" | head -n -2)
    
    # Colorir output baseado no status
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "\033[32m✓ $http_code\033[0m (${time_total}s)"
    elif [ "$http_code" -ge 400 ] && [ "$http_code" -lt 500 ]; then
        echo -e "\033[33m⚠ $http_code\033[0m (${time_total}s)"
    else
        echo -e "\033[31m✗ $http_code\033[0m (${time_total}s)"
    fi
    
    # Mostrar erro se houver
    if echo "$response_body" | grep -q "error"; then
        error_msg=$(echo "$response_body" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
        echo "    Erro: $error_msg"
    fi
}

echo "1. TESTES DE AUTENTICAÇÃO"
echo "----------------------------------------"
test_endpoint "GET" "/auth/me" "" "Verificar usuário atual"
test_endpoint "POST" "/auth/signin" '{"email":"admin@pizzaria.com","password":"admin123"}' "Login admin"

echo ""
echo "2. TESTES DE DASHBOARD"
echo "----------------------------------------"
test_endpoint "GET" "/dashboard" "" "Dashboard principal"

echo ""
echo "3. TESTES DE PRODUTOS"
echo "----------------------------------------"
test_endpoint "GET" "/products" "" "Listar produtos"
test_endpoint "GET" "/pizzas" "" "Listar pizzas"

echo ""
echo "4. TESTES DE CLIENTES"
echo "----------------------------------------"
test_endpoint "GET" "/clients" "" "Listar clientes"
test_endpoint "GET" "/customers" "" "Listar customers"

echo ""
echo "5. TESTES DE PEDIDOS"
echo "----------------------------------------"
test_endpoint "GET" "/orders" "" "Listar pedidos"

echo ""
echo "6. TESTES DE CUPONS"
echo "----------------------------------------"
test_endpoint "GET" "/coupons" "" "Listar cupons"

echo ""
echo "7. TESTES DE ENTREGADORES"
echo "----------------------------------------"
test_endpoint "GET" "/deliverers" "" "Listar entregadores"

echo ""
echo "8. TESTES DE FECHAMENTO"
echo "----------------------------------------"
test_endpoint "GET" "/cash-closing" "" "Listar fechamentos"
test_endpoint "GET" "/cash-closing/current" "" "Dados do dia atual"

echo ""
echo "9. TESTES DE CONFIGURAÇÕES"
echo "----------------------------------------"
test_endpoint "GET" "/configurations" "" "Listar configurações"

echo ""
echo "10. TESTE DE CORS"
echo "----------------------------------------"
echo -n "CORS Headers: "
cors_headers=$(curl -s -I \
    -H "Origin: $FRONTEND_ORIGIN" \
    -H "Access-Control-Request-Method: GET" \
    -H "Access-Control-Request-Headers: Content-Type,Authorization" \
    -X OPTIONS \
    "$API_BASE/dashboard" 2>/dev/null | grep -i "access-control")

if [ -n "$cors_headers" ]; then
    echo -e "\033[32m✓ Configurado\033[0m"
    echo "$cors_headers" | sed 's/^/    /'
else
    echo -e "\033[31m✗ Não configurado\033[0m"
fi

echo ""
echo "============================================="
echo "RESUMO:"
echo "- Se você vê muitos 401/403: problema de autenticação"
echo "- Se você vê 500: problema no backend/banco"
echo "- Se você vê 404: endpoint não existe"
echo "- Se CORS não está configurado: frontend não consegue acessar"
echo "============================================="