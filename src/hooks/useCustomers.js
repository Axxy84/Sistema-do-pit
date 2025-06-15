import { useState, useEffect, useCallback } from 'react';
import { clientService } from '@/services/clientService';
import { useToast } from '@/components/ui/use-toast';

export const useCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Função para buscar clientes com invalidação de cache
  const fetchCustomers = useCallback(async (forceRefresh = false) => {
    setIsLoading(true);
    try {
      // Se forceRefresh, adicionar timestamp para evitar cache do browser
      const timestamp = forceRefresh ? `?t=${Date.now()}` : '';
      console.log('[useCustomers] Buscando clientes...', { forceRefresh, timestamp });
      
      const clientsData = await clientService.getAllClients();
      setCustomers(clientsData);
      console.log('[useCustomers] Clientes carregados:', clientsData.length);
    } catch (error) {
      toast({ 
        title: 'Erro ao carregar clientes', 
        description: error.message, 
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Função para criar cliente
  const createCustomer = useCallback(async (customerData) => {
    setIsLoading(true);
    try {
      const newCustomer = await clientService.createClient(customerData);
      toast({ title: 'Sucesso!', description: 'Cliente adicionado com sucesso.' });
      
      // Disparar evento customizado para sincronização
      window.dispatchEvent(new CustomEvent('customerCreated', { 
        detail: { customer: newCustomer } 
      }));
      
      // Aguardar um pequeno delay para garantir que o backend processou
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Forçar refresh da lista
      await fetchCustomers(true);
      
      return newCustomer;
    } catch (error) {
      if (error.message?.includes('409')) {
        toast({ 
          title: 'Cliente já existe', 
          description: 'Já existe um cliente cadastrado com esse telefone.', 
          variant: 'destructive' 
        });
      } else {
        toast({ 
          title: 'Erro ao adicionar cliente', 
          description: error.message, 
          variant: 'destructive' 
        });
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [fetchCustomers, toast]);

  // Função para atualizar cliente
  const updateCustomer = useCallback(async (id, customerData) => {
    setIsLoading(true);
    try {
      const updatedCustomer = await clientService.updateClient(id, customerData);
      toast({ title: 'Sucesso!', description: 'Cliente atualizado com sucesso.' });
      
      // Disparar evento customizado para sincronização
      window.dispatchEvent(new CustomEvent('customerUpdated', { 
        detail: { customer: updatedCustomer } 
      }));
      
      // Aguardar um pequeno delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Forçar refresh da lista
      await fetchCustomers(true);
      
      return updatedCustomer;
    } catch (error) {
      toast({ 
        title: 'Erro ao atualizar cliente', 
        description: error.message, 
        variant: 'destructive' 
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [fetchCustomers, toast]);

  // Função para deletar cliente
  const deleteCustomer = useCallback(async (id) => {
    setIsLoading(true);
    try {
      await clientService.deleteClient(id);
      toast({ title: 'Sucesso!', description: 'Cliente removido com sucesso.' });
      
      // Disparar evento customizado para sincronização
      window.dispatchEvent(new CustomEvent('customerDeleted', { 
        detail: { customerId: id } 
      }));
      
      // Aguardar um pequeno delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Forçar refresh da lista
      await fetchCustomers(true);
    } catch (error) {
      toast({ 
        title: 'Erro ao remover cliente', 
        description: error.message, 
        variant: 'destructive' 
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [fetchCustomers, toast]);

  // Carregar clientes ao montar o componente
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Escutar eventos de mudança de clientes
  useEffect(() => {
    const handleCustomerChange = () => {
      console.log('[useCustomers] Evento de mudança detectado, recarregando clientes...');
      fetchCustomers(true);
    };

    window.addEventListener('customerCreated', handleCustomerChange);
    window.addEventListener('customerUpdated', handleCustomerChange);
    window.addEventListener('customerDeleted', handleCustomerChange);

    return () => {
      window.removeEventListener('customerCreated', handleCustomerChange);
      window.removeEventListener('customerUpdated', handleCustomerChange);
      window.removeEventListener('customerDeleted', handleCustomerChange);
    };
  }, [fetchCustomers]);

  return {
    customers,
    isLoading,
    fetchCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer
  };
};