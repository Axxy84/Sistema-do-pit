import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Search, Car, Store, Calendar, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { apiClient } from '@/lib/apiClient';
import { formatCurrency } from '@/lib/utils';

const SeparateClosingHistory = ({ selectedDate }) => {
  const [fechamentos, setFechamentos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    data_inicio: '',
    data_fim: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (filters.data_inicio) params.append('data_inicio', filters.data_inicio);
      if (filters.data_fim) params.append('data_fim', filters.data_fim);

      const response = await apiClient.get(`/cash-closing/separate/history?${params}`);
      setFechamentos(response.fechamentos || []);
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar histórico de fechamentos',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const getTypeInfo = (tipo) => {
    if (tipo === 'delivery') {
      return {
        icon: Car,
        label: 'Delivery',
        variant: 'default'
      };
    } else if (tipo === 'mesa') {
      return {
        icon: Store,
        label: 'Mesa',
        variant: 'secondary'
      };
    } else {
      return {
        icon: Calendar,
        label: 'Geral',
        variant: 'outline'
      };
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSearch = () => {
    fetchHistory();
  };

  const clearFilters = () => {
    setFilters({
      data_inicio: '',
      data_fim: ''
    });
    setTimeout(() => fetchHistory(), 100);
  };

  // Agrupar fechamentos por data
  const groupedFechamentos = fechamentos.reduce((acc, fechamento) => {
    const date = fechamento.data_fechamento.split('T')[0];
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(fechamento);
    return acc;
  }, {});

  if (loading && fechamentos.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Carregando histórico...</p>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Histórico de Fechamentos Separados
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filtros */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <label className="text-sm font-medium">Data Início</label>
                <Input
                  type="date"
                  value={filters.data_inicio}
                  onChange={(e) => handleFilterChange('data_inicio', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Data Fim</label>
                <Input
                  type="date"
                  value={filters.data_fim}
                  onChange={(e) => handleFilterChange('data_fim', e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSearch} className="flex-1">
                  <Search className="h-4 w-4 mr-2" />
                  Buscar
                </Button>
                <Button variant="outline" onClick={clearFilters}>
                  Limpar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resultados */}
        {fechamentos.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Nenhum fechamento separado encontrado no período selecionado.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedFechamentos)
              .sort(([a], [b]) => new Date(b) - new Date(a))
              .map(([date, fechamentosData]) => (
                <div key={date} className="space-y-4">
                  <div className="flex items-center gap-2 text-lg font-semibold text-primary">
                    <Calendar className="h-5 w-5" />
                    {formatDate(date)}
                  </div>
                  
                  <Card>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tipo</TableHead>
                            <TableHead className="text-center">Pedidos</TableHead>
                            <TableHead className="text-right">Vendas</TableHead>
                            <TableHead className="text-right">Descontos</TableHead>
                            <TableHead className="text-right">Taxa Entrega</TableHead>
                            <TableHead className="text-right">Saldo Final</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {fechamentosData
                            .sort((a, b) => a.tipo_fechamento.localeCompare(b.tipo_fechamento))
                            .map((fechamento) => {
                              const typeInfo = getTypeInfo(fechamento.tipo_fechamento);
                              const Icon = typeInfo.icon;
                              return (
                                <TableRow key={fechamento.id}>
                                  <TableCell>
                                    <Badge variant={typeInfo.variant} className="flex items-center gap-1 w-fit">
                                      <Icon className="h-3 w-3" />
                                      {typeInfo.label}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {fechamento.total_pedidos_dia || fechamento.total_pedidos || 0}
                                  </TableCell>
                                  <TableCell className="text-right font-medium">
                                    {formatCurrency(fechamento.total_vendas)}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {formatCurrency(fechamento.total_descontos)}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {formatCurrency(fechamento.total_taxas_entrega)}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <span className={`font-bold ${
                                      parseFloat(fechamento.saldo_final) >= 0 
                                        ? 'text-green-600' 
                                        : 'text-red-600'
                                    }`}>
                                      {formatCurrency(fechamento.saldo_final)}
                                    </span>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          
                          {/* Linha de Total */}
                          <TableRow className="bg-muted/50 font-semibold">
                            <TableCell className="font-bold">
                              TOTAL DO DIA
                            </TableCell>
                            <TableCell className="text-center font-bold">
                              {fechamentosData.reduce((sum, f) => 
                                sum + (f.total_pedidos_dia || f.total_pedidos || 0), 0
                              )}
                            </TableCell>
                            <TableCell className="text-right font-bold">
                              {formatCurrency(
                                fechamentosData.reduce((sum, f) => 
                                  sum + parseFloat(f.total_vendas || 0), 0
                                )
                              )}
                            </TableCell>
                            <TableCell className="text-right font-bold">
                              {formatCurrency(
                                fechamentosData.reduce((sum, f) => 
                                  sum + parseFloat(f.total_descontos || 0), 0
                                )
                              )}
                            </TableCell>
                            <TableCell className="text-right font-bold">
                              {formatCurrency(
                                fechamentosData.reduce((sum, f) => 
                                  sum + parseFloat(f.total_taxas_entrega || 0), 0
                                )
                              )}
                            </TableCell>
                            <TableCell className="text-right font-bold">
                              <span className={`${
                                fechamentosData.reduce((sum, f) => 
                                  sum + parseFloat(f.saldo_final || 0), 0
                                ) >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {formatCurrency(
                                  fechamentosData.reduce((sum, f) => 
                                    sum + parseFloat(f.saldo_final || 0), 0
                                  )
                                )}
                              </span>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SeparateClosingHistory; 