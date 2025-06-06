import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Button } from '@/components/ui/button';
import { LogOut, RefreshCw, DollarSign, Receipt, Calculator, TrendingUp, AlertTriangle, PiggyBank } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { expenseService } from '@/services/expenseService';
import { profitCalculatorService } from '@/services/profitCalculatorService';
import InfoCard from './InfoCard';
import TonyBanner from './TonyBanner';
import AddExpenseForm from './AddExpenseForm';
import ExpensesList from './ExpensesList';
import ProfitLossCard from './ProfitLossCard';
import ExpensesCategoryChart from './ExpensesCategoryChart';

const TonyDashboardPage = () => {
  console.log('💰 TonyDashboardPage - Centro Financeiro renderizado');
  
  const { signOut, session } = useAuth(); 
  const { toast } = useToast();
  const [expensesData, setExpensesData] = useState([]);
  const [financialSummary, setFinancialSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  console.log('💰 TonyDashboardPage - Estado da sessão:', {
    hasSession: !!session,
    userEmail: session?.user?.email,
    sessionData: session
  });

  const fetchFinancialData = async (date = selectedDate) => {
    try {
      setIsLoading(true);
      console.log('💰 TonyDashboardPage - Buscando dados financeiros para:', date);
      
      // Buscar despesas do dia e resumo financeiro
      const [expenses, summary] = await Promise.all([
        expenseService.getAllExpenses({
          tipo: 'despesa',
          data_inicio: date,
          data_fim: date
        }),
        expenseService.getExpensesSummary({
          data_inicio: date,
          data_fim: date
        })
      ]);

      console.log('📊 TonyDashboardPage - Despesas:', expenses);
      console.log('📊 TonyDashboardPage - Resumo:', summary);
      
      setExpensesData(expenses);
      setFinancialSummary(summary);
      
      console.log('✅ TonyDashboardPage - Dados financeiros carregados');
    } catch (error) {
      console.error('❌ TonyDashboardPage - Erro ao carregar dados financeiros:', error);
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar os dados financeiros.',
        variant: 'destructive'
      });
      
      // Definir dados vazios em caso de erro
      setExpensesData([]);
      setFinancialSummary({
        total_despesas: 0,
        total_receitas: 0,
        quantidade_despesas: 0,
        quantidade_receitas: 0,
        saldo: 0
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log('💰 TonyDashboardPage - useEffect executado');
    fetchFinancialData();
    
    return () => {
      console.log('💰 TonyDashboardPage - Componente desmontado (cleanup)');
    };
  }, [selectedDate]);

  const handleSignOut = async () => {
    console.log('🚪 TonyDashboardPage - Iniciando logout');
    const { error } = await signOut();
    if (error) {
      console.error('❌ TonyDashboardPage - Erro no logout:', error);
      toast({ title: 'Erro ao Sair', description: error.message, variant: 'destructive' });
    } else {
      console.log('✅ TonyDashboardPage - Logout realizado com sucesso');
      toast({ title: 'Logout Realizado', description: 'Você foi desconectado com sucesso.' });
    }
  };

  const userDisplayName = session?.user?.email ? session.user.email.split('@')[0] : 'Tony';
  console.log('💰 TonyDashboardPage - Nome do usuário:', userDisplayName);

  console.log('✅ TonyDashboardPage - Renderização concluída');

  const handleRefresh = () => {
    fetchFinancialData();
  };

  const handleDateChange = (event) => {
    setSelectedDate(event.target.value);
  };

  const handleExpenseAdded = () => {
    // Recarregar dados quando uma nova despesa for adicionada
    fetchFinancialData();
  };

  const handleExpenseDeleted = () => {
    // Recarregar dados quando uma despesa for deletada
    fetchFinancialData();
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const renderFinancialMetrics = () => {
    if (isLoading || !financialSummary) {
      return (
        <div className="grid gap-6 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-slate-800/80 backdrop-blur-sm shadow-xl rounded-xl p-5 animate-pulse border border-slate-700/50">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-slate-600 rounded mr-4"></div>
                <div className="flex-1">
                  <div className="h-3 bg-slate-600 rounded mb-2 w-20"></div>
                  <div className="h-8 bg-slate-600 rounded mb-1 w-24"></div>
                  <div className="h-3 bg-slate-600 rounded w-16"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }
    
    return (
      <div className="grid gap-6 md:grid-cols-4">
        <InfoCard
          title="Despesas do Dia"
          value={formatCurrency(financialSummary.total_despesas)}
          subtitle={`${financialSummary.quantidade_despesas} lançamentos`}
          icon={Receipt}
          color="text-red-400"
        />
        
        <InfoCard
          title="Receitas do Dia"
          value={formatCurrency(financialSummary.total_receitas)}
          subtitle={`${financialSummary.quantidade_receitas} entradas`}
          icon={DollarSign}
          color="text-green-400"
        />
        
        <InfoCard
          title="Saldo do Dia"
          value={formatCurrency(financialSummary.saldo)}
          subtitle={financialSummary.saldo >= 0 ? "Positivo" : "Negativo"}
          icon={PiggyBank}
          color={financialSummary.saldo >= 0 ? "text-green-400" : "text-red-400"}
        />
        
        <InfoCard
          title="Total Movimentado"
          value={formatCurrency(financialSummary.total_despesas + financialSummary.total_receitas)}
          subtitle="Hoje"
          icon={TrendingUp}
          color="text-blue-400"
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-red-900">
      <div className="p-4 md:p-8 space-y-6">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <div>
            <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-red-400 via-red-500 to-amber-400">
              Centro Financeiro
            </h1>
            <p className="text-gray-300 mt-2 text-lg">
              Controle de despesas e análise de lucros em tempo real
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm shadow-sm text-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
            <Button 
              onClick={handleRefresh}
              variant="outline"
              className="bg-slate-800/80 hover:bg-slate-700 border-slate-600 text-white"
              disabled={isLoading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button 
              onClick={handleSignOut} 
              variant="destructive" 
              className="bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 shadow-lg hover:shadow-xl transition-shadow"
            >
              <LogOut className="mr-2 h-5 w-5" /> Sair
            </Button>
          </div>
        </header>

        {/* Banner do Tony */}
        <TonyBanner />

        {/* Cards de Métricas Financeiras */}
        {renderFinancialMetrics()}

        {/* Seção Principal - Lucro/Prejuízo e Formulário de Despesas */}
        <div className="grid gap-6 lg:grid-cols-2">
          <ProfitLossCard date={selectedDate} onRefresh={handleRefresh} />
          <AddExpenseForm onExpenseAdded={handleExpenseAdded} />
        </div>

        {/* Seção de Análises Detalhadas */}
        <div className="grid gap-6 lg:grid-cols-2 mt-8">
          <ExpensesList 
            expenses={expensesData} 
            isLoading={isLoading} 
            onExpenseDeleted={handleExpenseDeleted}
          />
          <ExpensesCategoryChart 
            date={selectedDate} 
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default TonyDashboardPage;