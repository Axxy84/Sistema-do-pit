import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { PlusCircle, Search, AlertTriangle, Loader2 } from 'lucide-react';

import PizzaForm from '@/components/pizzas/PizzaForm';
import PizzasTable from '@/components/pizzas/PizzasTable';
import { pizzaService } from '@/services/pizzaService';
import { PIZZA_FLAVORS, PIZZA_SIZES } from '@/lib/constants';

const PizzasPage = () => {
  const [pizzas, setPizzas] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentPizza, setCurrentPizza] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const { toast } = useToast();

  const fetchPizzas = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await pizzaService.getAll();
      setPizzas(data || []);
    } catch (error) {
      toast({
        title: 'Erro ao buscar pizzas',
        description: error.message || 'Não foi possível carregar os dados das pizzas.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPizzas();
  }, [fetchPizzas]);

  const resetForm = useCallback(() => {
    setCurrentPizza(null);
  }, []);

  const handleFormOpenChange = useCallback((isOpen) => {
    setIsFormOpen(isOpen);
    if (!isOpen) {
      resetForm();
    }
  }, [resetForm]);

  const handleSavePizza = async (pizzaData) => {
    setIsLoading(true);
    try {
      const dataToSave = {
        sabor: pizzaData.flavor,
        tamanho: pizzaData.size,
        preco: parseFloat(pizzaData.price),
        ingredientes: pizzaData.ingredients.split(',').map(s => s.trim()).filter(s => s).join(', '), // Store as comma-separated string
      };

      if (currentPizza && currentPizza.id) {
        await pizzaService.update(currentPizza.id, dataToSave);
      } else {
        await pizzaService.create(dataToSave);
      }

      toast({ title: 'Sucesso!', description: `Pizza ${currentPizza ? 'atualizada' : 'adicionada'} com sucesso.` });
      fetchPizzas(); // Re-fetch to update list
      setIsFormOpen(false);
      resetForm();

    } catch (error) {
      toast({
        title: `Erro ao ${currentPizza ? 'atualizar' : 'adicionar'} pizza`,
        description: error.message || 'Ocorreu um problema ao salvar a pizza.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = useCallback((pizza) => {
    setCurrentPizza(pizza);
    setIsFormOpen(true);
  }, []);

  const handleDelete = async (id) => {
    setIsLoading(true);
    try {
      await pizzaService.delete(id);
      
      toast({ title: 'Sucesso!', description: 'Pizza removida com sucesso.' });
      fetchPizzas(); // Re-fetch to update list
    } catch (error) {
      toast({
        title: 'Erro ao remover pizza',
        description: error.message || 'Ocorreu um problema ao remover a pizza.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPizzas = pizzas.filter(pizza => {
    const flavorName = PIZZA_FLAVORS.find(f => f.id === pizza.sabor)?.name.toLowerCase() || pizza.sabor?.toLowerCase() || '';
    const sizeName = PIZZA_SIZES.find(s => s.id === pizza.tamanho)?.name.toLowerCase() || pizza.tamanho?.toLowerCase() || '';
    return flavorName.includes(searchTerm.toLowerCase()) || sizeName.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Gerenciamento de Pizzas</h1>
            <p className="text-muted-foreground">Cadastre, edite e visualize os sabores e tamanhos de pizzas.</p>
          </div>
          <Button 
            onClick={() => { setCurrentPizza(null); setIsFormOpen(true); }}
            className="bg-gradient-to-r from-primary to-red-400 hover:from-primary/90 hover:to-red-400/90 text-white shadow-md hover:shadow-lg transition-shadow"
            disabled={isLoading}
          >
            <PlusCircle className="mr-2 h-5 w-5" /> Adicionar Pizza
          </Button>
        </div>
      </div>

      <PizzaForm
        isOpen={isFormOpen}
        onOpenChange={handleFormOpenChange}
        onSubmit={handleSavePizza}
        initialPizzaData={currentPizza}
        isLoading={isLoading}
      />

      <Card className="shadow-xl overflow-hidden bg-card/80 backdrop-blur-sm">
        <CardHeader className="border-b border-border/50 p-4 md:p-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <CardTitle className="text-xl text-primary">Lista de Pizzas</CardTitle>
              <CardDescription className="text-foreground/70">Pizzas cadastradas no sistema.</CardDescription>
            </div>
            <div className="relative w-full md:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                type="search"
                placeholder="Buscar por sabor ou tamanho..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full md:w-72 bg-background/70"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading && pizzas.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : !isLoading && filteredPizzas.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center p-6">
              <AlertTriangle className="w-16 h-16 text-primary/50 mb-4" />
              <h3 className="text-xl font-semibold text-foreground">Nenhuma pizza encontrada</h3>
              <p className="text-muted-foreground">
                {searchTerm ? "Tente refinar sua busca ou " : "Comece adicionando uma nova pizza no botão acima."}
              </p>
            </div>
          ) : (
            <PizzasTable
              pizzas={filteredPizzas}
              onEdit={handleEdit}
              onDelete={handleDelete}
              isLoading={isLoading}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PizzasPage;