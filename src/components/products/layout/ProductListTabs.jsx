import React from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, AlertTriangle, Loader2, Package, Pizza as PizzaIcon } from 'lucide-react';
import ProductsTable from '@/components/products/ProductsTable';
import { PIZZA_FLAVORS } from '@/lib/constants';

const ProductListTabs = ({
  activeTab,
  setActiveTab,
  searchTerm,
  setSearchTerm,
  products,
  filteredProducts,
  onEdit,
  onDelete,
  onToggleActive,
  isLoading,
  pizzaSizes,
}) => {
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-3 md:w-auto md:inline-flex mb-4">
        <TabsTrigger value="all" className="flex items-center gap-2"><Package className="h-4 w-4"/> Todos</TabsTrigger>
        <TabsTrigger value="pizza" className="flex items-center gap-2"><PizzaIcon className="h-4 w-4"/> Pizzas</TabsTrigger>
        <TabsTrigger value="other" className="flex items-center gap-2"><Package className="h-4 w-4"/> Outros Produtos</TabsTrigger>
      </TabsList>
      
      <Card className="shadow-xl overflow-hidden bg-card/80 backdrop-blur-sm">
        <CardHeader className="border-b border-border/50 p-4 md:p-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <CardTitle className="text-xl text-primary">Lista de Produtos</CardTitle>
              <CardDescription className="text-foreground/70">Produtos cadastrados no sistema.</CardDescription>
            </div>
            <div className="relative w-full md:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                type="search"
                placeholder="Buscar por nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full md:w-72 bg-background/70"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading && products.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : !isLoading && filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center p-6">
              <AlertTriangle className="w-16 h-16 text-primary/50 mb-4" />
              <h3 className="text-xl font-semibold text-foreground">Nenhum produto encontrado</h3>
              <p className="text-muted-foreground">
                {searchTerm ? "Tente refinar sua busca ou " : "Comece adicionando um novo produto no botão acima."}
                {activeTab !== 'all' && ` na aba "${activeTab === 'pizza' ? 'Pizzas' : 'Outros Produtos'}".`}
              </p>
            </div>
          ) : (
            <ProductsTable
              products={filteredProducts}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleActive={onToggleActive}
              isLoading={isLoading}
              pizzaFlavors={PIZZA_FLAVORS} 
              pizzaSizes={pizzaSizes}
            />
          )}
        </CardContent>
      </Card>
    </Tabs>
  );
};

export default ProductListTabs;