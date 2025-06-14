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
import { Badge } from '@/components/ui/badge';
import { Edit2, Trash2, Loader2, Package, AlertTriangle } from 'lucide-react';

import { formatCurrency } from '@/lib/utils';

const ProductsTable = ({ products, onEdit, onDelete, onToggleActive, isLoading, pizzaSizes }) => {

  const getDisplayPrice = (product) => {
    console.log(`Produto: ${product.nome}, tipo: ${product.tipo_produto}, preço: ${product.preco_unitario}, tipo do preço: ${typeof product.preco_unitario}`);
    
    if (product.tipo_produto === 'pizza' && product.tamanhos_precos && product.tamanhos_precos.length > 0) {
      const prices = product.tamanhos_precos.map(tp => {
        const preco = Number.isFinite(Number(tp.preco)) ? Number(tp.preco) : 0;
        const sizeName = pizzaSizes.find(s => s.id === tp.id_tamanho)?.name || tp.tamanho || tp.id_tamanho;
        return `${sizeName.split(' ')[0]}: ${formatCurrency(preco)}`;
      });
      return prices.join(' / ');
    }
    
    if (product.preco_unitario !== null && product.preco_unitario !== undefined) {
      // Garantir que o preço seja convertido para número mesmo que seja string
      const precoNumerico = Number(product.preco_unitario);
      if (!isNaN(precoNumerico)) {
        return formatCurrency(precoNumerico);
      }
    }
    
    return 'R$ 0,00';
  };

  const getProductTypeDisplayName = (type) => {
    const types = {
      pizza: { name: 'Pizza', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
      bebida: { name: 'Bebida', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
      sobremesa: { name: 'Sobremesa', color: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200' },
      acompanhamento: { name: 'Acompanhamento', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
      borda: { name: 'Borda Recheada', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
      outro: { name: 'Outro', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' }
    };
    return types[type] || { name: type, color: 'bg-gray-100 text-gray-800' };
  };

  const getStockStatus = (estoque) => {
    if (estoque === null || estoque === undefined) return { text: 'N/A', color: 'bg-gray-100 text-gray-800' };
    if (estoque <= 0) return { text: 'Sem estoque', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' };
    if (estoque <= 5) return { text: `${estoque} unidades`, color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' };
    return { text: `${estoque} unidades`, color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' };
  };

  if (!products || products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Package className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum produto encontrado</h3>
        <p className="text-muted-foreground">Adicione produtos para começar a gerenciar seu catálogo.</p>
      </div>
    );
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
            {products.map((product) => (
              <TableRow 
                key={product.id}
                className={`hover:bg-muted/30 transition-colors ${!product.ativo ? 'opacity-60 bg-muted/20 dark:bg-muted/10' : ''}`}
              >
                <TableCell className="font-medium text-foreground">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    {product.nome}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={getProductTypeDisplayName(product.tipo_produto).color}>
                    {getProductTypeDisplayName(product.tipo_produto).name}
                  </Badge>
                </TableCell>
                <TableCell className="text-foreground/80">{product.categoria || 'N/A'}</TableCell>
                <TableCell className="text-foreground/90 text-sm font-mono">{getDisplayPrice(product)}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={getStockStatus(product.estoque_disponivel).color}>
                    {getStockStatus(product.estoque_disponivel).text}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Switch
                    checked={product.ativo}
                    onCheckedChange={() => onToggleActive(product)}
                    aria-label={product.ativo ? "Desativar produto" : "Ativar produto"}
                    className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500"
                    disabled={isLoading}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => onEdit(product)} 
                      className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-100/50 dark:hover:bg-blue-700/20" 
                      disabled={isLoading}
                      title="Editar produto"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => onDelete(product.id)} 
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-100/50 dark:hover:bg-red-700/20" 
                      disabled={isLoading}
                      title="Excluir produto"
                    >
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                    {!product.ativo && (
                      <AlertTriangle className="h-4 w-4 text-amber-500 ml-1" title="Produto inativo" />
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
        {products.length > 5 && <TableCaption>Total de {products.length} produtos cadastrados.</TableCaption>}
      </Table>
    </div>
  );
};

export default ProductsTable;