import React from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, AlertTriangle, Loader2, Package, Pizza as PizzaIcon, Beer, Cookie, Utensils, Archive } from 'lucide-react';
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
  // Contar produtos por categoria para exibir nos badges
  const pizzaCount = products.filter(p => p.tipo_produto === 'pizza').length;
  const bebidaCount = products.filter(p => p.tipo_produto === 'bebida').length;
  const sobremesaCount = products.filter(p => p.tipo_produto === 'sobremesa').length;
  const acompanhamentoCount = products.filter(p => p.tipo_produto === 'acompanhamento').length;
  const bordaCount = products.filter(p => p.tipo_produto === 'borda').length;
  const outroCount = products.filter(p => p.tipo_produto === 'outro').length;

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2 lg:grid-cols-7 md:w-auto md:inline-flex mb-4 bg-muted/50">
        <TabsTrigger value="all" className="flex items-center gap-2 text-xs md:text-sm">
          <Package className="h-4 w-4"/> 
          Todos
          <span className="ml-1 px-2 py-1 bg-primary/20 text-primary rounded-full text-xs font-medium">
            {products.length}
          </span>
        </TabsTrigger>
        <TabsTrigger value="pizza" className="flex items-center gap-2 text-xs md:text-sm">
          <PizzaIcon className="h-4 w-4"/> 
          Pizzas
          <span className="ml-1 px-2 py-1 bg-orange-500/20 text-orange-600 rounded-full text-xs font-medium">
            {pizzaCount}
          </span>
        </TabsTrigger>
        <TabsTrigger value="bebida" className="flex items-center gap-2 text-xs md:text-sm">
          <Beer className="h-4 w-4"/> 
          Bebidas
          <span className="ml-1 px-2 py-1 bg-blue-500/20 text-blue-600 rounded-full text-xs font-medium">
            {bebidaCount}
          </span>
        </TabsTrigger>
        <TabsTrigger value="sobremesa" className="flex items-center gap-2 text-xs md:text-sm">
          <Cookie className="h-4 w-4"/> 
          Sobremesas
          <span className="ml-1 px-2 py-1 bg-pink-500/20 text-pink-600 rounded-full text-xs font-medium">
            {sobremesaCount}
          </span>
        </TabsTrigger>
        <TabsTrigger value="acompanhamento" className="flex items-center gap-2 text-xs md:text-sm">
          <Utensils className="h-4 w-4"/> 
          Acompanhamentos
          <span className="ml-1 px-2 py-1 bg-green-500/20 text-green-600 rounded-full text-xs font-medium">
            {acompanhamentoCount}
          </span>
        </TabsTrigger>
        <TabsTrigger value="borda" className="flex items-center gap-2 text-xs md:text-sm">
          <Archive className="h-4 w-4"/> 
          Bordas
          <span className="ml-1 px-2 py-1 bg-yellow-500/20 text-yellow-600 rounded-full text-xs font-medium">
            {bordaCount}
          </span>
        </TabsTrigger>
        <TabsTrigger value="outro" className="flex items-center gap-2 text-xs md:text-sm">
          <Package className="h-4 w-4"/> 
          Outros
          <span className="ml-1 px-2 py-1 bg-gray-500/20 text-gray-600 rounded-full text-xs font-medium">
            {outroCount}
          </span>
        </TabsTrigger>
      </TabsList>
      
      <Card className="shadow-xl overflow-hidden bg-card/80 backdrop-blur-sm">
        <CardHeader className="border-b border-border/50 p-4 md:p-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <CardTitle className="text-xl text-primary flex items-center gap-2">
                {activeTab === 'pizza' && <><PizzaIcon className="h-5 w-5 text-orange-600"/> Pizzas</>}
                {activeTab === 'bebida' && <><Beer className="h-5 w-5 text-blue-600"/> Bebidas</>}
                {activeTab === 'sobremesa' && <><Cookie className="h-5 w-5 text-pink-600"/> Sobremesas</>}
                {activeTab === 'acompanhamento' && <><Utensils className="h-5 w-5 text-green-600"/> Acompanhamentos</>}
                {activeTab === 'borda' && <><Archive className="h-5 w-5 text-yellow-600"/> Bordas Recheadas</>}
                {activeTab === 'outro' && <><Package className="h-5 w-5 text-gray-600"/> Outros Produtos</>}
                {activeTab === 'all' && <><Package className="h-5 w-5"/> Todos os Produtos</>}
                <span className="text-sm font-normal text-muted-foreground">
                  ({filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'itens'})
                </span>
              </CardTitle>
              <CardDescription className="text-foreground/70">
                {activeTab === 'pizza' && 'Pizzas com diferentes tamanhos e sabores'}
                {activeTab === 'bebida' && 'Refrigerantes, sucos, águas e cervejas'}
                {activeTab === 'sobremesa' && 'Doces, tortas e sobremesas especiais'}
                {activeTab === 'acompanhamento' && 'Porções e molhos para acompanhar'}
                {activeTab === 'borda' && 'Bordas recheadas para suas pizzas'}
                {activeTab === 'outro' && 'Itens diversos e complementares'}
                {activeTab === 'all' && 'Todos os produtos cadastrados no sistema'}
              </CardDescription>
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