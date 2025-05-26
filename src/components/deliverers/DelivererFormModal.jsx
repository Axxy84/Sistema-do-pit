import React, { useState, useEffect } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { Loader2, UserPlus, Edit } from 'lucide-react';

const DelivererFormModal = ({ isOpen, onOpenChange, onSave, initialData, isLoading: propIsLoading }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [internalLoading, setInternalLoading] = useState(false);

  const currentLoadingState = propIsLoading || internalLoading;

  useEffect(() => {
    if (initialData) {
      setName(initialData.nome || '');
      setPhone(initialData.telefone || '');
      setIsActive(initialData.ativo === undefined ? true : initialData.ativo);
    } else {
      setName('');
      setPhone('');
      setIsActive(true);
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name) {
      alert('O nome do entregador é obrigatório.'); // Consider using toast
      return;
    }
    setInternalLoading(true);
    try {
      await onSave({ nome: name, telefone: phone, ativo: isActive });
      // onOpenChange(false); // Let the parent component decide to close
    } catch (error) {
      // Error should be handled by the onSave implementation (toast)
      console.error("Error in handleSubmit of DelivererFormModal:", error);
    } finally {
      setInternalLoading(false);
    }
  };

  const handleClose = () => {
    if (!currentLoadingState) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            {initialData ? <Edit className="mr-2 text-primary"/> : <UserPlus className="mr-2 text-primary"/>}
            {initialData ? 'Editar Entregador' : 'Cadastrar Novo Entregador'}
          </DialogTitle>
          <DialogDescription>
            {initialData ? 'Atualize os dados do entregador.' : 'Preencha os dados para adicionar um novo entregador.'}
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
                placeholder="Nome completo"
                required
                disabled={currentLoadingState}
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
                disabled={currentLoadingState}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="deliverer-active" className="text-right">
                Ativo
              </Label>
              <div className="col-span-3 flex items-center">
                <Switch
                  id="deliverer-active"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                  disabled={currentLoadingState}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={handleClose} disabled={currentLoadingState}>
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={currentLoadingState} className="bg-primary hover:bg-primary/80">
              {currentLoadingState && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initialData ? 'Salvar Alterações' : 'Adicionar Entregador'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DelivererFormModal;