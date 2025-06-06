#!/usr/bin/env python3
import sys
import json
import decimal
from decimal import Decimal, ROUND_HALF_UP

def calculate_profit_loss(data):
    """
    Calcula lucro ou prejuízo diário baseado nos dados financeiros.
    
    Args:
        data (dict): Dados financeiros contendo:
            - vendas_brutas: Vendas totais do dia
            - descontos: Descontos aplicados
            - impostos: Impostos sobre vendas
            - taxas_entrega: Taxas de entrega cobradas
            - receitas_extras: Outras receitas
            - despesas_extras: Despesas variáveis do dia
            - despesas_fixas: Despesas fixas (aluguel, funcionários, etc.)
    
    Returns:
        dict: {"lucro": float, "prejuizo": bool}
    """
    
    # Configurar precisão decimal para cálculos financeiros
    decimal.getcontext().prec = 10
    decimal.getcontext().rounding = ROUND_HALF_UP
    
    try:
        # Converter valores para Decimal para precisão financeira
        vendas_brutas = Decimal(str(data.get('vendas_brutas', 0)))
        descontos = Decimal(str(data.get('descontos', 0)))
        impostos = Decimal(str(data.get('impostos', 0)))
        taxas_entrega = Decimal(str(data.get('taxas_entrega', 0)))
        receitas_extras = Decimal(str(data.get('receitas_extras', 0)))
        despesas_extras = Decimal(str(data.get('despesas_extras', 0)))
        despesas_fixas = Decimal(str(data.get('despesas_fixas', 0)))
        
        # Calcular receita total
        receita_liquida = vendas_brutas - descontos - impostos
        receita_total = receita_liquida + taxas_entrega + receitas_extras
        
        # Calcular despesas totais
        despesas_totais = despesas_extras + despesas_fixas
        
        # Calcular lucro/prejuízo
        resultado = receita_total - despesas_totais
        
        # Converter para float para JSON
        lucro_float = float(resultado)
        prejuizo = lucro_float < 0
        
        return {
            "lucro": lucro_float,
            "prejuizo": prejuizo,
            "receita_total": float(receita_total),
            "despesas_totais": float(despesas_totais),
            "detalhes": {
                "vendas_brutas": float(vendas_brutas),
                "vendas_liquidas": float(receita_liquida),
                "taxas_entrega": float(taxas_entrega),
                "receitas_extras": float(receitas_extras),
                "despesas_extras": float(despesas_extras),
                "despesas_fixas": float(despesas_fixas),
                "descontos_aplicados": float(descontos),
                "impostos": float(impostos)
            }
        }
        
    except (ValueError, TypeError, decimal.InvalidOperation) as e:
        return {
            "error": f"Erro no cálculo: {str(e)}",
            "lucro": 0.0,
            "prejuizo": False
        }

def main():
    """
    Função principal que lê JSON do stdin e retorna resultado.
    """
    try:
        # Ler dados do stdin
        input_data = sys.stdin.read().strip()
        
        if not input_data:
            raise ValueError("Nenhum dado recebido")
        
        # Parse JSON
        data = json.loads(input_data)
        
        # Calcular lucro/prejuízo
        result = calculate_profit_loss(data)
        
        # Retornar resultado como JSON
        print(json.dumps(result, ensure_ascii=False))
        
    except json.JSONDecodeError as e:
        error_result = {
            "error": f"Erro ao processar JSON: {str(e)}",
            "lucro": 0.0,
            "prejuizo": False
        }
        print(json.dumps(error_result, ensure_ascii=False))
        sys.exit(1)
        
    except Exception as e:
        error_result = {
            "error": f"Erro inesperado: {str(e)}",
            "lucro": 0.0,
            "prejuizo": False
        }
        print(json.dumps(error_result, ensure_ascii=False))
        sys.exit(1)

if __name__ == "__main__":
    main()