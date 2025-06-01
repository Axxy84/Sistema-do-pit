import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, Printer, Calendar, Filter, FileText, Loader2, History } from 'lucide-react';
import CashFlowSummary from '@/components/cash-closing/CashFlowSummary';
import TransactionsManager from '@/components/cash-closing/TransactionsManager';
import ClosingsHistory from '@/components/cash-closing/ClosingsHistory';
import SalesByPaymentMethod from '@/components/cash-closing/SalesByPaymentMethod';
import CashClosingHeader from '@/components/cash-closing/layout/CashClosingHeader';
import CashClosingActions from '@/components/cash-closing/layout/CashClosingActions';
import { formatCurrency } from '@/lib/utils';
import { PAYMENT_METHODS } from '@/lib/constants';
import { cashClosingService } from '@/services/cashClosingService';
import { expenseService } from '@/services/expenseService';
import { orderService } from '@/services/orderService';

const fetchDailyOrdersAndTransactions = async (dateString) => {
  try {
    console.log('[DEBUG] Buscando pedidos para data:', dateString);
    
    // Buscar pedidos do dia com status 'entregue'
    const ordersData = await orderService.getAllOrders({
      data_inicio: dateString,
      data_fim: dateString,
      status: 'entregue'
    });
    
    console.log('[DEBUG] Pedidos encontrados:', ordersData?.length || 0);
    console.log('[DEBUG] Pedidos:', ordersData);

    // Buscar transações do dia
    const { data: dailyTransactionsData, error: transactionsError } = await expenseService.fetchDailyTransactions(dateString);
    
    if (transactionsError) throw transactionsError;

    return { orders: ordersData || [], transactions: dailyTransactionsData || [] };
  } catch (error) {
    console.error('[CashClosing] Erro ao buscar dados do dia:', error);
    throw error;
  }
};

const calculateDailySummary = (orders, transactions) => {
  const totalSales = orders.reduce((sum, order) => sum + (parseFloat(order.total) || 0), 0);
  const totalOrdersCount = orders.length;
  
  const totalExpenses = transactions
    .filter(t => t.tipo === 'despesa')
    .reduce((sum, t) => sum + (parseFloat(t.valor) || 0), 0);
  const totalExtraRevenues = transactions
    .filter(t => t.tipo === 'receita')
    .reduce((sum, t) => sum + (parseFloat(t.valor) || 0), 0);
  
  const totalCouponDiscounts = orders.reduce((sum, order) => sum + (parseFloat(order.desconto_aplicado) || 0), 0);
  const totalPointsDiscounts = orders.reduce((sum, order) => sum + ((order.pontos_resgatados || 0) * 0.5), 0);
  const totalDiscounts = totalCouponDiscounts + totalPointsDiscounts;

  const totalTaxes = 0; // Placeholder, not implemented
  const totalDeliveryFees = 0; // Placeholder, depends on how delivery fees are stored/calculated

  const netRevenue = totalSales + totalExtraRevenues - totalExpenses;

  // Inicializar contadores para métodos de pagamento
  const salesByPaymentMethod = PAYMENT_METHODS.reduce((acc, pm) => {
      acc[pm.id] = { name: pm.name, total: 0, count: 0 };
      return acc;
  }, {});

  // Processar pedidos para agrupar por forma de pagamento
  orders.forEach(order => {
    const paymentMethod = order.forma_pagamento;
    const orderTotal = parseFloat(order.total) || 0;
    
    if (salesByPaymentMethod[paymentMethod]) {
      salesByPaymentMethod[paymentMethod].total += orderTotal;
      salesByPaymentMethod[paymentMethod].count += 1;
    } else {
      // Se o método de pagamento não existe na lista, criar
      salesByPaymentMethod[paymentMethod] = {
        name: paymentMethod,
        total: orderTotal,
        count: 1
      };
    }
  });

  return {
    totalSales,
    totalOrdersCount,
    totalExpenses,
    totalExtraRevenues,
    totalDiscounts,
    totalTaxes,
    totalDeliveryFees,
    netRevenue,
    salesByPaymentMethod
  };
};


