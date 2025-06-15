import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Loader2, DollarSign } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { expenseService } from '@/services/expenseService';

const AddExpenseForm = ({ onExpenseAdded }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    descricao: '',
    categoria: 'outro',
    valor: '',
    data_transacao: new Date().toISOString().split('T')[0]
  });

  const categorias = [
    { value: 'fixa', label: 'Despesa Fixa', icon: '🏢' },
    { value: 'insumos', label: 'Insumos', icon: '📦' },
    { value: 'taxa', label: 'Taxa/Imposto', icon: '📋' },
    { value: 'outro', label: 'Outro', icon: '💰' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validação básica
    if (!formData.descricao || !formData.valor) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha descrição e valor.',
        variant: 'destructive'
      });
      return;
    }

    const valor = parseFloat(formData.valor);
    if (isNaN(valor) || valor <= 0) {
      toast({
        title: 'Valor inválido',
        description: 'Digite um valor maior que zero.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsLoading(true);
      
      const expenseData = {
        tipo: 'despesa',
        descricao: formData.descricao,
        categoria: formData.categoria,
        valor: valor,
        data_transacao: formData.data_transacao
      };

      await expenseService.createExpense(expenseData);
      
      toast({
        title: 'Despesa adicionada!',
        description: `R$ ${valor.toFixed(2)} - ${formData.descricao}`,
        variant: 'default'
      });

      // Limpar formulário
      setFormData({
        descricao: '',
        categoria: 'outro',
        valor: '',
        data_transacao: new Date().toISOString().split('T')[0]
      });

      // Notificar componente pai
      if (onExpenseAdded) {
        onExpenseAdded();
      }
      
      // Disparar evento para atualização em tempo real
      window.dispatchEvent(new CustomEvent('expenseAdded', { 
        detail: { 
          expenseId: result.id,
          tipo: formData.tipo,
          valor: formData.valor 
        } 
      }));

    } catch (error) {
      console.error('Erro ao adicionar despesa:', error);
      toast({
        title: 'Erro ao salvar',
        description: error.message || 'Não foi possível adicionar a despesa.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatCurrency = (value) => {
    if (!value) return '';
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return value;
    return numValue.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  return (
    <Card className="bg-slate-800/80 backdrop-blur-sm shadow-xl border border-slate-700/50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center space-x-2">
          <DollarSign className="h-5 w-5 text-red-400" />
          <span className="text-white">Adicionar Despesa</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="descricao" className="text-sm font-medium text-gray-300">
              Descrição *
            </Label>
            <Textarea
              id="descricao"
              placeholder="Ex: Compra de ingredientes, conta de luz..."
              value={formData.descricao}
              onChange={(e) => handleChange('descricao', e.target.value)}
              className="bg-slate-700/50 border-slate-600 text-white placeholder-gray-400 focus:ring-red-500 focus:border-red-500"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Categoria */}
            <div className="space-y-2">
              <Label htmlFor="categoria" className="text-sm font-medium text-gray-300">
                Categoria
              </Label>
              <Select value={formData.categoria} onValueChange={(value) => handleChange('categoria', value)}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white focus:ring-red-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  {categorias.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value} className="text-white hover:bg-slate-600">
                      <span className="flex items-center space-x-2">
                        <span>{cat.icon}</span>
                        <span>{cat.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Valor */}
            <div className="space-y-2">
              <Label htmlFor="valor" className="text-sm font-medium text-gray-300">
                Valor (R$) *
              </Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={formData.valor}
                onChange={(e) => handleChange('valor', e.target.value)}
                className="bg-slate-700/50 border-slate-600 text-white placeholder-gray-400 focus:ring-red-500 focus:border-red-500"
              />
              {formData.valor && (
                <p className="text-xs text-gray-400">
                  {formatCurrency(formData.valor)}
                </p>
              )}
            </div>
          </div>

          {/* Data */}
          <div className="space-y-2">
            <Label htmlFor="data" className="text-sm font-medium text-gray-300">
              Data da Transação
            </Label>
            <Input
              id="data"
              type="date"
              value={formData.data_transacao}
              onChange={(e) => handleChange('data_transacao', e.target.value)}
              className="bg-slate-700/50 border-slate-600 text-white focus:ring-red-500 focus:border-red-500"
            />
          </div>

          {/* Botão de salvar */}
          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Despesa
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AddExpenseForm;