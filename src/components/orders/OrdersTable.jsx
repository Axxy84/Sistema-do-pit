import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from '@/components/ui/table';
import { motion, AnimatePresence } from 'framer-motion';
import { ORDER_STATUSES_GENERAL } from '@/lib/constants'; 
import delivererService from '@/services/delivererService';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency } from '@/lib/utils';
import { Truck, Coffee } from 'lucide-react';

const OrdersTable = ({ 
  orders = [], 
  onEdit = () => {}, 
  onDelete = () => {}, 
  onPrint = () => {}, 
  actionsComponent: ActionsComponent = null 
}) => {
  const { toast } = useToast();
  const [deliverers, setDeliverers] = React.useState([]);

  React.useEffect(() => {
    const fetchDeliverers = async () => {
      try {
        const data = await delivererService.getAllDeliverers();
        setDeliverers(data || []);
      } catch (err) {
        toast({ title: "Erro ao buscar entregadores", description: err.message, variant: "destructive" });
      }
    };
    fetchDeliverers();
  }, [toast]);

  const getStatusBadge = (statusId) => {
    const statusInfo = ORDER_STATUSES_GENERAL.find(s => s.id === statusId);
    if (!statusInfo) return <span className={`px-2 py-1 text-xs font-semibold text-white rounded-full bg-gray-400`}>Desconhecido</span>;
    return <span className={`px-2 py-1 text-xs font-semibold text-white rounded-full ${statusInfo.color}`}>{statusInfo.name}</span>;
  };

  const getDelivererName = (delivererId) => {
    const deliverer = deliverers.find(d => d.id === delivererId);
    return deliverer?.nome || 'N/A';
  };

  const getOrderTypeBadge = (order) => {
    if (order.tipo_pedido === 'mesa') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-amber-700 bg-amber-100 rounded-full dark:bg-amber-900/30 dark:text-amber-400">
          <Coffee className="h-3 w-3" />
          Mesa {order.numero_mesa}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-100 rounded-full dark:bg-blue-900/30 dark:text-blue-400">
        <Truck className="h-3 w-3" />
        Delivery
      </span>
    );
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-muted/20">
            <TableHead className="text-foreground/90">ID</TableHead>
            <TableHead className="text-foreground/90">Tipo</TableHead>
            <TableHead className="text-foreground/90">Cliente</TableHead>
            <TableHead className="text-foreground/90">Valor Total</TableHead>
            <TableHead className="text-foreground/90">Entregador</TableHead>
            <TableHead className="text-foreground/90">Status</TableHead>
            <TableHead className="text-foreground/90">Data</TableHead>
            <TableHead className="text-right text-foreground/90">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <AnimatePresence>
            {orders.map((order) => (
              <motion.tr 
                key={order.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="hover:bg-muted/30 transition-colors"
              >
                <TableCell className="font-mono text-xs text-foreground/80">#{order.id.slice(-5).toUpperCase()}</TableCell>
                <TableCell>{getOrderTypeBadge(order)}</TableCell>
                <TableCell className="font-medium text-foreground">{order.customerName}</TableCell>
                <TableCell className="text-foreground/90">{formatCurrency(order.totalValue)}</TableCell>
                <TableCell className="text-foreground/90">
                  {order.tipo_pedido === 'mesa' ? '-' : getDelivererName(order.entregador_id?.id || order.deliverer)}
                </TableCell>
                <TableCell>{getStatusBadge(order.status)}</TableCell>
                <TableCell className="text-foreground/80 text-sm">{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  {/* Render actions passed from OrdersList or default actions */}
                  {order.actions ? order.actions : (
                    ActionsComponent && <ActionsComponent order={order} onEdit={onEdit} onDelete={onDelete} onPrint={onPrint} />
                  )}
                </TableCell>
              </motion.tr>
            ))}
          </AnimatePresence>
        </TableBody>
        {orders.length === 0 && <TableCaption>Nenhum pedido encontrado.</TableCaption>}
        {orders.length > 5 && <TableCaption>Total de {orders.length} pedidos registrados.</TableCaption>}
      </Table>
    </div>
  );
};

export default OrdersTable;