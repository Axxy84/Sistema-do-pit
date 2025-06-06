import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  TextField,
  Button,
  Paper,
  Chip,
  Divider,
  Alert
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  Save as SaveIcon,
  LocalShipping as DeliveryIcon,
  Restaurant as MesaIcon,
  AttachMoney as MoneyIcon,
  Receipt as ReceiptIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import axios from 'axios';

const SeparateCashClosingForm = ({ 
  tipo, 
  data, 
  selectedDate, 
  onDateChange, 
  onSuccess, 
  loading,
  despesasTotais,
  receitasTotais 
}) => {
  const [observacoes, setObservacoes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [jaFechado, setJaFechado] = useState(false);

  // Verificar se já foi fechado quando os dados mudarem
  useEffect(() => {
    checkIfClosed();
  }, [selectedDate, tipo]);

  const checkIfClosed = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/separate-cash-closing/history?data_inicio=${selectedDate}&data_fim=${selectedDate}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      const fechamentos = response.data.fechamentos || [];
      const fechamentoExiste = fechamentos.some(f => 
        f.data_fechamento.split('T')[0] === selectedDate && 
        f.tipo_fechamento === tipo
      );
      
      setJaFechado(fechamentoExiste);
    } catch (error) {
      console.error('Erro ao verificar fechamento:', error);
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

  const getTypeInfo = () => {
    if (tipo === 'delivery') {
      return {
        icon: <DeliveryIcon />,
        label: 'Delivery',
        color: '#1976d2',
        bgColor: '#e3f2fd'
      };
    } else {
      return {
        icon: <MesaIcon />,
        label: 'Mesa',
        color: '#388e3c',
        bgColor: '#e8f5e8'
      };
    }
  };

  const handleSave = async () => {
    if (!data) {
      setError('Dados não disponíveis para fechamento');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const token = localStorage.getItem('token');
      
      const fechamentoData = {
        tipo_fechamento: tipo,
        data_fechamento: selectedDate,
        total_pedidos: data.total_pedidos,
        total_vendas: data.vendas_liquidas,
        total_despesas_extras: data.total_despesas,
        total_receitas_extras: data.receitas_extras,
        total_descontos: data.descontos_totais,
        total_impostos: 0,
        total_taxas_entrega: data.total_taxas_entrega || 0,
        saldo_final: data.saldo_final,
        observacoes: observacoes,
        vendas_por_metodo: {
          dinheiro: data.vendas_dinheiro,
          cartao: data.vendas_cartao,
          pix: data.vendas_pix
        }
      };

      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/separate-cash-closing/close`,
        fechamentoData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      onSuccess(tipo);
      setObservacoes('');
      setJaFechado(true);

    } catch (error) {
      console.error('Erro ao salvar fechamento:', error);
      const errorMessage = error.response?.data?.error || 'Erro ao salvar fechamento';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (!data) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" color="text.secondary" textAlign="center">
          Carregando dados...
        </Typography>
      </Paper>
    );
  }

  const typeInfo = getTypeInfo();

  return (
    <Box>
      {/* Header do Tipo */}
      <Paper 
        sx={{ 
          p: 2, 
          mb: 3, 
          backgroundColor: typeInfo.bgColor,
          border: `2px solid ${typeInfo.color}20`
        }}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <Box 
            sx={{ 
              color: typeInfo.color,
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {typeInfo.icon}
          </Box>
          <Typography variant="h5" sx={{ color: typeInfo.color, fontWeight: 600 }}>
            Fechamento {typeInfo.label}
          </Typography>
          <Chip 
            label={formatDate(selectedDate)}
            icon={<CalendarIcon />}
            color="primary"
            variant="outlined"
          />
          {jaFechado && (
            <Chip 
              label="JÁ FECHADO"
              color="success"
              variant="filled"
              sx={{ fontWeight: 600 }}
            />
          )}
        </Box>
      </Paper>

      {/* Erro */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Resumo de Vendas */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <ReceiptIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Resumo de Vendas
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Total de Pedidos
                </Typography>
                <Typography variant="h5" color="primary">
                  {data.total_pedidos}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Vendas Brutas
                </Typography>
                <Typography variant="h6">
                  {formatCurrency(data.vendas_brutas)}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Descontos Aplicados
                </Typography>
                <Typography variant="h6" color="error">
                  -{formatCurrency(data.descontos_totais)}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Vendas Líquidas
                </Typography>
                <Typography variant="h5" color="success.main">
                  {formatCurrency(data.vendas_liquidas)}
                </Typography>
              </Box>

              {tipo === 'delivery' && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Taxa de Entrega
                  </Typography>
                  <Typography variant="h6" color="info.main">
                    {formatCurrency(data.total_taxas_entrega)}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Detalhamento por Forma de Pagamento */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <MoneyIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Por Forma de Pagamento
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">Dinheiro</Typography>
                  <Box textAlign="right">
                    <Typography variant="body2" color="text.secondary">
                      {data.pedidos_dinheiro} pedidos
                    </Typography>
                    <Typography variant="h6">
                      {formatCurrency(data.vendas_dinheiro)}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Divider sx={{ my: 1 }} />

              <Box sx={{ mb: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">Cartão</Typography>
                  <Box textAlign="right">
                    <Typography variant="body2" color="text.secondary">
                      {data.pedidos_cartao} pedidos
                    </Typography>
                    <Typography variant="h6">
                      {formatCurrency(data.vendas_cartao)}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Divider sx={{ my: 1 }} />

              <Box sx={{ mb: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">PIX</Typography>
                  <Box textAlign="right">
                    <Typography variant="body2" color="text.secondary">
                      {data.pedidos_pix} pedidos
                    </Typography>
                    <Typography variant="h6">
                      {formatCurrency(data.vendas_pix)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Saldo Final e Extras */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <TrendingUpIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Saldo Final
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} sm={4}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Receitas Extras ({tipo})
                    </Typography>
                    <Typography variant="h6" color="success.main">
                      +{formatCurrency(data.receitas_extras)}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Despesas ({tipo})
                    </Typography>
                    <Typography variant="h6" color="error">
                      -{formatCurrency(data.total_despesas)}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Saldo Final
                    </Typography>
                    <Typography 
                      variant="h4" 
                      color={data.saldo_final >= 0 ? "success.main" : "error.main"}
                      sx={{ fontWeight: 600 }}
                    >
                      {formatCurrency(data.saldo_final)}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Data e Observações */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Finalizar Fechamento
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Data do Fechamento"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => onDateChange(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                    disabled={jaFechado}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Observações (opcional)"
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    multiline
                    rows={3}
                    fullWidth
                    placeholder={`Observações sobre o fechamento ${typeInfo.label.toLowerCase()}...`}
                    disabled={jaFechado}
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 3, textAlign: 'center' }}>
                {!jaFechado ? (
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<SaveIcon />}
                    onClick={handleSave}
                    disabled={saving || loading}
                    sx={{ 
                      minWidth: 200,
                      backgroundColor: typeInfo.color,
                      '&:hover': {
                        backgroundColor: typeInfo.color,
                        opacity: 0.9
                      }
                    }}
                  >
                    {saving ? 'Salvando...' : `Fechar Caixa ${typeInfo.label}`}
                  </Button>
                ) : (
                  <Alert severity="success" sx={{ maxWidth: 400, mx: 'auto' }}>
                    Fechamento de {typeInfo.label.toLowerCase()} já realizado para esta data
                  </Alert>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SeparateCashClosingForm; 