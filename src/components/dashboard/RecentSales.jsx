import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { ORDER_STATUSES_GENERAL } from '@/lib/constants';

const RecentSales = ({ orders, isLoading }) => {
  const getStatusBadge = (statusId) => {
    const statusInfo = ORDER_STATUSES_GENERAL.find(s => s.id === statusId);
    if (!statusInfo) return null;
    return <span className={`px-2 py-1 text-xs font-semibold text-white rounded-full ${statusInfo.color}`}>{statusInfo.name}</span>;
  };

  return (
    <Card className="h-full shadow-lg">
      <CardHeader>
        <CardTitle>Vendas Recentes</CardTitle>
        <CardDescription>Últimos 5 pedidos registrados.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <AlertTriangle className="w-12 h-12 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Nenhum pedido recente encontrado.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map(order => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-xs">#{String(order.id).slice(-5)}</TableCell>
                  <TableCell>{order.customerName || order.cliente_id?.nome || 'N/A'}</TableCell>
                  <TableCell>{getStatusBadge(order.status_pedido || 'entregue')}</TableCell>
                  <TableCell className="text-right">{formatCurrency(order.total || 0)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentSales;