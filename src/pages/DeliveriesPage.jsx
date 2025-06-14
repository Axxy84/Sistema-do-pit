import React, { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Truck, Users, Clock, CheckCircle, MapPin, Phone } from 'lucide-react';

import DeliverersManager from '@/components/deliverers/DeliverersManager';
import DeliveriesList from '@/components/deliveries/DeliveriesList';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { delivererService } from '@/services/delivererService';
import { orderService } from '@/services/orderService';

const DeliveriesPage = () => {
  const [activeTab, setActiveTab] = useState("deliveriesList");
  const [deliverersList, setDeliverersList] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [isLoadingDeliveries, setIsLoadingDeliveries] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const { toast } = useToast();

  const fetchDeliverers = useCallback(async () => {
    try {
      const deliverersData = await delivererService.getActiveDeliverers();
      setDeliverersList(deliverersData);
    } catch (err) {
      toast({ title: "Erro ao buscar entregadores", description: err.message, variant: "destructive" });
    }
  }, [toast]);
  
  const fetchDeliveries = useCallback(async () => {
    setIsLoadingDeliveries(true);
    try {
      const filters = {};
      if (filterStatus !== 'all') {
        filters.status = filterStatus;
      }
      
      const deliveriesData = await orderService.getAllOrders(filters);
      setDeliveries(deliveriesData);
    } catch (error) {
      toast({ title: 'Erro ao buscar entregas', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoadingDeliveries(false);
    }
  }, [toast, filterStatus]);

  useEffect(() => {
    fetchDeliverers();
    if (activeTab === "deliveriesList") {
      fetchDeliveries();
    }
  }, [fetchDeliverers, fetchDeliveries, activeTab]);

  useEffect(() => {
    const handleOrderStatusChanged = () => {
      if (activeTab === "deliveriesList") {
        fetchDeliveries();
      }
    };
    window.addEventListener('orderStatusChanged', handleOrderStatusChanged);
    return () => {
      window.removeEventListener('orderStatusChanged', handleOrderStatusChanged);
    };
  }, [activeTab, fetchDeliveries]);

  return (
    <div 
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Gestão de Entregas</h1>
          <p className="text-muted-foreground">Gerenciamento de entregas, atribuição e cadastro de entregadores.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-auto">
          <TabsTrigger value="deliveriesList" className="flex items-center gap-2">
            <Truck className="h-4 w-4" /> Lista de Entregas
          </TabsTrigger>
          <TabsTrigger value="deliverersManagement" className="flex items-center gap-2">
            <Users className="h-4 w-4" /> Entregadores
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="deliveriesList">
          <DeliveriesList 
            deliveries={deliveries}
            deliverersList={deliverersList}
            isLoading={isLoadingDeliveries}
            fetchDeliveries={fetchDeliveries}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
          />
        </TabsContent>

        <TabsContent value="deliverersManagement">
          <DeliverersManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DeliveriesPage;