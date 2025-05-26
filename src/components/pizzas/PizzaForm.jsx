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
import { PIZZA_FLAVORS, PIZZA_SIZES } from '@/lib/constants';
import { Loader2 } from 'lucide-react';

const PizzaForm = ({ isOpen, onOpenChange, onSubmit, initialPizzaData, isLoading }) => {
  const [flavor, setFlavor] = useState('');
  const [size, setSize] = useState('');
  const [price, setPrice] = useState('');
  const [ingredients, setIngredients] = useState('');

  const { toast } = useToast();

  const resetFormFields = () => {
    setFlavor('');
    setSize('');
    setPrice('');
    setIngredients('');
  };

  useEffect(() => {
    if (initialPizzaData) {
      setFlavor(initialPizzaData.sabor || '');
      setSize(initialPizzaData.tamanho || '');
      setPrice(initialPizzaData.preco ? initialPizzaData.preco.toString() : '');
      setIngredients(initialPizzaData.ingredientes || '');
    } else {
      resetFormFields();
    }
  }, [initialPizzaData, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!flavor || !size || !price) {
      toast({
        title: 'Erro de Validação',
        description: 'Sabor, tamanho e preço são obrigatórios.',
        variant: 'destructive',
      });
      return;
    }
    const priceValue = parseFloat(price);
    if (isNaN(priceValue) || priceValue <= 0) {
        toast({
            title: 'Erro de Validação',
            description: 'O preço deve ser um número positivo.',
            variant: 'destructive',
        });
        return;
    }

    onSubmit({ flavor, size, price: priceValue, ingredients });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(openState) => { onOpenChange(openState); if (!openState) resetFormFields(); }}>
      <DialogContent className="sm:max-w-[480px] bg-card">
        <DialogHeader>
          <DialogTitle className="text-2xl text-primary">{initialPizzaData ? 'Editar Pizza' : 'Adicionar Nova Pizza'}</DialogTitle>
          <DialogDescription>
            Preencha os detalhes da pizza. Clique em salvar quando terminar.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="flavor" className="text-foreground/80">Sabor</Label>
            <Select value={flavor} onValueChange={setFlavor} required>
              <SelectTrigger id="flavor">
                <SelectValue placeholder="Selecione o sabor" />
              </SelectTrigger>
              <SelectContent>
                {PIZZA_FLAVORS.map((f) => (
                  <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="size" className="text-foreground/80">Tamanho</Label>
            <Select value={size} onValueChange={setSize} required>
              <SelectTrigger id="size">
                <SelectValue placeholder="Selecione o tamanho" />
              </SelectTrigger>
              <SelectContent>
                {PIZZA_SIZES.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="price" className="text-foreground/80">Preço (R$)</Label>
            <Input id="price" type="number" step="0.01" placeholder="Ex: 29.90" value={price} onChange={(e) => setPrice(e.target.value)} required className="bg-background/70"/>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ingredients" className="text-foreground/80">Ingredientes (opcional, separados por vírgula)</Label>
            <Input id="ingredients" placeholder="Ex: Queijo, tomate, orégano" value={ingredients} onChange={(e) => setIngredients(e.target.value)} className="bg-background/70"/>
          </div>
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Cancelar</Button>
            </DialogClose>
            <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initialPizzaData ? 'Salvar Alterações' : 'Adicionar Pizza'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PizzaForm;