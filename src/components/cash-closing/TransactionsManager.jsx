import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { PlusCircle, Edit2, Trash2, TrendingDown, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { supabase } from '@/lib/supabaseClient';

const TransactionsManager = ({ initialTransactions, onTransactionsChange, filterDate, fetchDailyDataForGivenDate }) => {
  const [isTransactionFormOpen, setIsTransactionFormOpen] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState(null);
  const [transactionType, setTransactionType] = useState('despesa');
  const [transactionDescription, setTransactionDescription] = useState('');
  const [transactionAmount, setTransactionAmount] = useState('');
  const [transactionDate, setTransactionDateState] = useState(filterDate);
  const [isLoading, setIsLoading] = useState(false);
  const [localTransactions, setLocalTransactions] = useState([]);

  const { toast } = useToast();

  useEffect(() => {
    setLocalTransactions(initialTransactions.map(t => ({...t, amount: t.valor, date: t.data_transacao, type: t.tipo })));
  }, [initialTransactions]);
  
  useEffect(() => {
    setTransactionDateState(filterDate);
  }, [filterDate]);

  const resetTransactionForm = () => {
    setCurrentTransaction(null);
    setTransactionType('despesa');
    setTransactionDescription('');
    setTransactionAmount('');
    setTransactionDateState(filterDate);
  };

  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    if (!transactionDescription || !transactionAmount || !transactionDate) {
      toast({ title: 'Erro', description: 'Preencha todos os campos da transação.', variant: 'destructive' });
      return;
    }
    const amount = parseFloat(transactionAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: 'Erro', description: 'Valor da transação inválido.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    const transactionDataToSave = {
      tipo: transactionType,
      descricao: transactionDescription,
      valor: amount,
      data_transacao: transactionDate,
    };

    try {
      if (currentTransaction && currentTransaction.id) {
        const { error } = await supabase
          .from('despesas_receitas')
          .update(transactionDataToSave)
          .eq('id', currentTransaction.id);
        if (error) throw error;
        toast({ title: 'Sucesso', description: 'Transação atualizada.' });
      } else {
        const { error } = await supabase
          .from('despesas_receitas')
          .insert(transactionDataToSave);
        if (error) throw error;
        toast({ title: 'Sucesso', description: 'Transação adicionada.' });
      }
      await fetchDailyDataForGivenDate(filterDate); 
      resetTransactionForm();
      setIsTransactionFormOpen(false);
    } catch (error) {
      toast({ title: 'Erro ao salvar transação', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditTransaction = (transaction) => {
    setCurrentTransaction(transaction);
    setTransactionType(transaction.tipo);
    setTransactionDescription(transaction.descricao);
    setTransactionAmount(transaction.valor.toString());
    setTransactionDateState(transaction.data_transacao);
    setIsTransactionFormOpen(true);
  };

  const handleDeleteTransaction = async (id) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('despesas_receitas')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast({ title: 'Sucesso', description: 'Transação removida.' });
      await fetchDailyDataForGivenDate(filterDate);
    } catch (error) {
      toast({ title: 'Erro ao remover transação', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card className="shadow-xl bg-card/80 backdrop-blur-sm">
      <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <CardTitle className="text-xl text-primary flex items-center"><TrendingDown className="mr-2"/> Transações Extras do Dia ({new Date(filterDate+'T00:00:00').toLocaleDateString()})</CardTitle>
          <CardDescription>Registre despesas e receitas não relacionadas diretamente aos pedidos.</CardDescription>
        </div>
        <Dialog open={isTransactionFormOpen} onOpenChange={(isOpen) => { setIsTransactionFormOpen(isOpen); if(!isOpen) resetTransactionForm();}}>
          <DialogTrigger asChild>
            <Button className="mt-4 md:mt-0 bg-gradient-to-r from-primary to-red-400 hover:from-primary/90 hover:to-red-400/90 text-white" disabled={isLoading}>
              <PlusCircle className="mr-2 h-5 w-5" /> Nova Transação
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-card">
            <DialogHeader>
              <DialogTitle className="text-xl text-primary">{currentTransaction ? 'Editar Transação' : 'Nova Transação Extra'}</DialogTitle>
              <DialogDescription>Insira os detalhes da despesa ou receita.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleTransactionSubmit} className="space-y-4 py-4">
              <div>
                <Label htmlFor="transactionTypeForm">Tipo</Label>
                <Select value={transactionType} onValueChange={setTransactionType} disabled={isLoading}>
                  <SelectTrigger id="transactionTypeForm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="despesa">Despesa</SelectItem>
                    <SelectItem value="receita">Receita</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="transactionDescriptionForm">Descrição</Label>
                <Input id="transactionDescriptionForm" value={transactionDescription} onChange={(e) => setTransactionDescription(e.target.value)} required disabled={isLoading}/>
              </div>
              <div>
                <Label htmlFor="transactionAmountForm">Valor (R$)</Label>
                <Input id="transactionAmountForm" type="number" step="0.01" value={transactionAmount} onChange={(e) => setTransactionAmount(e.target.value)} required disabled={isLoading}/>
              </div>
              <div>
                <Label htmlFor="transactionDateForm">Data</Label>
                <Input id="transactionDateForm" type="date" value={transactionDate} onChange={(e) => setTransactionDateState(e.target.value)} required disabled={isLoading}/>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline" disabled={isLoading}>Cancelar</Button></DialogClose>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {currentTransaction ? 'Salvar' : 'Adicionar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="pt-6">
        {isLoading && localTransactions.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        ) : !isLoading && localTransactions.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">Nenhuma transação extra registrada para esta data.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {localTransactions.map(t => (
                <TableRow key={t.id}>
                  <TableCell>{new Date(t.date+'T00:00:00').toLocaleDateString()}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${t.type === 'despesa' ? 'bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-300' : 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-300'}`}>
                      {t.type === 'despesa' ? 'Despesa' : 'Receita'}
                    </span>
                  </TableCell>
                  <TableCell>{t.descricao}</TableCell>
                  <TableCell>{formatCurrency(t.amount)}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEditTransaction(t)} className="text-blue-500 hover:text-blue-700" disabled={isLoading}><Edit2 className="h-4 w-4"/></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteTransaction(t.id)} className="text-red-500 hover:text-red-700" disabled={isLoading}>
                        {isLoading && currentTransaction?.id === t.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4"/>}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionsManager;