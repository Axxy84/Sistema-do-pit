import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BarChart2, AlertTriangle, Loader2, Filter, CalendarDays, RefreshCw, Printer, Car, Store, TrendingUp, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import reportService from '@/services/reportService';
import { formatCurrency } from '@/lib/utils';

// Novo componente para relatório comparativo
const ComparativeReport = ({ startDate, endDate }) => {
  const [comparativeData, setComparativeData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchComparativeData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await reportService.getComparativeReport(startDate, endDate);
      setComparativeData(data);
    } catch (error) {
      toast({ title: 'Erro ao buscar dados comparativos', description: error.message, variant: 'destructive' });
      setComparativeData(null);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate, toast]);

  useEffect(() => {
    fetchComparativeData();
  }, [fetchComparativeData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!comparativeData || !comparativeData.comparative) {
    return (
      <div className="text-center py-8">
        <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Nenhum dado comparativo encontrado para este período</p>
      </div>
    );
  }

  const { comparative, hourlyBreakdown, productPreferences } = comparativeData;

  return (
    <div className="space-y-6">
      {/* Comparativo Mesa vs Delivery */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Comparativo Mesa vs Delivery
          </CardTitle>
          <CardDescription>Análise de performance por tipo de pedido</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {comparative.map((data) => {
              const isDelivery = data.tipo_pedido === 'delivery';
              const icon = isDelivery ? Car : Store;
              const IconComponent = icon;
              const bgColor = isDelivery ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200';
              const textColor = isDelivery ? 'text-green-800' : 'text-blue-800';
              
              return (
                <Card key={data.tipo_pedido} className={`${bgColor} border-l-4`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className={`text-lg flex items-center gap-2 ${textColor}`}>
                        <IconComponent className="h-5 w-5" />
                        {isDelivery ? 'Delivery' : 'Mesa'}
                      </CardTitle>
                      <Badge variant="secondary">
                        {data.total_pedidos} pedidos
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Vendas</p>
                        <p className="text-xl font-bold text-green-600">{formatCurrency(data.total_vendas)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Ticket Médio</p>
                        <p className="text-xl font-bold">{formatCurrency(data.ticket_medio)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Clientes Únicos</p>
                        <p className="text-lg font-semibold">{data.clientes_unicos}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Descontos</p>
                        <p className="text-lg font-semibold text-orange-600">{formatCurrency(data.total_descontos)}</p>
                      </div>
                    </div>
                    
                    {isDelivery && data.total_taxas_entrega > 0 && (
                      <div className="pt-2 border-t">
                        <p className="text-sm text-muted-foreground">Taxa de Entrega Total</p>
                        <p className="text-lg font-semibold text-blue-600">{formatCurrency(data.total_taxas_entrega)}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Top Produtos por Tipo */}
      {productPreferences && productPreferences.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Produtos Mais Vendidos por Tipo</CardTitle>
            <CardDescription>Preferências de produtos entre mesa e delivery</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {['delivery', 'mesa'].map((tipo) => {
                const produtosTipo = productPreferences
                  .filter(p => p.tipo_pedido === tipo)
                  .slice(0, 5);
                
                if (produtosTipo.length === 0) return null;
                
                const isDelivery = tipo === 'delivery';
                const icon = isDelivery ? Car : Store;
                const IconComponent = icon;
                
                return (
                  <div key={tipo}>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <IconComponent className="h-4 w-4" />
                      Top 5 - {isDelivery ? 'Delivery' : 'Mesa'}
                    </h4>
                    <div className="space-y-2">
                      {produtosTipo.map((produto, index) => (
                        <div key={`${produto.produto_nome}-${produto.tipo_pedido}`} className="flex justify-between items-center p-2 rounded bg-muted/50">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                              {index + 1}
                            </Badge>
                            <span className="text-sm font-medium">{produto.produto_nome}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">{produto.quantidade_vendida} vendidos</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const ReportsPage = () => {
  const [cashClosings, setCashClosings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('fechamentos');
  const { toast } = useToast();

  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [period, setPeriod] = useState('today');

  const fetchCashClosings = useCallback(async (start, end, showToast = false) => {
    setIsLoading(true);
    try {
      const data = await reportService.getFechamentosPorPeriodo(start, end);
      setCashClosings(data || []);
      if (showToast) {
        toast({ title: 'Relatórios Atualizados', description: 'Os dados de fechamento foram recarregados.' });
      }
    } catch (error) {
      toast({ title: 'Erro ao buscar relatórios', description: error.message, variant: 'destructive' });
      setCashClosings([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (activeTab === 'fechamentos') {
      fetchCashClosings(startDate, endDate);
    }
  }, [startDate, endDate, activeTab, fetchCashClosings]);

  useEffect(() => {
    const handleCashClosedEvent = (event) => {
      toast({ title: 'Novo Fechamento!', description: `Caixa do dia ${new Date(event.detail.data_fechamento + 'T00:00:00').toLocaleDateString()} foi fechado.` });
      const newClosingDate = event.detail.data_fechamento;
      if (newClosingDate >= startDate && newClosingDate <= endDate) {
        fetchCashClosings(startDate, endDate, true);
      }
    };

    window.addEventListener('cashClosed', handleCashClosedEvent);

    return () => {
      window.removeEventListener('cashClosed', handleCashClosedEvent);
    };
  }, [startDate, endDate, fetchCashClosings, toast]);

  const handlePeriodChange = (selectedPeriod) => {
    setPeriod(selectedPeriod);
    const todayDate = new Date();
    let newStartDate = new Date();
    let newEndDate = new Date();

    switch (selectedPeriod) {
      case 'today':
        break;
      case 'this_week':
        const dayOfWeek = todayDate.getDay();
        newStartDate.setDate(todayDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)); 
        newEndDate = new Date(newStartDate);
        newEndDate.setDate(newStartDate.getDate() + 6);
        break;
      case 'last_7_days':
        newStartDate.setDate(todayDate.getDate() - 6);
        break;
      case 'this_month':
        newStartDate.setDate(1);
        newEndDate = new Date(todayDate.getFullYear(), todayDate.getMonth() + 1, 0);
        break;
      case 'last_30_days':
        newStartDate.setDate(todayDate.getDate() - 29);
        break;
      default:
        return;
    }
    setStartDate(newStartDate.toISOString().split('T')[0]);
    setEndDate(newEndDate.toISOString().split('T')[0]);
  };
  
  const handlePrintReport = (closingData) => {
    if (!closingData) return;

    let paymentMethodsSummaryText = '';
    const salesByPaymentMethodToPrint = closingData.vendas_por_metodo || {};

    paymentMethodsSummaryText = Object.values(salesByPaymentMethodToPrint)
        .filter(pm => pm.count > 0)
        .map(pm => `  - ${pm.name}: ${formatCurrency(pm.total)} (${pm.count} pedidos)`)
        .join('\n');
    
    const reportDate = closingData.data_fechamento;
    const formatSafeDate = (dateStr) => {
      if (!dateStr) return 'Data inválida';
      try {
        if (closingData.data_fechamento_formatted) {
          const date = new Date(closingData.data_fechamento_formatted + 'T00:00:00');
          return date.toLocaleDateString('pt-BR');
        }
        const date = new Date(dateStr);
        return date.toLocaleDateString('pt-BR');
      } catch (error) {
        return 'Data inválida';
      }
    };

    const reportContent = `
      PIT STOP PIZZARIA - RELATÓRIO DE FECHAMENTO DE CAIXA
      ------------------------------------------
      Data do Fechamento: ${formatSafeDate(reportDate)}
      Fechado em (Sistema): ${new Date(closingData.created_at).toLocaleString('pt-BR')}
      ------------------------------------------
      TOTAL DE PEDIDOS (Dia do Fechamento): ${closingData.total_pedidos_dia || closingData.total_pedidos || 0}
      ------------------------------------------
      VENDAS POR FORMA DE PAGAMENTO (Dia do Fechamento):
${paymentMethodsSummaryText || '  Nenhuma venda registrada por forma de pag.'}
      ------------------------------------------
      Total Geral de Vendas Brutas: ${formatCurrency( (closingData.total_vendas || 0) + (closingData.total_descontos || 0))}
      Total de Descontos (Cupons/Pontos): ${formatCurrency(closingData.total_descontos)}
      Total Líquido de Vendas: ${formatCurrency(closingData.total_vendas)}
      Total de Impostos: ${formatCurrency(closingData.total_impostos)}
      Total de Taxas de Entrega: ${formatCurrency(closingData.total_taxas_entrega)}
      Total Despesas Extras: ${formatCurrency(closingData.total_despesas_extras)}
      Total Receitas Extras: ${formatCurrency(closingData.total_receitas_extras)}
      ------------------------------------------
      SALDO FINAL EM CAIXA (Dia do Fechamento): ${formatCurrency(closingData.saldo_final)}
      ------------------------------------------
      Observações: ${closingData.observacoes || 'Nenhuma'}
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

  const totalPeriodSales = cashClosings.reduce((sum, closing) => sum + (closing.total_vendas || 0), 0);
  const totalPeriodNetRevenue = cashClosings.reduce((sum, closing) => sum + (closing.saldo_final || 0), 0);
  const totalPeriodOrders = cashClosings.reduce((sum, closing) => sum + (closing.total_pedidos_dia || closing.total_pedidos || 0), 0);

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Relatórios</h1>
          <p className="text-muted-foreground">Análise completa de fechamentos e vendas por tipo</p>
        </div>
        <Button onClick={() => activeTab === 'fechamentos' ? fetchCashClosings(startDate, endDate, true) : null} disabled={isLoading} variant="outline">
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Atualizar
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-primary">
            <Filter className="mr-2 h-5 w-5" />
            Filtros
          </CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
            <div>
              <label htmlFor="period-select" className="text-sm font-medium text-muted-foreground">Período Pré-definido</label>
              <Select value={period} onValueChange={handlePeriodChange}>
                <SelectTrigger id="period-select">
                  <SelectValue placeholder="Selecione um período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="last_7_days">Últimos 7 dias</SelectItem>
                  <SelectItem value="this_week">Esta Semana</SelectItem>
                  <SelectItem value="last_30_days">Últimos 30 dias</SelectItem>
                  <SelectItem value="this_month">Este Mês</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="start-date" className="text-sm font-medium text-muted-foreground">Data Inicial</label>
              <Input type="date" id="start-date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPeriod('custom'); }} className="w-full"/>
            </div>
            <div>
              <label htmlFor="end-date" className="text-sm font-medium text-muted-foreground">Data Final</label>
              <Input type="date" id="end-date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPeriod('custom');}} className="w-full"/>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="fechamentos" className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4" />
            Fechamentos de Caixa
          </TabsTrigger>
          <TabsTrigger value="comparativo" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Mesa vs Delivery
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="fechamentos" className="space-y-4">
          <Card className="shadow-lg">
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="w-12 h-12 text-primary animate-spin" />
                </div>
              ) : cashClosings.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <CalendarDays className="w-16 h-16 text-muted-foreground mb-4" />
                  <h2 className="text-xl font-semibold text-foreground mb-2">Nenhum fechamento encontrado</h2>
                  <p className="text-muted-foreground max-w-md">
                    Não há registros de fechamento de caixa para o período selecionado.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableCaption>Exibindo {cashClosings.length} fechamentos de caixa.</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data Fechamento</TableHead>
                      <TableHead>Total Vendas</TableHead>
                      <TableHead>Despesas Extras</TableHead>
                      <TableHead>Receitas Extras</TableHead>
                      <TableHead>Saldo Final</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cashClosings.map((closing) => {
                      const formatSafeDate = (dateStr) => {
                        if (!dateStr) return 'Data inválida';
                        try {
                          if (closing.data_fechamento_formatted) {
                            const date = new Date(closing.data_fechamento_formatted + 'T00:00:00');
                            return date.toLocaleDateString('pt-BR');
                          }
                          const date = new Date(dateStr);
                          return date.toLocaleDateString('pt-BR');
                        } catch (error) {
                          return 'Data inválida';
                        }
                      };
                      
                      return (
                        <TableRow key={closing.id}>
                          <TableCell>{formatSafeDate(closing.data_fechamento)}</TableCell>
                          <TableCell>{formatCurrency(closing.total_vendas)}</TableCell>
                          <TableCell>{formatCurrency(closing.total_despesas_extras)}</TableCell>
                          <TableCell>{formatCurrency(closing.total_receitas_extras)}</TableCell>
                          <TableCell className="font-semibold">{formatCurrency(closing.saldo_final)}</TableCell>
                          <TableCell className="text-right">
                              <Button variant="ghost" size="icon" onClick={() => handlePrintReport(closing)} className="text-sky-500 hover:text-sky-700">
                                  <Printer className="h-4 w-4"/>
                              </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
            {cashClosings.length > 0 && (
                <CardFooter className="border-t pt-4 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                        <div className="p-3 bg-muted/50 rounded-md">
                            <p className="text-sm text-muted-foreground">Total de Pedidos no Período</p>
                            <p className="text-lg font-bold text-primary">{totalPeriodOrders}</p>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-md">
                            <p className="text-sm text-muted-foreground">Total Vendas no Período</p>
                            <p className="text-lg font-bold text-green-600">{formatCurrency(totalPeriodSales)}</p>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-md">
                            <p className="text-sm text-muted-foreground">Saldo Final Total no Período</p>
                            <p className="text-lg font-bold text-blue-600">{formatCurrency(totalPeriodNetRevenue)}</p>
                        </div>
                    </div>
                </CardFooter>
            )}
          </Card>
        </TabsContent>
        
        <TabsContent value="comparativo" className="space-y-4">
          <ComparativeReport startDate={startDate} endDate={endDate} />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default ReportsPage;