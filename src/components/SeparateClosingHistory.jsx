import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  LocalShipping as DeliveryIcon,
  Restaurant as MesaIcon,
  Search as SearchIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import axios from 'axios';

const SeparateClosingHistory = () => {
  const [fechamentos, setFechamentos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    data_inicio: '',
    data_fim: ''
  });

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      if (filters.data_inicio) params.append('data_inicio', filters.data_inicio);
      if (filters.data_fim) params.append('data_fim', filters.data_fim);

      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/separate-cash-closing/history?${params}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setFechamentos(response.data.fechamentos || []);
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      setError('Erro ao carregar histórico de fechamentos');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const getTypeInfo = (tipo) => {
    if (tipo === 'delivery') {
      return {
        icon: <DeliveryIcon fontSize="small" />,
        label: 'Delivery',
        color: 'primary'
      };
    } else if (tipo === 'mesa') {
      return {
        icon: <MesaIcon fontSize="small" />,
        label: 'Mesa',
        color: 'success'
      };
    } else {
      return {
        icon: null,
        label: 'Geral',
        color: 'default'
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
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          📋 Histórico de Fechamentos Separados
        </Typography>

        {/* Filtros */}
        <Paper sx={{ p: 2, mb: 3, backgroundColor: '#f8f9fa' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                label="Data Início"
                type="date"
                value={filters.data_inicio}
                onChange={(e) => handleFilterChange('data_inicio', e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Data Fim"
                type="date"
                value={filters.data_fim}
                onChange={(e) => handleFilterChange('data_fim', e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box display="flex" gap={1}>
                <Button
                  variant="contained"
                  startIcon={<SearchIcon />}
                  onClick={handleSearch}
                  size="small"
                >
                  Buscar
                </Button>
                <Button
                  variant="outlined"
                  onClick={clearFilters}
                  size="small"
                >
                  Limpar
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Erro */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Resultados */}
        {fechamentos.length === 0 ? (
          <Alert severity="info">
            Nenhum fechamento separado encontrado no período selecionado.
          </Alert>
        ) : (
          <Box>
            {Object.entries(groupedFechamentos)
              .sort(([a], [b]) => new Date(b) - new Date(a))
              .map(([date, fechamentosData]) => (
                <Box key={date} sx={{ mb: 3 }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      mb: 2, 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1,
                      color: 'primary.main'
                    }}
                  >
                    <CalendarIcon fontSize="small" />
                    {formatDate(date)}
                  </Typography>
                  
                  <TableContainer component={Paper} sx={{ mb: 2 }}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Tipo</TableCell>
                          <TableCell align="center">Pedidos</TableCell>
                          <TableCell align="right">Vendas</TableCell>
                          <TableCell align="right">Descontos</TableCell>
                          <TableCell align="right">Taxa Entrega</TableCell>
                          <TableCell align="right">Saldo Final</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {fechamentosData
                          .sort((a, b) => a.tipo_fechamento.localeCompare(b.tipo_fechamento))
                          .map((fechamento) => {
                            const typeInfo = getTypeInfo(fechamento.tipo_fechamento);
                            return (
                              <TableRow key={fechamento.id}>
                                <TableCell>
                                  <Chip
                                    icon={typeInfo.icon}
                                    label={typeInfo.label}
                                    color={typeInfo.color}
                                    variant="outlined"
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell align="center">
                                  {fechamento.total_pedidos_dia || fechamento.total_pedidos || 0}
                                </TableCell>
                                <TableCell align="right">
                                  {formatCurrency(fechamento.total_vendas)}
                                </TableCell>
                                <TableCell align="right">
                                  {formatCurrency(fechamento.total_descontos)}
                                </TableCell>
                                <TableCell align="right">
                                  {formatCurrency(fechamento.total_taxas_entrega)}
                                </TableCell>
                                <TableCell align="right">
                                  <Typography
                                    color={
                                      parseFloat(fechamento.saldo_final) >= 0 
                                        ? 'success.main' 
                                        : 'error.main'
                                    }
                                    fontWeight="bold"
                                  >
                                    {formatCurrency(fechamento.saldo_final)}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        
                        {/* Linha de Total */}
                        <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                          <TableCell sx={{ fontWeight: 'bold' }}>
                            TOTAL DO DIA
                          </TableCell>
                          <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                            {fechamentosData.reduce((sum, f) => 
                              sum + (f.total_pedidos_dia || f.total_pedidos || 0), 0
                            )}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                            {formatCurrency(
                              fechamentosData.reduce((sum, f) => 
                                sum + parseFloat(f.total_vendas || 0), 0
                              )
                            )}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                            {formatCurrency(
                              fechamentosData.reduce((sum, f) => 
                                sum + parseFloat(f.total_descontos || 0), 0
                              )
                            )}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                            {formatCurrency(
                              fechamentosData.reduce((sum, f) => 
                                sum + parseFloat(f.total_taxas_entrega || 0), 0
                              )
                            )}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                            <Typography
                              color={
                                fechamentosData.reduce((sum, f) => 
                                  sum + parseFloat(f.saldo_final || 0), 0
                                ) >= 0 ? 'success.main' : 'error.main'
                              }
                              fontWeight="bold"
                            >
                              {formatCurrency(
                                fechamentosData.reduce((sum, f) => 
                                  sum + parseFloat(f.saldo_final || 0), 0
                                )
                              )}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default SeparateClosingHistory; 