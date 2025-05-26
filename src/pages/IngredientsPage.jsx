import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Package, AlertTriangle, Search, PlusCircle, Edit2, Trash2, Loader2, Plus, Minus, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ingredientService } from '@/services/ingredientService';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import IngredientForm, { UNIDADES_MEDIDA } from '@/components/ingredients/IngredientForm';


const IngredientsPage = () => {
  const [ingredients, setIngredients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentIngredient, setCurrentIngredient] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const { toast } = useToast();

  const fetchIngredients = useCallback(async () => {
    setIsLoading(true);
    try {
      const ingredientsData = await ingredientService.getAllIngredients();
      setIngredients(ingredientsData);
    } catch (error) {
      toast({ 
        title: 'Erro ao carregar ingredientes', 
        description: error.message, 
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchIngredients();
  }, [fetchIngredients]);

  const resetForm = () => {
    setCurrentIngredient(null);
  };

  const handleFormOpenChange = useCallback((isOpen) => {
    setIsFormOpen(isOpen);
    if (!isOpen) {
      resetForm();
    }
  }, [resetForm]);

  const handleSaveIngredient = async (ingredientData) => {
    setIsLoading(true);
    try {
      if (currentIngredient && currentIngredient.id) {
        await ingredientService.updateIngredient(currentIngredient.id, ingredientData);
        toast({ title: 'Sucesso!', description: 'Ingrediente atualizado com sucesso.' });
      } else {
        await ingredientService.createIngredient(ingredientData);
        toast({ title: 'Sucesso!', description: 'Ingrediente adicionado com sucesso.' });
      }

      fetchIngredients();
      setIsFormOpen(false);
      resetForm();
    } catch (error) {
      toast({ 
        title: `Erro ao ${currentIngredient ? 'atualizar' : 'adicionar'} ingrediente`, 
        description: error.message, 
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = useCallback((ingredient) => {
    setCurrentIngredient(ingredient);
    setIsFormOpen(true);
  }, []);

  const handleDelete = async (id) => {
    setIsLoading(true);
    try {
      await ingredientService.deleteIngredient(id);
      toast({ title: 'Sucesso!', description: 'Ingrediente removido com sucesso.' });
      fetchIngredients();
    } catch (error) {
      toast({ 
        title: 'Erro ao remover ingrediente', 
        description: error.message, 
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredIngredients = ingredients.filter(ingredient =>
    ingredient.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getUnidadeMedidaName = (id) => {
    const unidade = UNIDADES_MEDIDA.find(um => um.id === id);
    return unidade ? unidade.name : id;
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
              <Package className="mr-3 h-8 w-8 text-primary"/> Gerenciamento de Ingredientes
            </h1>
            <p className="text-muted-foreground">Cadastre, edite e controle o estoque dos seus ingredientes.</p>
          </div>
          <Button 
            onClick={() => { setCurrentIngredient(null); setIsFormOpen(true); }}
            className="bg-gradient-to-r from-primary to-red-400 hover:from-primary/90 hover:to-red-400/90 text-white shadow-md hover:shadow-lg transition-shadow"
            disabled={isLoading}
          >
            <PlusCircle className="mr-2 h-5 w-5" /> Adicionar Ingrediente
          </Button>
        </div>
      </motion.div>

      <IngredientForm
        isOpen={isFormOpen}
        onOpenChange={handleFormOpenChange}
        onSubmit={handleSaveIngredient}
        initialIngredientData={currentIngredient}
        isLoading={isLoading}
      />

      <div className="relative w-full md:w-1/3 mb-4">
        <Input 
          type="search"
          placeholder="Buscar por nome do ingrediente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 w-full bg-background/70"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
      </div>

      {isLoading && ingredients.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : !isLoading && filteredIngredients.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center p-6 bg-card rounded-lg shadow-md">
          <AlertTriangle className="w-16 h-16 text-primary/50 mb-4" />
          <h3 className="text-xl font-semibold text-foreground">Nenhum ingrediente encontrado</h3>
          <p className="text-muted-foreground">
            {searchTerm ? "Tente refinar sua busca ou " : "Comece adicionando um novo ingrediente no botão acima."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-card rounded-lg shadow-md">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-muted/20">
                <TableHead className="w-[30%] text-foreground/90">Nome</TableHead>
                <TableHead className="w-[15%] text-foreground/90">Unidade</TableHead>
                <TableHead className="w-[15%] text-right text-foreground/90">Qtde. Atual</TableHead>
                <TableHead className="w-[15%] text-right text-foreground/90">Qtde. Mínima</TableHead>
                <TableHead className="w-[15%] text-right text-foreground/90">Custo Unit.</TableHead>
                <TableHead className="w-[10%] text-right text-foreground/90">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {filteredIngredients.map((ingredient) => (
                  <motion.tr 
                    key={ingredient.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={`hover:bg-muted/30 transition-colors ${parseFloat(ingredient.quantidade_atual) <= parseFloat(ingredient.quantidade_minima) ? 'bg-red-500/10 dark:bg-red-700/20 hover:bg-red-500/20 dark:hover:bg-red-700/30' : ''}`}
                  >
                    <TableCell className="font-medium text-foreground">
                      {ingredient.nome}
                      {parseFloat(ingredient.quantidade_atual) <= parseFloat(ingredient.quantidade_minima) && (
                        <AlertTriangle className="inline-block ml-2 h-4 w-4 text-red-500" title="Estoque baixo!"/>
                      )}
                    </TableCell>
                    <TableCell className="text-foreground/90">{getUnidadeMedidaName(ingredient.unidade_medida)}</TableCell>
                    <TableCell className="text-right text-foreground/90">{parseFloat(ingredient.quantidade_atual).toFixed(2)}</TableCell>
                    <TableCell className="text-right text-foreground/90">{parseFloat(ingredient.quantidade_minima).toFixed(2)}</TableCell>
                    <TableCell className="text-right text-foreground/90">{ingredient.custo_unitario ? formatCurrency(ingredient.custo_unitario) : 'N/A'}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(ingredient)} className="text-blue-500 hover:text-blue-700 hover:bg-blue-100/50 dark:hover:bg-blue-700/20" disabled={isLoading}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(ingredient.id)} className="text-red-500 hover:text-red-700 hover:bg-red-100/50 dark:hover:bg-red-700/20" disabled={isLoading}>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </Button>
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </TableBody>
            {filteredIngredients.length > 10 && <TableCaption>Total de {filteredIngredients.length} ingredientes cadastrados.</TableCaption>}
          </Table>
        </div>
      )}
    </div>
  );
};

export default IngredientsPage;