import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PAYMENT_METHODS } from '@/lib/constants';
import { Bike, Loader2, PlusCircle } from 'lucide-react';
import delivererService from '@/services/delivererService';
import { useToast } from '@/components/ui/use-toast';
import DelivererFormModal from '@/components/deliverers/DelivererFormModal';

const DeliveryStatusForm = ({ 
    paymentMethod, setPaymentMethod,
    delivererId, setDelivererId,
    setIsDeliverersLoading // Pass this up to OrderForm
}) => {
  const [deliverers, setDeliverers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDelivererModalOpen, setIsDelivererModalOpen] = useState(false);
  const { toast } = useToast();

  const fetchDeliverers = useCallback(async () => {
    setIsLoading(true);
    setIsDeliverersLoading(true); // Notify parent
    try {
      const data = await delivererService.getActiveDeliverers();
      
      if (!data || data.length === 0) {
        toast({ title: "Nenhum entregador ativo", description: "Não há entregadores ativos cadastrados.", variant: "default" });
        setDeliverers([]);
      } else {
        setDeliverers(data);
      }
    } catch (err) {
      toast({ title: "Erro ao carregar entregadores", description: err.message, variant: "destructive" });
      console.error("Erro ao carregar entregadores:", err);
      setDeliverers([]);
    } finally {
      setIsLoading(false);
      setIsDeliverersLoading(false); // Notify parent
    }
  }, [toast, setIsDeliverersLoading]);

  useEffect(() => {
    fetchDeliverers();

    const handleDeliverersUpdatedEvent = (event) => {
      fetchDeliverers();
      if (event.detail && event.detail.newDeliverer) {
        // Optionally pre-select the new deliverer
        // setDelivererId(event.detail.newDeliverer.id); 
      }
    };
    window.addEventListener('deliverersUpdated', handleDeliverersUpdatedEvent);
    
    return () => {
      window.removeEventListener('deliverersUpdated', handleDeliverersUpdatedEvent);
    };
  }, [fetchDeliverers]);

  const handleDelivererChange = (value) => {
    setDelivererId(value === "none" ? null : value);
  };

  const handleSaveNewDeliverer = async (newDelivererData) => {
    // This function is passed to DelivererFormModal
    // It's called from DeliverersManager, so we need to ensure it's robust
    setIsLoading(true);
    try {
      const savedDeliverer = await delivererService.createDeliverer(newDelivererData);

      toast({ title: 'Sucesso!', description: 'Novo entregador cadastrado.' });
      fetchDeliverers(); // Re-fetch to include the new one
      setDelivererId(savedDeliverer.id); // Pre-select the new deliverer
      setIsDelivererModalOpen(false);
      // Dispatch event so other components (like DeliverersManager) can also update
      window.dispatchEvent(new CustomEvent('deliverersUpdated', { detail: { newDeliverer: savedDeliverer } }));

    } catch (err) {
      toast({ title: "Erro ao salvar entregador", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <>
      <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center"><Bike className="mr-2 text-primary" /> Detalhes da Entrega e Pagamento</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="grid gap-2">
              <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod} required>
                  <SelectTrigger id="paymentMethod"><SelectValue placeholder="Selecione a forma de pgto." /></SelectTrigger>
                  <SelectContent>
                      {PAYMENT_METHODS.map(pm => <SelectItem key={pm.id} value={pm.id}>{pm.name}</SelectItem>)}
                  </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="deliverer">Entregador</Label>
              <div className="flex items-center gap-2">
                <Select 
                  value={delivererId || "none"} 
                  onValueChange={handleDelivererChange} 
                  disabled={isLoading}
                >
                  <SelectTrigger id="deliverer" className="flex-grow">
                    <SelectValue placeholder={isLoading ? "Carregando..." : "Selecione o entregador"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Não atribuir</SelectItem>
                    {deliverers.map(d => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.nome} {d.telefone ? `(${d.telefone})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" variant="outline" size="icon" onClick={() => setIsDelivererModalOpen(true)} disabled={isLoading}>
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </div>
              {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mt-1" />}
            </div>
          </CardContent>
      </Card>

      <DelivererFormModal
        isOpen={isDelivererModalOpen}
        onOpenChange={setIsDelivererModalOpen}
        onSave={handleSaveNewDeliverer} // This will now directly save and update
        initialData={null} // Always for new deliverer from here
        isLoading={isLoading}
      />
    </>
  );
};

export default DeliveryStatusForm;