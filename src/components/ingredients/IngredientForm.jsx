import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

export const UNIDADES_MEDIDA = [
  { id: 'kg', name: 'Quilograma (kg)' },
  { id: 'g', name: 'Grama (g)' },
  { id: 'unidade', name: 'Unidade (un)' },
  { id: 'litro', name: 'Litro (L)' },
  { id: 'ml', name: 'Mililitro (ml)' },
  { id: 'caixa', name: 'Caixa (cx)' },
  { id: 'pacote', name: 'Pacote (pct)' },
];

const IngredientForm = ({ isOpen, onOpenChange, onSubmit, initialIngredientData, isLoading }) => {
  const [nome, setNome] = useState('');
  const [unidadeMedida, setUnidadeMedida] = useState('');
  const [quantidadeAtual, setQuantidadeAtual] = useState('');
  const [quantidadeMinima, setQuantidadeMinima] = useState('');
  const [custoUnitario, setCustoUnitario] = useState('');

  const { toast } = useToast();

  const resetFormFields = () => {
    setNome('');
    setUnidadeMedida('');
    setQuantidadeAtual('');
    setQuantidadeMinima('');
    setCustoUnitario('');
  };

  useEffect(() => {
    if (initialIngredientData) {
      setNome(initialIngredientData.nome || '');
      setUnidadeMedida(initialIngredientData.unidade_medida || '');
      setQuantidadeAtual(initialIngredientData.quantidade_atual?.toString() || '');
      setQuantidadeMinima(initialIngredientData.quantidade_minima?.toString() || '');
      setCustoUnitario(initialIngredientData.custo_unitario?.toString() || '');
    } else {
      resetFormFields();
    }
  }, [initialIngredientData, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nome || !unidadeMedida || quantidadeAtual === '' || quantidadeMinima === '') {
      toast({ title: 'Erro de Validação', description: 'Nome, Unidade de Medida, Quantidade Atual e Mínima são obrigatórios.', variant: 'destructive' });
      return;
    }
    if (parseFloat(quantidadeAtual) < 0 || parseFloat(quantidadeMinima) < 0 || (custoUnitario && parseFloat(custoUnitario) < 0)) {
        toast({ title: 'Erro de Validação', description: 'Quantidades e custo não podem ser negativos.', variant: 'destructive' });
        return;
    }

    onSubmit({
      nome,
      unidade_medida: unidadeMedida,
      quantidade_atual: parseFloat(quantidadeAtual),
      quantidade_minima: parseFloat(quantidadeMinima),
      custo_unitario: custoUnitario ? parseFloat(custoUnitario) : null,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(openState) => { onOpenChange(openState); if (!openState) resetFormFields(); }}>
      <DialogContent className="sm:max-w-lg bg-card">
        <DialogHeader>
          <DialogTitle className="text-2xl text-primary">{initialIngredientData ? 'Editar Ingrediente' : 'Adicionar Novo Ingrediente'}</DialogTitle>
          <DialogDescription>
            Preencha os detalhes do ingrediente. Clique em salvar quando terminar.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-6 py-4 max-h-[70vh] overflow-y-auto pr-2">
          <div className="grid gap-2">
            <Label htmlFor="ingredient-name" className="text-foreground/80">Nome do Ingrediente</Label>
            <Input id="ingredient-name" value={nome} onChange={(e) => setNome(e.target.value)} required className="bg-background/70"/>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="ingredient-unit" className="text-foreground/80">Unidade de Medida</Label>
            <Select value={unidadeMedida} onValueChange={setUnidadeMedida} required>
              <SelectTrigger id="ingredient-unit"><SelectValue placeholder="Selecione a unidade" /></SelectTrigger>
              <SelectContent>
                {UNIDADES_MEDIDA.map((um) => (
                  <SelectItem key={um.id} value={um.id}>{um.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="ingredient-current-qty" className="text-foreground/80">Qtde. Atual</Label>
              <Input id="ingredient-current-qty" type="number" step="0.01" placeholder="Ex: 10.5" value={quantidadeAtual} onChange={(e) => setQuantidadeAtual(e.target.value)} required className="bg-background/70"/>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ingredient-min-qty" className="text-foreground/80">Qtde. Mínima</Label>
              <Input id="ingredient-min-qty" type="number" step="0.01" placeholder="Ex: 2.0" value={quantidadeMinima} onChange={(e) => setQuantidadeMinima(e.target.value)} required className="bg-background/70"/>
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="ingredient-cost" className="text-foreground/80">Custo Unitário (R$) (opcional)</Label>
            <Input id="ingredient-cost" type="number" step="0.01" placeholder="Ex: 3.50" value={custoUnitario} onChange={(e) => setCustoUnitario(e.target.value)} className="bg-background/70"/>
          </div>

          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Cancelar</Button>
            </DialogClose>
            <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initialIngredientData ? 'Salvar Alterações' : 'Adicionar Ingrediente'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default IngredientForm;