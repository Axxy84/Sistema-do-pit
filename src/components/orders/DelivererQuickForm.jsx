import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, UserPlus } from 'lucide-react';

const DelivererQuickForm = ({ isOpen, onOpenChange, onDelivererAdded }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const resetForm = () => {
    setName('');
    setPhone('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name) {
      toast({ title: 'Erro de Validação', description: 'O nome do entregador é obrigatório.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      const { data: newDeliverer, error } = await supabase
        .from('entregadores')
        .insert([{ nome: name, telefone: phone, ativo: true }])
        .select()
        .single();

      if (error) throw error;

      toast({ title: 'Entregador Adicionado!', description: `${name} foi cadastrado com sucesso.` });
      if (onDelivererAdded) {
        onDelivererAdded(newDeliverer);
      }
      resetForm();
      onOpenChange(false);
    } catch (err) {
      toast({ title: 'Erro ao adicionar entregador', description: err.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(openState) => { onOpenChange(openState); if (!openState) resetForm(); }}>
      <DialogContent className="sm:max-w-[425px] bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center"><UserPlus className="mr-2 text-primary"/>Cadastrar Novo Entregador</DialogTitle>
          <DialogDescription>
            Preencha os dados para adicionar um novo entregador rapidamente.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="deliverer-name" className="text-right">
                Nome
              </Label>
              <Input
                id="deliverer-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                placeholder="Nome completo do entregador"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="deliverer-phone" className="text-right">
                Telefone
              </Label>
              <Input
                id="deliverer-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="col-span-3"
                placeholder="(Opcional)"
                type="tel"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isLoading}>
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary/80">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Entregador
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DelivererQuickForm;