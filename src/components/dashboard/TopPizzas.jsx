import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, AlertTriangle } from 'lucide-react';

const TopPizzas = ({ pizzas, isLoading }) => {
  return (
    <Card className="h-full shadow-lg">
      <CardHeader>
        <CardTitle>Pizzas Mais Pedidas</CardTitle>
        <CardDescription>Sabores que estão fazendo sucesso.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : pizzas.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <AlertTriangle className="w-12 h-12 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Nenhum dado de pizzas mais pedidas.</p>
          </div>
        ) : (
           <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sabor</TableHead>
                <TableHead className="text-right">Qtd. Vendida</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pizzas.map((pizza, index) => (
                <TableRow key={pizza.nome || index}>
                  <TableCell>{pizza.nome || 'Sabor Desconhecido'}</TableCell>
                  <TableCell className="text-right">{pizza.total_vendido}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default TopPizzas;