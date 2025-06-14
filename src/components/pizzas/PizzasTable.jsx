import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from '@/components/ui/table';
import { Edit2, Trash2, Loader2 } from 'lucide-react';

import { PIZZA_FLAVORS, PIZZA_SIZES } from '@/lib/constants';
import { formatCurrency } from '@/lib/utils';

const PizzasTable = ({ pizzas, onEdit, onDelete, isLoading }) => {
  const getFlavorName = (id) => PIZZA_FLAVORS.find(f => f.id === id)?.name || id;
  const getSizeName = (id) => PIZZA_SIZES.find(s => s.id === id)?.name || id;

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-muted/20">
            <TableHead className="w-[30%] text-foreground/90">Sabor</TableHead>
            <TableHead className="w-[25%] text-foreground/90">Tamanho</TableHead>
            <TableHead className="w-[20%] text-foreground/90">Ingredientes</TableHead>
            <TableHead className="w-[10%] text-foreground/90">Preço</TableHead>
            <TableHead className="w-[15%] text-right text-foreground/90">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
            {pizzas.map((pizza) => (
              <motion.tr 
                key={pizza.id}
                layout
                className="hover:bg-muted/30 transition-colors"
              >
                <TableCell className="font-medium text-foreground">{getFlavorName(pizza.sabor)}</TableCell>
                <TableCell className="text-foreground/90">{getSizeName(pizza.tamanho)}</TableCell>
                <TableCell className="text-foreground/80 text-xs truncate max-w-xs">{pizza.ingredientes || 'N/A'}</TableCell>
                <TableCell className="text-foreground/90">{formatCurrency(pizza.preco)}</TableCell>
                <TableCell className="text-right space-x-1">
                  <Button variant="ghost" size="icon" onClick={() => onEdit(pizza)} className="text-blue-500 hover:text-blue-700 hover:bg-blue-100/50 dark:hover:bg-blue-700/20" disabled={isLoading}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onDelete(pizza.id)} className="text-red-500 hover:text-red-700 hover:bg-red-100/50 dark:hover:bg-red-700/20" disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </Button>
                </TableCell>
              </motion.tr>
            ))}
        </TableBody>
        {pizzas.length > 5 && <TableCaption>Total de {pizzas.length} pizzas cadastradas.</TableCaption>}
      </Table>
    </div>
  );
};

export default PizzasTable;