import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Receipt, Trash2, Edit3, Calendar } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { expenseService } from '@/services/expenseService';

const ExpensesList = ({ expenses, isLoading, onExpenseDeleted }) => {
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState(null);

  const getCategoryIcon = (categoria) => {
    switch (categoria) {
      case 'fixa': return '🏢';
      case 'insumos': return '📦';
      case 'taxa': return '📋';
      default: return '💰';
    }
  };

  const getCategoryLabel = (categoria) => {
    switch (categoria) {
      case 'fixa': return 'Despesa Fixa';
      case 'insumos': return 'Insumos';
      case 'taxa': return 'Taxa/Imposto';
      default: return 'Outro';
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const handleDelete = async (expense) => {
    if (!confirm(`Tem certeza que deseja excluir "${expense.descricao}"?`)) {
      return;
    }

    try {
      setDeletingId(expense.id);
      await expenseService.deleteExpense(expense.id);
      
      toast({
        title: 'Despesa excluída',
        description: `${expense.descricao} foi removida com sucesso.`,
        variant: 'default'
      });

      if (onExpenseDeleted) {
        onExpenseDeleted(expense.id);
      }

    } catch (error) {
      console.error('Erro ao excluir despesa:', error);
      toast({
        title: 'Erro ao excluir',
        description: error.message || 'Não foi possível excluir a despesa.',
        variant: 'destructive'
      });
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-slate-800/80 backdrop-blur-sm shadow-xl border border-slate-700/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Receipt className="h-5 w-5 text-red-400" />
            <span className="text-white">Despesas do Dia</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-red-400" />
        </CardContent>
      </Card>
    );
  }

  if (!expenses || expenses.length === 0) {
    return (
      <Card className="bg-slate-800/80 backdrop-blur-sm shadow-xl border border-slate-700/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Receipt className="h-5 w-5 text-red-400" />
            <span className="text-white">Despesas do Dia</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48 text-gray-400">
          <div className="text-center">
            <Receipt className="h-12 w-12 mx-auto mb-2 opacity-50 text-gray-500" />
            <p>Nenhuma despesa registrada hoje</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Pegar apenas as últimas 10 despesas
  const recentExpenses = expenses.slice(0, 10);
  const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.valor), 0);

  return (
    <Card className="bg-slate-800/80 backdrop-blur-sm shadow-xl border border-slate-700/50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Receipt className="h-5 w-5 text-red-400" />
            <span className="text-white">Despesas do Dia</span>
          </div>
          <Badge variant="outline" className="text-xs border-slate-600 text-gray-300">
            {expenses.length} registros
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3 mb-6">
          {recentExpenses.map((expense) => (
            <div 
              key={expense.id}
              className="p-4 rounded-lg border border-slate-600 bg-slate-700/50 transition-all duration-200 hover:bg-slate-700/70"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-lg">{getCategoryIcon(expense.categoria)}</span>
                    <Badge 
                      variant="secondary" 
                      className="text-xs bg-slate-600/50 text-gray-300 border-slate-600"
                    >
                      {getCategoryLabel(expense.categoria)}
                    </Badge>
                  </div>
                  
                  <h4 className="font-medium text-white mb-1">
                    {expense.descricao}
                  </h4>
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-400">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(expense.data_transacao)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div className="text-lg font-bold text-red-400">
                      {formatCurrency(expense.valor)}
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 hover:bg-slate-600"
                      onClick={() => handleDelete(expense)}
                      disabled={deletingId === expense.id}
                    >
                      {deletingId === expense.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3 text-gray-400 hover:text-red-400" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Resumo no rodapé */}
        <div className="pt-4 border-t border-slate-600">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Total gasto hoje:</span>
            <div className="text-right">
              <div className="text-lg font-bold text-red-400">
                {formatCurrency(totalExpenses)}
              </div>
              {expenses.length > 10 && (
                <div className="text-xs text-gray-500">
                  Mostrando 10 de {expenses.length} despesas
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExpensesList;