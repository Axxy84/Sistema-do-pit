import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { delivererService } from '@/services/delivererService';
import { useToast } from '@/components/ui/use-toast';
import { PlusCircle, Loader2, Users, AlertTriangle } from 'lucide-react';
import DelivererFormModal from './DelivererFormModal';
import DeliverersTable from './DeliverersTable';

const DeliverersManager = () => {
  const [deliverers, setDeliverers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDeliverer, setEditingDeliverer] = useState(null);
  const { toast } = useToast();

  const fetchDeliverers = useCallback(async () => {
    setIsLoading(true);
    try {
      const deliverersData = await delivererService.getAllDeliverers();
      setDeliverers(deliverersData);
    } catch (error) {
      toast({ 
        title: 'Erro ao carregar entregadores', 
        description: error.message, 
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchDeliverers();
    // Listen for updates triggered by OrderForm's quick add
    const handleDeliverersUpdatedEvent = () => fetchDeliverers();
    window.addEventListener('deliverersUpdated', handleDeliverersUpdatedEvent);
    return () => {
      window.removeEventListener('deliverersUpdated', handleDeliverersUpdatedEvent);
    };
  }, [fetchDeliverers]);

  const handleAddDeliverer = () => {
    setEditingDeliverer(null);
    setIsModalOpen(true);
  };

  const handleEditDeliverer = (deliverer) => {
    setEditingDeliverer(deliverer);
    setIsModalOpen(true);
  };

  const handleDeleteDeliverer = async (delivererId) => {
    try {
      await delivererService.deleteDeliverer(delivererId);
      toast({ title: 'Sucesso', description: 'Entregador removido com sucesso.' });
      fetchDeliverers();
    } catch (error) {
      toast({ 
        title: 'Erro ao remover entregador', 
        description: error.message, 
        variant: 'destructive' 
      });
    }
  };
  
  const handleSaveDeliverer = async (delivererData) => {
    setIsLoading(true);
    try {
      if (editingDeliverer) {
        await delivererService.updateDeliverer(editingDeliverer.id, delivererData);
        toast({ title: 'Sucesso', description: 'Entregador atualizado com sucesso.' });
      } else {
        await delivererService.createDeliverer(delivererData);
        toast({ title: 'Sucesso', description: 'Entregador adicionado com sucesso.' });
      }
      
      fetchDeliverers();
      setIsModalOpen(false);
      setEditingDeliverer(null);
    } catch (error) {
      toast({ 
        title: `Erro ao ${editingDeliverer ? 'atualizar' : 'adicionar'} entregador`, 
        description: error.message, 
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <Card className="shadow-lg mt-4">
      <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <CardTitle className="flex items-center text-primary">
            <Users className="mr-2 h-6 w-6" />
            Gerenciar Entregadores
          </CardTitle>
          <CardDescription>Adicione, edite ou remova entregadores do sistema.</CardDescription>
        </div>
        <Button onClick={handleAddDeliverer} className="mt-4 md:mt-0 bg-gradient-to-r from-primary to-red-400 hover:from-primary/90 hover:to-red-400/90 text-white">
          <PlusCircle className="mr-2 h-4 w-4" /> Novo Entregador
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading && deliverers.length === 0 ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !isLoading && deliverers.length === 0 ? (
           <div className="flex flex-col items-center justify-center h-64 text-center">
              <AlertTriangle className="w-16 h-16 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">Nenhum entregador cadastrado</h2>
              <p className="text-muted-foreground max-w-md">
                Clique em "Novo Entregador" para adicionar o primeiro.
              </p>
            </div>
        ) : (
          <DeliverersTable
            deliverers={deliverers}
            onEdit={handleEditDeliverer}
            onDelete={handleDeleteDeliverer}
          />
        )}
      </CardContent>

      {isModalOpen && (
        <DelivererFormModal
          isOpen={isModalOpen}
          onOpenChange={setIsModalOpen}
          onSave={handleSaveDeliverer}
          initialData={editingDeliverer}
          isLoading={isLoading}
        />
      )}
    </Card>
  );
};

export default DeliverersManager;