const CashClosingPage = () => {
  const [dailyData, setDailyData] = useState({ orders: [], transactions: [] });
  const [cashClosings, setCashClosings] = useState([]);

  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [showHistory, setShowHistory] = useState(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isClosingCash, setIsClosingCash] = useState(false);

  const { toast } = useToast();

  const fetchAndSetDailyData = useCallback(async (dateString) => {
    setIsLoadingSummary(true);
    try {
      const { orders, transactions } = await fetchDailyOrdersAndTransactions(dateString);
      setDailyData({ orders, transactions });
    } catch (error) {
      toast({ title: 'Erro ao buscar dados do dia', description: error.message, variant: 'destructive' });
      setDailyData({ orders: [], transactions: [] });
    } finally {
      setIsLoadingSummary(false);
    }
  }, [toast]);

  const fetchClosingsHistory = useCallback(async () => {
    if (!showHistory) return;
    setIsLoadingHistory(true);
    try {
        const data = await cashClosingService.getAllCashClosings();
        
        const formattedClosings = data.map(d => ({
            id: d.id,
            date: d.data_fechamento,
            closedAt: d.created_at,
            totalSales: d.total_vendas,
            totalExpenses: d.total_despesas_extras,
            totalExtraRevenues: d.total_receitas_extras,
            netRevenue: d.saldo_final,
            totalDiscounts: d.total_descontos,
            totalTaxes: d.total_impostos, 
            totalDeliveryFees: d.total_taxas_entrega, 
            totalOrdersCount: d.total_pedidos_dia || 0, 
            salesByPaymentMethod: d.vendas_por_metodo || {} 
        }));
        setCashClosings(formattedClosings);
    } catch (error) {
        toast({ title: "Erro ao buscar histórico", description: error.message, variant: "destructive" });
        setCashClosings([]);
    } finally {
        setIsLoadingHistory(false);
    }
  }, [toast, showHistory]);

  useEffect(() => {
    fetchAndSetDailyData(filterDate);
  }, [filterDate, fetchAndSetDailyData]);

  useEffect(() => {
    if (showHistory) {
        fetchClosingsHistory();
    }
  }, [showHistory, fetchClosingsHistory]);


  const dailySummary = useMemo(() => {
    return calculateDailySummary(dailyData.orders, dailyData.transactions);
  }, [dailyData]);
  
  const handleCloseCash = async () => {
    setIsClosingCash(true);
    try {
        // Verificar se já foi fechado
        const existingClosings = await cashClosingService.getAllCashClosings();
        const closingForDate = existingClosings.find(c => c.data_fechamento === filterDate);
        
        if (closingForDate) {
            toast({ title: 'Atenção', description: `O caixa para o dia ${new Date(filterDate+'T00:00:00').toLocaleDateString()} já foi fechado.`, variant: 'destructive' });
            setIsClosingCash(false);
            return;
        }
        
        const closingData = {
            data_fechamento: filterDate,
            total_vendas: dailySummary.totalSales,
            total_descontos: dailySummary.totalDiscounts,
            total_impostos: dailySummary.totalTaxes,
            total_taxas_entrega: dailySummary.totalDeliveryFees,
            total_despesas_extras: dailySummary.totalExpenses,
            total_receitas_extras: dailySummary.totalExtraRevenues,
            saldo_final: dailySummary.netRevenue,
            observacoes: `Fechamento do dia ${new Date(filterDate+'T00:00:00').toLocaleDateString()}`,
            total_pedidos_dia: dailySummary.totalOrdersCount,
            vendas_por_metodo: dailySummary.salesByPaymentMethod,
        };

        const newClosing = await cashClosingService.createCashClosing(closingData);
        
        toast({ title: 'Caixa Fechado!', description: `Fechamento do dia ${new Date(filterDate+'T00:00:00').toLocaleDateString()} realizado e salvo.` });
        if (showHistory) fetchClosingsHistory(); 
        
        // Dispatch custom event to notify other components (like Dashboard)
        const event = new CustomEvent('cashClosed', { detail: newClosing });
        window.dispatchEvent(event);
    } catch (error) {
        toast({ title: 'Erro ao fechar caixa', description: error.message, variant: 'destructive' });
    } finally {
        setIsClosingCash(false);
    }
  };

  const handlePrintReport = (closingDataInput) => {
    const isCurrentDayReport = !closingDataInput;
    const dataToPrint = closingDataInput || { 
        date: filterDate, 
        ...dailySummary,
        closedAt: isCurrentDayReport ? null : (closingDataInput.closedAt || new Date().toISOString())
    };
    
    let paymentMethodsSummaryText = '';
    const salesByPaymentMethodToPrint = dataToPrint.salesByPaymentMethod || {};

    paymentMethodsSummaryText = Object.values(salesByPaymentMethodToPrint)
        .filter(pm => pm.count > 0)
        .map(pm => `  - ${pm.name}: ${formatCurrency(pm.total)} (${pm.count} pedidos)`)
        .join('\n');
    
    const reportDate = dataToPrint.date || dataToPrint.data_fechamento;

    const reportContent = `
      PIT STOP PIZZARIA - FECHAMENTO DE CAIXA
      ------------------------------------------
      Data: ${new Date(reportDate+'T00:00:00').toLocaleDateString()}
      ${dataToPrint.closedAt ? `Fechado em: ${new Date(dataToPrint.closedAt).toLocaleString()}` : 'Status: Em Aberto (Resumo do Dia)'}
      ------------------------------------------
      TOTAL DE PEDIDOS (Entregues): ${dataToPrint.totalOrdersCount}
      ------------------------------------------
      VENDAS POR FORMA DE PAGAMENTO:
${paymentMethodsSummaryText || '  Nenhuma venda registrada por forma de pag.'}
      ------------------------------------------
      Total Geral de Vendas Brutas: ${formatCurrency(dataToPrint.totalSales + dataToPrint.totalDiscounts)}
      Total de Descontos (Cupons/Pontos): ${formatCurrency(dataToPrint.totalDiscounts)}
      Total Líquido de Vendas: ${formatCurrency(dataToPrint.totalSales)}
      Total de Impostos: ${formatCurrency(dataToPrint.totalTaxes)}
      Total de Taxas de Entrega: ${formatCurrency(dataToPrint.totalDeliveryFees)}
      Total Despesas Extras: ${formatCurrency(dataToPrint.totalExpenses)}
      Total Receitas Extras: ${formatCurrency(dataToPrint.totalExtraRevenues)}
      ------------------------------------------
      SALDO FINAL EM CAIXA: ${formatCurrency(dataToPrint.netRevenue)}
      ------------------------------------------
    `;
     const printWindow = window.open('', '_blank');
     if (printWindow) {
        printWindow.document.write('<pre>' + reportContent + '</pre>');
        printWindow.document.close();
        printWindow.print();
        toast({ title: 'Impressão', description: 'Preparando relatório para impressão.' });
     } else {
       toast({ title: 'Erro de Impressão', description: 'Não foi possível abrir a janela de impressão.', variant: 'destructive' });
     }
  };

  return (
    <motion.div 
      className="space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <CashClosingHeader />

      <Card className="shadow-xl bg-card/80 backdrop-blur-sm">
        <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <CardTitle className="text-xl text-primary flex items-center"><Calendar className="mr-2"/> Resumo do Dia</CardTitle>
            <CardDescription>Selecione a data para ver o resumo financeiro.</CardDescription>
          </div>
          <Input 
            type="date" 
            value={filterDate} 
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full md:w-auto bg-background/70"
            disabled={isLoadingSummary || isClosingCash}
          />
        </CardHeader>
        <CardContent className="pt-6">
          {isLoadingSummary ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <CashFlowSummary summary={dailySummary} />
              <SalesByPaymentMethod salesByPaymentMethod={dailySummary.salesByPaymentMethod} totalOrdersCount={dailySummary.totalOrdersCount} />
            </>
          )}
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-end gap-2 pt-6 border-t">
            <Button variant="outline" onClick={() => handlePrintReport(null)} disabled={isLoadingSummary || isClosingCash}>
                <FileText className="mr-2 h-4 w-4"/> Gerar Relatório do Dia
            </Button>
            <Button onClick={handleCloseCash} className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white" disabled={isLoadingSummary || isClosingCash}>
                {isClosingCash ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <DollarSign className="mr-2 h-4 w-4"/>}
                Fechar Caixa do Dia
            </Button>
        </CardFooter>
      </Card>

      <TransactionsManager 
        initialTransactions={dailyData.transactions} 
        fetchDailyDataForGivenDate={fetchAndSetDailyData}
        filterDate={filterDate} 
      />
      
      <Card className="shadow-xl bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-center">
            <CardTitle className="text-xl text-primary flex items-center"><History className="mr-2"/> Histórico de Fechamentos</CardTitle>
            <Button variant="outline" onClick={() => setShowHistory(!showHistory)} className="mt-4 md:mt-0">
              {showHistory ? 'Ocultar Histórico' : 'Mostrar Histórico'}
            </Button>
          </div>
          <CardDescription>Visualize os fechamentos de caixa salvos.</CardDescription>
        </CardHeader>
        {showHistory && (
          <CardContent className="pt-6">
            {isLoadingHistory ? (
                <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <ClosingsHistory cashClosings={cashClosings} onPrintReport={handlePrintReport} />
            )}
          </CardContent>
        )}
      </Card>

      <CashClosingActions />

    </motion.div>
  );
};

export default CashClosingPage;