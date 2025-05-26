import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Truck, AlertTriangle, Edit2, Loader2, Filter } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { ORDER_STATUSES_GENERAL } from '@/lib/constants';

const DeliveriesList = ({ deliveries, deliverersList, isLoading, fetchDeliveries, filterStatus, setFilterStatus }) => {
  const [editingDeliveryId, setEditingDeliveryId] = useState(null);
  const [selectedDeliverer, setSelectedDeliverer] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleEdit = (delivery) => {
    setEditingDeliveryId(delivery.id);
    setSelectedDeliverer(delivery.entregador_id?.id || 'none');
    setSelectedStatus(delivery.status_pedido);
  };

  const handleCancelEdit = () => {
    setEditingDeliveryId(null);
    setSelectedDeliverer('');
    setSelectedStatus('');
  };

  const handleSave = async (deliveryId) => {
    setIsSaving(true);
    try {
      const updateData = {
        entregador_id: selectedDeliverer === 'none' ? null : selectedDeliverer,
        status_pedido: selectedStatus,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('pedidos')
        .update(updateData)
        .eq('id', deliveryId);
      
      if (error) throw error;
      toast({ title: 'Sucesso!', description: 'Entrega atualizada.' });
      fetchDeliveries();
      handleCancelEdit();
      window.dispatchEvent(new CustomEvent('orderStatusChanged', { detail: { orderId: deliveryId, newStatus: selectedStatus } }));
    } catch (error) {
      toast({ title: 'Erro ao atualizar entrega', description: error.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };
  
  const getStatusBadge = (statusId) => {
    const statusInfo = ORDER_STATUSES_GENERAL.find(s => s.id === statusId);
    if (!statusInfo) return <span className="px-2 py-1 text-xs font-semibold text-white rounded-full bg-gray-400">Desconhecido</span>;
    return <span className={`px-2 py-1 text-xs font-semibold text-white rounded-full ${statusInfo.color}`}>{statusInfo.name}</span>;
  };

  return (
    <Card className="shadow-lg mt-4">
      <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
        <div>
          <CardTitle className="flex items-center text-primary">
            <Truck className="mr-2 h-6 w-6" />
            Pedidos para Entrega
          </CardTitle>
          <CardDescription>Pedidos prontos para entrega ou em trânsito.</CardDescription>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="h-5 w-5 text-muted-foreground" />
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full md:w-[180px] bg-background/70">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Status</SelectItem>
              {ORDER_STATUSES_GENERAL.filter(s => s.id !== 'entregue' && s.id !== 'cancelado').map(status => (
                <SelectItem key={status.id} value={status.id}>{status.name}</SelectItem>
              ))}
              <SelectItem value="entregue">Entregue</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && deliveries.length === 0 ? (
           <div className="flex items-center justify-center h-64">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : !isLoading && deliveries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <AlertTriangle className="w-16 h-16 text-yellow-500 mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Nenhuma entrega encontrada</h2>
            <p className="text-muted-foreground max-w-md">
              {filterStatus === 'all' ? 'Não há pedidos para entrega no momento.' : `Não há pedidos com o status "${ORDER_STATUSES_GENERAL.find(s => s.id === filterStatus)?.name}".`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pedido ID</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Endereço</TableHead>
                  <TableHead>Entregador</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveries.map((delivery) => (
                  <TableRow key={delivery.id}>
                    <TableCell className="font-mono text-xs">#{delivery.id.slice(-5)}</TableCell>
                    <TableCell>{delivery.cliente_id?.nome || 'N/A'}</TableCell>
                    <TableCell>{delivery.cliente_id?.endereco || 'N/A'}</TableCell>
                    <TableCell>
                      {editingDeliveryId === delivery.id ? (
                        <Select value={selectedDeliverer} onValueChange={setSelectedDeliverer} disabled={isSaving}>
                          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Não atribuir</SelectItem>
                            {deliverersList.map(d => <SelectItem key={d.id} value={d.id}>{d.nome}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      ) : (
                        delivery.entregador_id?.nome || 'Não atribuído'
                      )}
                    </TableCell>
                    <TableCell>
                      {editingDeliveryId === delivery.id ? (
                        <Select value={selectedStatus} onValueChange={setSelectedStatus} disabled={isSaving}>
                          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>
                            {ORDER_STATUSES_GENERAL.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      ) : (
                        getStatusBadge(delivery.status_pedido)
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {editingDeliveryId === delivery.id ? (
                        <div className="space-x-2">
                          <Button size="sm" onClick={() => handleSave(delivery.id)} disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Salvar
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancelEdit} disabled={isSaving}>Cancelar</Button>
                        </div>
                      ) : (
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(delivery)} className="text-blue-500 hover:text-blue-700">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DeliveriesList;