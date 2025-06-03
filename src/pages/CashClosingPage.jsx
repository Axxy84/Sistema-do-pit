import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, Printer, Calendar, Filter, FileText, Loader2, History, Car, Store, TrendingUp, BarChart3, Zap, Clock, CheckCircle, Split, ShoppingCart, UtensilsCrossed, Users, Truck } from 'lucide-react';
import CashFlowSummary from '@/components/cash-closing/CashFlowSummary';
import TransactionsManager from '@/components/cash-closing/TransactionsManager';
import ClosingsHistory from '@/components/cash-closing/ClosingsHistory';
import SalesByPaymentMethod from '@/components/cash-closing/SalesByPaymentMethod';
import CashClosingHeader from '@/components/cash-closing/layout/CashClosingHeader';
import CashClosingActions from '@/components/cash-closing/layout/CashClosingActions';
import SeparateClosingHistory from '@/components/SeparateClosingHistory';
import { formatCurrency } from '@/lib/utils';
import { PAYMENT_METHODS } from '@/lib/constants';
import { cashClosingService } from '@/services/cashClosingService';
import { expenseService } from '@/services/expenseService';
import { orderService } from '@/services/orderService';
import { apiClient } from '@/lib/apiClient';
import { dashboardService } from '@/services/dashboardService';

// Novo componente para análise por tipo
const OrderTypeAnalysis = ({ detailsByType }) => {
  if (!detailsByType || detailsByType.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center">Nenhum dado por tipo disponível</p>
        </CardContent>
      </Card>
    );
  }

  const totalPedidos = detailsByType.reduce((sum, detail) => sum + detail.total_pedidos, 0);
  const totalVendas = detailsByType.reduce((sum, detail) => sum + detail.vendas_brutas, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {detailsByType.map((detail) => {
          const icon = detail.tipo_pedido === 'delivery' ? Car : Store;
          const IconComponent = icon;
          const percentage = totalVendas > 0 ? ((detail.vendas_brutas / totalVendas) * 100).toFixed(1) : 0;
          
          return (
            <Card key={detail.tipo_pedido} className="border-l-4" style={{ borderLeftColor: detail.tipo_pedido === 'delivery' ? '#10b981' : '#3b82f6' }}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IconComponent className="h-5 w-5" />
                    {detail.tipo_pedido === 'delivery' ? 'Delivery' : 'Mesa'}
                  </CardTitle>
                  <Badge variant="secondary">{percentage}%</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Pedidos</p>
                    <p className="text-2xl font-bold">{detail.total_pedidos}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Vendas</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(detail.vendas_brutas)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Ticket Médio</p>
                    <p className="text-lg font-semibold">{formatCurrency(detail.ticket_medio)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Descontos</p>
                    <p className="text-lg font-semibold text-orange-600">{formatCurrency(detail.descontos_totais)}</p>
                  </div>
                </div>
                
                {detail.tipo_pedido === 'delivery' && detail.total_taxas_entrega > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-muted-foreground text-sm">Taxa de Entrega</p>
                    <p className="text-lg font-semibold text-blue-600">{formatCurrency(detail.total_taxas_entrega)}</p>
                  </div>
                )}

                <div className="pt-2 border-t">
                  <p className="text-muted-foreground text-sm mb-2">Formas de Pagamento:</p>
                  <div className="space-y-1">
                    {detail.vendas_dinheiro > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Dinheiro:</span>
                        <span>{formatCurrency(detail.vendas_dinheiro)} ({detail.pedidos_dinheiro})</span>
                      </div>
                    )}
                    {detail.vendas_cartao > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Cartão:</span>
                        <span>{formatCurrency(detail.vendas_cartao)} ({detail.pedidos_cartao})</span>
                      </div>
                    )}
                    {detail.vendas_pix > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>PIX:</span>
                        <span>{formatCurrency(detail.vendas_pix)} ({detail.pedidos_pix})</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

// Função atualizada para usar a nova API
const fetchCurrentDayData = async () => {
  try {
    const data = await cashClosingService.getCurrentDayData();
    return data;
  } catch (error) {
    console.error('[CashClosing] Erro ao buscar dados atuais:', error);
    throw error;
  }
};

// Função legacy mantida para compatibilidade com outros componentes
const fetchDailyOrdersAndTransactions = async (dateString) => {
  try {
    console.log('[DEBUG] Buscando pedidos para data:', dateString);
    
    const ordersData = await orderService.getAllOrders({
      data_inicio: dateString,
      data_fim: dateString,
      status: 'entregue'
    });
    
    console.log('[DEBUG] Pedidos encontrados:', ordersData?.length || 0);

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
  const totalDeliveryFees = orders.reduce((sum, order) => sum + (parseFloat(order.taxa_entrega) || 0), 0);

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

// Novo componente para fechamento separado integrado
const SeparateClosingComponent = ({ selectedDate }) => {
  const [activeTab, setActiveTab] = useState('delivery');
  const [loading, setLoading] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const { toast } = useToast();

  const tabs = [
    { 
      value: 'delivery', 
      label: 'Delivery', 
      icon: Car,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950'
    },
    { 
      value: 'mesa', 
      label: 'Mesa', 
      icon: Store,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950'
    },
    { 
      value: 'history', 
      label: 'Histórico', 
      icon: History,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950'
    }
  ];

  useEffect(() => {
    if (selectedDate && activeTab !== 'history') {
      fetchSummaryData(selectedDate);
    }
  }, [selectedDate, activeTab]);

  const fetchSummaryData = async (date) => {
    try {
      setLoading(true);
      
      const response = await apiClient.get(
        `/cash-closing/separate/summary/${date}`
      );
      
      setSummaryData(response);
    } catch (error) {
      console.error('Erro ao buscar resumo:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados do resumo separado',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getCurrentData = () => {
    if (!summaryData || activeTab === 'history') return null;
    return summaryData[activeTab];
  };

  const data = getCurrentData();

  const SeparateClosingContent = ({ type, data, typeInfo }) => {
    const [isClosed, setIsClosed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSave = async () => {
      if (!data) return;
      
      setIsLoading(true);
      try {
        const closingData = {
          tipo_fechamento: type,
          data_fechamento: selectedDate,
          total_pedidos: data.total_pedidos,
          total_vendas: data.vendas_brutas,
          total_despesas_extras: data.total_despesas,
          total_receitas_extras: data.receitas_extras,
          total_descontos: data.descontos_totais,
          total_taxas_entrega: data.total_taxas_entrega || 0,
          saldo_final: data.saldo_final,
          observacoes: `Fechamento ${type} do dia ${new Date(selectedDate+'T00:00:00').toLocaleDateString()}`,
          vendas_por_metodo: {
            dinheiro: data.vendas_dinheiro,
            cartao: data.vendas_cartao,
            pix: data.vendas_pix
          }
        };

        await apiClient.post('/cash-closing/separate/close', closingData);
        
        toast({
          title: 'Fechamento Salvo!',
          description: `Fechamento de ${type} realizado com sucesso.`
        });
        
        setIsClosed(true);
      } catch (error) {
        toast({
          title: 'Erro',
          description: error.response?.data?.error || 'Erro ao salvar fechamento',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (!data) {
      return (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">Nenhum dado disponível para {type}</p>
          </CardContent>
        </Card>
      );
    }

    const Icon = typeInfo.icon;

    return (
      <div className="space-y-4">
        <Card className={`border-l-4 ${typeInfo.bgColor}`} style={{ borderLeftColor: typeInfo.color }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon className="h-5 w-5" />
              Fechamento {typeInfo.label}
            </CardTitle>
            <CardDescription>
              Resumo das vendas de {type} para {new Date(selectedDate+'T00:00:00').toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Pedidos</p>
                <p className="text-2xl font-bold">{data.total_pedidos}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Vendas Brutas</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(data.vendas_brutas)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Vendas Líquidas</p>
                <p className="text-lg font-semibold">{formatCurrency(data.vendas_liquidas)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Saldo Final</p>
                <p className="text-lg font-semibold text-blue-600">{formatCurrency(data.saldo_final)}</p>
              </div>
            </div>
            
            {type === 'delivery' && data.total_taxas_entrega > 0 && (
              <div className="pt-2 border-t">
                <p className="text-muted-foreground text-sm">Taxa de Entrega</p>
                <p className="text-lg font-semibold text-blue-600">{formatCurrency(data.total_taxas_entrega)}</p>
              </div>
            )}

            <div className="pt-2 border-t">
              <p className="text-muted-foreground text-sm mb-2">Formas de Pagamento:</p>
              <div className="grid grid-cols-3 gap-2 text-sm">
                {data.vendas_dinheiro > 0 && (
                  <div className="text-center p-2 bg-muted/50 rounded">
                    <p className="font-semibold">Dinheiro</p>
                    <p>{formatCurrency(data.vendas_dinheiro)}</p>
                    <p className="text-xs text-muted-foreground">({data.pedidos_dinheiro})</p>
                  </div>
                )}
                {data.vendas_cartao > 0 && (
                  <div className="text-center p-2 bg-muted/50 rounded">
                    <p className="font-semibold">Cartão</p>
                    <p>{formatCurrency(data.vendas_cartao)}</p>
                    <p className="text-xs text-muted-foreground">({data.pedidos_cartao})</p>
                  </div>
                )}
                {data.vendas_pix > 0 && (
                  <div className="text-center p-2 bg-muted/50 rounded">
                    <p className="font-semibold">PIX</p>
                    <p>{formatCurrency(data.vendas_pix)}</p>
                    <p className="text-xs text-muted-foreground">({data.pedidos_pix})</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleSave}
              disabled={isLoading || isClosed}
              className="w-full"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isClosed ? 'Fechamento Salvo' : `Fechar Caixa ${typeInfo.label}`}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  };

  if (loading && !summaryData) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Carregando dados do fechamento separado...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Split className="h-6 w-6" />
            Fechamento Separado
          </h2>
          <p className="text-muted-foreground">
            Gerencie os fechamentos de caixa separadamente para delivery e mesa
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger 
                key={tab.value} 
                value={tab.value}
                className="flex items-center gap-2"
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="delivery" className="space-y-6">
          <SeparateClosingContent 
            type="delivery" 
            data={data} 
            typeInfo={tabs[0]}
          />
        </TabsContent>

        <TabsContent value="mesa" className="space-y-6">
          <SeparateClosingContent 
            type="mesa" 
            data={data} 
            typeInfo={tabs[1]}
          />
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <SeparateClosingHistory selectedDate={selectedDate} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const CashClosingPage = () => {
  const { mode } = useParams(); // Capturar o parâmetro mode da URL
  const [currentDayData, setCurrentDayData] = useState(null);
  const [dailyData, setDailyData] = useState({ orders: [], transactions: [] });
  const [cashClosings, setCashClosings] = useState([]);
  const [observacoes, setObservacoes] = useState('');

  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [showHistory, setShowHistory] = useState(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isClosingCash, setIsClosingCash] = useState(false);
  
  // Determinar aba ativa baseada no parâmetro da URL
  const [activeTab, setActiveTab] = useState(() => {
    if (mode === 'separado') return 'separate';
    return 'overview';
  });

  const { toast } = useToast();

  // Atualizar aba quando o parâmetro da URL mudar
  useEffect(() => {
    if (mode === 'separado') {
      setActiveTab('separate');
    } else {
      setActiveTab('overview');
    }
  }, [mode]);

  const fetchAndSetCurrentData = useCallback(async () => {
    setIsLoadingSummary(true);
    try {
      const data = await fetchCurrentDayData();
      setCurrentDayData(data);
      
      // Se for o dia atual, usar dados novos; senão usar sistema legacy
      if (filterDate === new Date().toISOString().split('T')[0]) {
        // Dados atuais do backend atualizado
        return;
      }
    } catch (error) {
      toast({ title: 'Erro ao buscar dados atuais', description: error.message, variant: 'destructive' });
      setCurrentDayData(null);
    } finally {
      setIsLoadingSummary(false);
    }
  }, [toast, filterDate]);

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
            totalOrdersCount: d.total_pedidos_dia || d.total_pedidos || 0, 
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
    const today = new Date().toISOString().split('T')[0];
    if (filterDate === today) {
      fetchAndSetCurrentData();
    } else {
      fetchAndSetDailyData(filterDate);
    }
  }, [filterDate, fetchAndSetCurrentData, fetchAndSetDailyData]);

  useEffect(() => {
    if (showHistory) {
        fetchClosingsHistory();
    }
  }, [showHistory, fetchClosingsHistory]);

  const dailySummary = useMemo(() => {
    return calculateDailySummary(dailyData.orders, dailyData.transactions);
  }, [dailyData]);

  const isToday = filterDate === new Date().toISOString().split('T')[0];
  const displayData = isToday && currentDayData ? currentDayData : null;
  
  const handleCloseCash = async () => {
    setIsClosingCash(true);
    try {
        if (displayData?.already_closed) {
            toast({ title: 'Atenção', description: `O caixa para o dia ${new Date(filterDate+'T00:00:00').toLocaleDateString()} já foi fechado.`, variant: 'destructive' });
            setIsClosingCash(false);
            return;
        }

        // Usar fechamento automático integrado
        const closingData = {
            auto_generate: true,
            observacoes: observacoes || `Fechamento automático do dia ${new Date(filterDate+'T00:00:00').toLocaleDateString()}`
        };

        const newClosing = await cashClosingService.createCashClosing(closingData);
        
        toast({ 
            title: 'Caixa Fechado! 🎉', 
            description: `Fechamento automático do dia ${new Date(filterDate+'T00:00:00').toLocaleDateString()} realizado com sucesso.`
        });
        
        if (showHistory) fetchClosingsHistory(); 
        
        // Atualizar dados atuais
        await fetchAndSetCurrentData();
        
        // Limpar observações
        setObservacoes('');
        
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

  const [dashboardData, setDashboardData] = useState(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);

  const fetchDashboardData = async (dataInicio = null, dataFim = null) => {
    try {
      setIsLoadingDashboard(true);
      const data = await dashboardService.getFechamentoConsolidado(
        dataInicio || filterDate, 
        dataFim || filterDate
      );
      setDashboardData(data);
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados do dashboard',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingDashboard(false);
    }
  };

  // Atualizar dados do dashboard quando a data mudar
  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchDashboardData();
    }
  }, [filterDate, activeTab]);

  // Dashboard Component
  const DashboardContent = () => {
    if (isLoadingDashboard) {
      return (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Carregando dados do dashboard...</span>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (!dashboardData) {
      return (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              Nenhum dado disponível para o período selecionado
            </div>
          </CardContent>
        </Card>
      );
    }

    const { vendas_por_tipo, mesas_abertas, totais_gerais, top_produtos } = dashboardData;

    return (
      <div className="space-y-6">
        {/* Resumo Geral */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Pedidos</p>
                  <p className="text-2xl font-bold">{totais_gerais.total_pedidos}</p>
                </div>
                <ShoppingCart className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Vendas Brutas</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(totais_gerais.vendas_brutas)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Mesas Abertas</p>
                  <p className="text-2xl font-bold text-orange-600">{totais_gerais.mesas_abertas}</p>
                </div>
                <UtensilsCrossed className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Valor Pendente</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {formatCurrency(totais_gerais.valor_pendente_mesas)}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Comparação Mesa vs Delivery */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Mesa */}
          {vendas_por_tipo.mesa && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UtensilsCrossed className="h-5 w-5 text-green-600" />
                  Mesa - Consumo Local
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Pedidos</p>
                    <p className="text-xl font-semibold">{vendas_por_tipo.mesa.total_pedidos}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Vendas</p>
                    <p className="text-xl font-semibold text-green-600">
                      {formatCurrency(vendas_por_tipo.mesa.vendas_liquidas)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ticket Médio</p>
                    <p className="text-lg font-medium">
                      {formatCurrency(vendas_por_tipo.mesa.ticket_medio)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Descontos</p>
                    <p className="text-lg font-medium text-red-600">
                      {formatCurrency(vendas_por_tipo.mesa.descontos_totais)}
                    </p>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Formas de Pagamento:</p>
                  <div className="space-y-2">
                    {vendas_por_tipo.mesa.formas_pagamento.dinheiro.valor > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>💵 Dinheiro ({vendas_por_tipo.mesa.formas_pagamento.dinheiro.pedidos})</span>
                        <span>{formatCurrency(vendas_por_tipo.mesa.formas_pagamento.dinheiro.valor)}</span>
                      </div>
                    )}
                    {vendas_por_tipo.mesa.formas_pagamento.cartao.valor > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>💳 Cartão ({vendas_por_tipo.mesa.formas_pagamento.cartao.pedidos})</span>
                        <span>{formatCurrency(vendas_por_tipo.mesa.formas_pagamento.cartao.valor)}</span>
                      </div>
                    )}
                    {vendas_por_tipo.mesa.formas_pagamento.pix.valor > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>📱 PIX ({vendas_por_tipo.mesa.formas_pagamento.pix.pedidos})</span>
                        <span>{formatCurrency(vendas_por_tipo.mesa.formas_pagamento.pix.valor)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Delivery */}
          {vendas_por_tipo.delivery && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-blue-600" />
                  Delivery - Entrega
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Pedidos</p>
                    <p className="text-xl font-semibold">{vendas_por_tipo.delivery.total_pedidos}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Vendas</p>
                    <p className="text-xl font-semibold text-blue-600">
                      {formatCurrency(vendas_por_tipo.delivery.vendas_liquidas)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ticket Médio</p>
                    <p className="text-lg font-medium">
                      {formatCurrency(vendas_por_tipo.delivery.ticket_medio)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Taxa Entrega</p>
                    <p className="text-lg font-medium text-blue-600">
                      {formatCurrency(vendas_por_tipo.delivery.total_taxas_entrega)}
                    </p>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Formas de Pagamento:</p>
                  <div className="space-y-2">
                    {vendas_por_tipo.delivery.formas_pagamento.dinheiro.valor > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>💵 Dinheiro ({vendas_por_tipo.delivery.formas_pagamento.dinheiro.pedidos})</span>
                        <span>{formatCurrency(vendas_por_tipo.delivery.formas_pagamento.dinheiro.valor)}</span>
                      </div>
                    )}
                    {vendas_por_tipo.delivery.formas_pagamento.cartao.valor > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>💳 Cartão ({vendas_por_tipo.delivery.formas_pagamento.cartao.pedidos})</span>
                        <span>{formatCurrency(vendas_por_tipo.delivery.formas_pagamento.cartao.valor)}</span>
                      </div>
                    )}
                    {vendas_por_tipo.delivery.formas_pagamento.pix.valor > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>📱 PIX ({vendas_por_tipo.delivery.formas_pagamento.pix.pedidos})</span>
                        <span>{formatCurrency(vendas_por_tipo.delivery.formas_pagamento.pix.valor)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Mesas Abertas e Top Produtos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Mesas Abertas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Mesas Abertas ({mesas_abertas.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {mesas_abertas.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  Todas as mesas estão fechadas
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {mesas_abertas.map((mesa, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <span className="font-medium">Mesa #{mesa.numero_mesa}</span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          ({mesa.status_pedido})
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-green-600">
                          {formatCurrency(mesa.valor_pendente)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {mesa.pedidos_pendentes} pedido(s)
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Produtos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Top Produtos do Período
              </CardTitle>
            </CardHeader>
            <CardContent>
              {top_produtos.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  Nenhum produto vendido no período
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {top_produtos.slice(0, 10).map((produto, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex-1">
                        <span className="font-medium text-sm">{produto.produto_nome}</span>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{produto.quantidade_vendida} vendas</span>
                          <Badge variant={produto.tipo_pedido === 'mesa' ? 'default' : 'secondary'} className="text-xs">
                            {produto.tipo_pedido}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-green-600 text-sm">
                          {formatCurrency(produto.receita_total)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <motion.div 
      className="space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <CashClosingHeader />

      {/* Sistema de abas principal */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Resumo Geral
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Dashboard de Fechamento
          </TabsTrigger>
          <TabsTrigger value="mesa-vs-delivery" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Mesa vs Delivery
          </TabsTrigger>
          <TabsTrigger value="fechamento" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Fechamento
          </TabsTrigger>
          <TabsTrigger value="separado" className="flex items-center gap-2">
            <Split className="h-4 w-4" />
            Fechamento Separado
          </TabsTrigger>
        </TabsList>

        {/* Aba de Resumo Geral */}
        <TabsContent value="overview" className="space-y-6">
          <Card className="shadow-xl bg-card/80 backdrop-blur-sm">
            <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <CardTitle className="text-xl text-primary flex items-center">
                  <Calendar className="mr-2"/> 
                  {isToday ? 'Fechamento de Caixa Integrado' : 'Resumo do Dia'}
                </CardTitle>
                <CardDescription>
                  {isToday 
                    ? 'Análise completa com fechamento automático do dia atual' 
                    : 'Selecione a data para ver o resumo financeiro.'
                  }
                </CardDescription>
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
                  {/* Mostrar dados atuais se for hoje */}
                  {isToday && displayData ? (
                    <div className="space-y-6">
                      {displayData.already_closed && (
                        <Badge variant="destructive" className="mb-4">
                          <Clock className="h-4 w-4 mr-1" />
                          Caixa já fechado para este dia
                        </Badge>
                      )}
                      
                      <CashFlowSummary summary={{
                        totalSales: displayData.cash_closing.vendas_brutas,
                        totalOrdersCount: displayData.cash_closing.total_pedidos,
                        totalExpenses: displayData.cash_closing.total_despesas,
                        totalExtraRevenues: displayData.cash_closing.receitas_extras,
                        totalDiscounts: displayData.cash_closing.descontos_totais,
                        totalTaxes: 0,
                        totalDeliveryFees: displayData.cash_closing.details_by_type?.reduce((sum, d) => sum + (d.total_taxas_entrega || 0), 0) || 0,
                        netRevenue: displayData.cash_closing.saldo_final,
                        salesByPaymentMethod: {
                          dinheiro: { name: 'Dinheiro', total: displayData.cash_closing.vendas_dinheiro, count: displayData.cash_closing.pedidos_dinheiro },
                          cartao: { name: 'Cartão', total: displayData.cash_closing.vendas_cartao, count: displayData.cash_closing.pedidos_cartao },
                          pix: { name: 'PIX', total: displayData.cash_closing.vendas_pix, count: displayData.cash_closing.pedidos_pix }
                        }
                      }} />
                    </div>
                  ) : (
                    // Dados legacy para datas anteriores
                    <>
                      <CashFlowSummary summary={dailySummary} />
                      <SalesByPaymentMethod salesByPaymentMethod={dailySummary.salesByPaymentMethod} totalOrdersCount={dailySummary.totalOrdersCount} />
                    </>
                  )}
                </>
              )}
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row justify-end gap-2 pt-6 border-t">
                <Button variant="outline" onClick={() => handlePrintReport(null)} disabled={isLoadingSummary || isClosingCash}>
                    <FileText className="mr-2 h-4 w-4"/> Gerar Relatório do Dia
                </Button>
                {isToday && displayData && !displayData.already_closed && (
                  <Button onClick={handleCloseCash} className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white" disabled={isLoadingSummary || isClosingCash}>
                      {isClosingCash ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4"/>}
                      Fechar Caixa Automaticamente
                  </Button>
                )}
                {!isToday && (
                  <Button onClick={handleCloseCash} className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white" disabled={isLoadingSummary || isClosingCash}>
                      {isClosingCash ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <DollarSign className="mr-2 h-4 w-4"/>}
                      Fechar Caixa do Dia
                  </Button>
                )}
            </CardFooter>
          </Card>

          <TransactionsManager 
            initialTransactions={dailyData.transactions} 
            fetchDailyDataForGivenDate={fetchAndSetDailyData}
            filterDate={filterDate} 
          />
        </TabsContent>

        {/* Aba de Mesa vs Delivery */}
        <TabsContent value="mesa-vs-delivery" className="space-y-6">
          <Card className="shadow-xl bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl text-primary flex items-center">
                <BarChart3 className="mr-2"/> 
                Análise por Tipo de Pedido
              </CardTitle>
              <CardDescription>
                Comparação detalhada entre vendas de mesa e delivery
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {isToday && displayData ? (
                <OrderTypeAnalysis detailsByType={displayData.cash_closing.details_by_type} />
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Análise por tipo disponível apenas para o dia atual</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de Fechamento */}
        <TabsContent value="fechamento" className="space-y-6">
          <Card className="shadow-xl bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl text-primary flex items-center">
                <Zap className="mr-2"/> 
                Fechamento de Caixa
              </CardTitle>
              <CardDescription>
                Finalize o fechamento do caixa do dia
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {isToday && displayData ? (
                <>
                  {!displayData.already_closed ? (
                    <Card className="border-green-200 bg-green-50/50">
                      <CardHeader>
                        <CardTitle className="text-green-800 flex items-center gap-2">
                          <Zap className="h-5 w-5" />
                          Fechamento Automático Integrado
                        </CardTitle>
                        <CardDescription className="text-green-700">
                          Todos os dados foram calculados automaticamente. Clique em "Fechar Caixa" para finalizar o dia.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">Observações (opcional)</label>
                          <Textarea
                            placeholder="Adicione observações sobre o fechamento do dia..."
                            value={observacoes}
                            onChange={(e) => setObservacoes(e.target.value)}
                            className="mt-1"
                            disabled={isClosingCash}
                          />
                        </div>
                        
                        <div className="bg-white p-4 rounded-lg border">
                          <h4 className="font-semibold mb-2">Resumo do Fechamento:</h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Total de Pedidos:</span>
                              <span className="ml-2 font-medium">{displayData.cash_closing.total_pedidos}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Vendas Brutas:</span>
                              <span className="ml-2 font-medium text-green-600">{formatCurrency(displayData.cash_closing.vendas_brutas)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Total Despesas:</span>
                              <span className="ml-2 font-medium text-red-600">{formatCurrency(displayData.cash_closing.total_despesas)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Saldo Final:</span>
                              <span className="ml-2 font-bold text-lg text-blue-600">{formatCurrency(displayData.cash_closing.saldo_final)}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button onClick={handleCloseCash} className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white" disabled={isLoadingSummary || isClosingCash}>
                            {isClosingCash ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4"/>}
                            Fechar Caixa Automaticamente
                        </Button>
                      </CardFooter>
                    </Card>
                  ) : (
                    <Card className="border-gray-200 bg-gray-50/50">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-gray-800">Caixa Já Fechado</h3>
                          <p className="text-gray-600">O fechamento deste dia já foi realizado.</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Fechamento de caixa disponível apenas para o dia atual</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de Fechamento Separado */}
        <TabsContent value="separado" className="space-y-6">
          <SeparateClosingComponent selectedDate={filterDate} />
        </TabsContent>

        {/* Aba de Dashboard */}
        <TabsContent value="dashboard" className="space-y-6">
          <DashboardContent />
        </TabsContent>
      </Tabs>

      {/* Histórico de Fechamentos */}
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
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
            ) : (
              <ClosingsHistory cashClosings={cashClosings} onPrintReport={handlePrintReport} />
            )}
          </CardContent>
        )}
      </Card>
    </motion.div>
  );
};

export default CashClosingPage;