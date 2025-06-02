import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Truck, 
  UtensilsCrossed, 
  History, 
  Loader2,
  Split,
  TrendingUp,
  Calendar,
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { apiClient } from '@/lib/apiClient';

const SeparateCashClosingPage = () => {
  const [activeTab, setActiveTab] = useState('delivery');
  const [loading, setLoading] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const { toast } = useToast();

  const tabs = [
    { 
      value: 'delivery', 
      label: 'Delivery', 
      icon: Truck,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950'
    },
    { 
      value: 'mesa', 
      label: 'Mesa', 
      icon: UtensilsCrossed,
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
    // Temporariamente desabilitado para testar
    // if (selectedDate && activeTab !== 'history') {
    //   fetchSummaryData(selectedDate);
    // }
    
    // Dados fictícios para teste
    setSummaryData({
      delivery: {
        total_pedidos: 5,
        vendas_brutas: 150.00,
        vendas_liquidas: 140.00,
        saldo_final: 140.00,
        vendas_dinheiro: 50.00,
        vendas_cartao: 60.00,
        vendas_pix: 30.00,
        pedidos_dinheiro: 2,
        pedidos_cartao: 2,
        pedidos_pix: 1
      },
      mesa: {
        total_pedidos: 3,
        vendas_brutas: 85.00,
        vendas_liquidas: 80.00,
        saldo_final: 80.00,
        vendas_dinheiro: 30.00,
        vendas_cartao: 30.00,
        vendas_pix: 20.00,
        pedidos_dinheiro: 1,
        pedidos_cartao: 1,
        pedidos_pix: 1
      }
    });
  }, [selectedDate, activeTab]);

  const fetchSummaryData = async (date) => {
    try {
      setLoading(true);
      
      const response = await apiClient.get(
        `/separate-cash-closing/summary/${date}`
      );
      
      setSummaryData(response);
    } catch (error) {
      console.error('Erro ao buscar resumo:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados do resumo',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const getCurrentData = () => {
    if (!summaryData || activeTab === 'history') return null;
    return summaryData[activeTab];
  };

  const currentTab = tabs.find(tab => tab.value === activeTab);
  const data = getCurrentData();

  if (loading && !summaryData && activeTab !== 'history') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <h2 className="text-xl font-semibold">Carregando dados...</h2>
          <p className="text-muted-foreground">Buscando informações do fechamento</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400">
              <Split className="inline w-10 h-10 mr-3" />
              Fechamento Separado
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Gerencie os fechamentos de caixa separadamente para delivery e mesa
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <Badge variant="outline" className="text-sm">
              {formatDate(selectedDate)}
            </Badge>
          </div>
        </div>
      </motion.div>

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
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            typeInfo={tabs[0]}
          />
        </TabsContent>

        <TabsContent value="mesa" className="space-y-6">
          <SeparateClosingContent 
            type="mesa" 
            data={data} 
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            typeInfo={tabs[1]}
          />
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Fechamentos Separados</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Em breve você poderá visualizar o histórico completo de fechamentos separados aqui.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const SeparateClosingContent = ({ type, data, selectedDate, onDateChange, typeInfo }) => {
  const [observacoes, setObservacoes] = useState('');
  const [saving, setSaving] = useState(false);
  const [jaFechado, setJaFechado] = useState(false);
  const { toast } = useToast();

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const checkIfClosed = async () => {
    try {
      const response = await apiClient.get(
        `/separate-cash-closing/history?data_inicio=${selectedDate}&data_fim=${selectedDate}`
      );
      
      const fechamentos = response.fechamentos || [];
      const fechamentoExiste = fechamentos.some(f => 
        f.data_fechamento.split('T')[0] === selectedDate && 
        f.tipo_fechamento === type
      );
      
      setJaFechado(fechamentoExiste);
    } catch (error) {
      console.error('Erro ao verificar fechamento:', error);
    }
  };

  useEffect(() => {
    // Temporariamente desabilitado para testar
    // checkIfClosed();
    setJaFechado(false);
  }, [selectedDate, type]);

  const handleSave = async () => {
    if (!data) {
      toast({
        title: 'Erro',
        description: 'Dados não disponíveis para fechamento',
        variant: 'destructive'
      });
      return;
    }

    // Temporariamente simulando sucesso para teste
    toast({
      title: 'Sucesso!',
      description: `Fechamento de ${type} simulado com sucesso!`,
      variant: 'default'
    });

    /*
    try {
      setSaving(true);

      const fechamentoData = {
        tipo_fechamento: type,
        data_fechamento: selectedDate,
        total_pedidos: data.total_pedidos,
        total_vendas: data.vendas_liquidas,
        total_despesas_extras: data.total_despesas,
        total_receitas_extras: data.receitas_extras,
        total_descontos: data.descontos_totais,
        total_impostos: 0,
        total_taxas_entrega: data.total_taxas_entrega || 0,
        saldo_final: data.saldo_final,
        observacoes: observacoes,
        vendas_por_metodo: {
          dinheiro: data.vendas_dinheiro,
          cartao: data.vendas_cartao,
          pix: data.vendas_pix
        }
      };

      await apiClient.post(
        `/separate-cash-closing/close`,
        fechamentoData
      );

      toast({
        title: 'Sucesso!',
        description: `Fechamento de ${type} realizado com sucesso!`,
        variant: 'default'
      });
      
      setObservacoes('');
      setJaFechado(true);

    } catch (error) {
      console.error('Erro ao salvar fechamento:', error);
      const errorMessage = error.response?.data?.error || 'Erro ao salvar fechamento';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
    */
  };

  if (!data) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-16">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">Carregando dados...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const Icon = typeInfo.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className={`${typeInfo.bgColor} border-l-4 ${type === 'delivery' ? 'border-l-blue-500' : 'border-l-green-500'}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${type === 'delivery' ? 'bg-blue-100 dark:bg-blue-900' : 'bg-green-100 dark:bg-green-900'}`}>
                <Icon className={`w-6 h-6 ${typeInfo.color}`} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Fechamento {typeInfo.label}</h2>
                <p className="text-muted-foreground">
                  {selectedDate ? new Date(selectedDate).toLocaleDateString('pt-BR') : ''}
                </p>
              </div>
            </div>
            {jaFechado && (
              <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                ✓ Já Fechado
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Pedidos</p>
                <p className="text-2xl font-bold text-primary">{data.total_pedidos}</p>
              </div>
              <DollarSign className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Vendas Brutas</p>
                <p className="text-xl font-bold">{formatCurrency(data.vendas_brutas)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Vendas Líquidas</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(data.vendas_liquidas)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Saldo Final</p>
                <p className={`text-xl font-bold ${data.saldo_final >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(data.saldo_final)}
                </p>
              </div>
              <DollarSign className={`w-8 h-8 ${data.saldo_final >= 0 ? 'text-green-500' : 'text-red-500'}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detalhes por Forma de Pagamento */}
      <Card>
        <CardHeader>
          <CardTitle>Formas de Pagamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Dinheiro</p>
              <p className="text-lg font-semibold">{formatCurrency(data.vendas_dinheiro)}</p>
              <p className="text-xs text-muted-foreground">{data.pedidos_dinheiro} pedidos</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Cartão</p>
              <p className="text-lg font-semibold">{formatCurrency(data.vendas_cartao)}</p>
              <p className="text-xs text-muted-foreground">{data.pedidos_cartao} pedidos</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">PIX</p>
              <p className="text-lg font-semibold">{formatCurrency(data.vendas_pix)}</p>
              <p className="text-xs text-muted-foreground">{data.pedidos_pix} pedidos</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ações de Fechamento */}
      <Card>
        <CardHeader>
          <CardTitle>Finalizar Fechamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Data do Fechamento</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => onDateChange(e.target.value)}
                disabled={jaFechado}
                className="w-full p-2 border rounded-md bg-background"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Observações (opcional)</label>
              <textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                disabled={jaFechado}
                placeholder={`Observações sobre o fechamento ${typeInfo.label.toLowerCase()}...`}
                className="w-full p-2 border rounded-md bg-background h-20 resize-none"
              />
            </div>
          </div>
          
          <div className="flex justify-center pt-4">
            {!jaFechado ? (
              <Button
                onClick={handleSave}
                disabled={saving}
                size="lg"
                className={`min-w-[200px] ${type === 'delivery' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}`}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  `Fechar Caixa ${typeInfo.label}`
                )}
              </Button>
            ) : (
              <div className="text-center">
                <p className="text-muted-foreground">
                  Fechamento de {typeInfo.label.toLowerCase()} já realizado para esta data
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SeparateCashClosingPage; 