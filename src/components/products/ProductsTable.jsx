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
import { Switch } from '@/components/ui/switch';
import { Edit2, Trash2, Loader2, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '@/lib/utils';

const ProductsTable = ({ products, onEdit, onDelete, onToggleActive, isLoading, pizzaSizes }) => {

  const getDisplayPrice = (product) => {
    if (product.tipo_produto === 'pizza' && product.tamanhos_precos && product.tamanhos_precos.length > 0) {
      const prices = product.tamanhos_precos.map(tp => {
        const sizeName = pizzaSizes.find(s => s.id === tp.id_tamanho)?.name || tp.tamanho || tp.id_tamanho;
        return `${sizeName.split(' ')[0]}: ${formatCurrency(tp.preco)}`;
      });
      return prices.join(' / ');
    }
    if (product.preco_unitario !== null && product.preco_unitario !== undefined) {
      return formatCurrency(product.preco_unitario);
    }
    return 'N/A';
  };

  const getProductTypeDisplayName = (type) => {
    const types = {
      pizza: 'Pizza',
      bebida: 'Bebida',
      sobremesa: 'Sobremesa',
      acompanhamento: 'Acompanhamento',
      outro: 'Outro'
    };
    return types[type] || type;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-muted/20">
            <TableHead className="w-[25%] text-foreground/90">Nome</TableHead>
            <TableHead className="w-[15%] text-foreground/90">Tipo</TableHead>
            <TableHead className="w-[15%] text-foreground/90">Categoria</TableHead>
            <TableHead className="w-[20%] text-foreground/90">Preço(s)</TableHead>
            <TableHead className="w-[10%] text-foreground/90">Estoque</TableHead>
            <TableHead className="w-[5%] text-center text-foreground/90">Ativo</TableHead>
            <TableHead className="w-[10%] text-right text-foreground/90">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <AnimatePresence>
            {products.map((product) => (
              <motion.tr 
                key={product.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`hover:bg-muted/30 transition-colors ${!product.ativo ? 'opacity-60 bg-muted/20 dark:bg-muted/10' : ''}`}
              >
                <TableCell className="font-medium text-foreground">{product.nome}</TableCell>
                <TableCell className="text-foreground/90">{getProductTypeDisplayName(product.tipo_produto)}</TableCell>
                <TableCell className="text-foreground/80">{product.categoria || 'N/A'}</TableCell>
                <TableCell className="text-foreground/90 text-xs">{getDisplayPrice(product)}</TableCell>
                <TableCell className="text-foreground/90">{product.estoque_disponivel !== null ? product.estoque_disponivel : 'N/A'}</TableCell>
                <TableCell className="text-center">
                  <Switch
                    checked={product.ativo}
                    onCheckedChange={() => onToggleActive(product)}
                    aria-label={product.ativo ? "Desativar produto" : "Ativar produto"}
                    className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500"
                    disabled={isLoading}
                  />
                </TableCell>
                <TableCell className="text-right space-x-1">
                  <Button variant="ghost" size="icon" onClick={() => onEdit(product)} className="text-blue-500 hover:text-blue-700 hover:bg-blue-100/50 dark:hover:bg-blue-700/20" disabled={isLoading}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onDelete(product.id)} className="text-red-500 hover:text-red-700 hover:bg-red-100/50 dark:hover:bg-red-700/20" disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </Button>
                </TableCell>
              </motion.tr>
            ))}
          </AnimatePresence>
        </TableBody>
        {products.length > 5 && <TableCaption>Total de {products.length} produtos cadastrados.</TableCaption>}
      </Table>
    </div>
  );
};

export default ProductsTable;