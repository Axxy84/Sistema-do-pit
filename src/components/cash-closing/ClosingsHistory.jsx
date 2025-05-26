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
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const ClosingsHistory = ({ cashClosings, onPrintReport }) => {
  if (cashClosings.length === 0) {
    return <p className="text-muted-foreground text-center py-4">Nenhum fechamento de caixa registrado.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Data Fechamento</TableHead>
          <TableHead>Total Vendas</TableHead>
          <TableHead>Despesas Extras</TableHead>
          <TableHead>Receitas Extras</TableHead>
          <TableHead>Saldo Final</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {cashClosings.sort((a,b) => new Date(b.date) - new Date(a.date)).map(closing => (
          <TableRow key={closing.id}>
            <TableCell>{new Date(closing.date+'T00:00:00').toLocaleDateString()} (Fechado em: {new Date(closing.closedAt).toLocaleDateString()})</TableCell>
            <TableCell>{formatCurrency(closing.totalSales)}</TableCell>
            <TableCell>{formatCurrency(closing.totalExpenses)}</TableCell>
            <TableCell>{formatCurrency(closing.totalExtraRevenues)}</TableCell>
            <TableCell className="font-semibold">{formatCurrency(closing.netRevenue)}</TableCell>
            <TableCell className="text-right">
              <Button variant="ghost" size="icon" onClick={() => onPrintReport(closing)} className="text-sky-500 hover:text-sky-700"><Printer className="h-4 w-4"/></Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      {cashClosings.length > 5 && <TableCaption>Exibindo {cashClosings.length} fechamentos.</TableCaption>}
    </Table>
  );
};

export default ClosingsHistory;