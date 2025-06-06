const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// POST /api/profit-calculator - Calcular lucro/prejuízo diário
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      vendas_brutas,
      descontos,
      impostos,
      taxas_entrega,
      receitas_extras,
      despesas_extras,
      despesas_fixas
    } = req.body;

    // Validação básica
    if (vendas_brutas === undefined) {
      return res.status(400).json({ 
        error: 'vendas_brutas é obrigatório' 
      });
    }

    // Preparar dados para o script Python
    const inputData = {
      vendas_brutas: vendas_brutas || 0,
      descontos: descontos || 0,
      impostos: impostos || 0,
      taxas_entrega: taxas_entrega || 0,
      receitas_extras: receitas_extras || 0,
      despesas_extras: despesas_extras || 0,
      despesas_fixas: despesas_fixas || 0
    };

    // Caminho para o script Python
    const scriptPath = path.join(__dirname, '../../analytics/profit_calculator.py');
    
    // Executar script Python
    const pythonProcess = spawn('python3', [scriptPath]);
    
    let result = '';
    let error = '';

    // Enviar dados para o processo Python
    pythonProcess.stdin.write(JSON.stringify(inputData));
    pythonProcess.stdin.end();

    // Coletar resultado
    pythonProcess.stdout.on('data', (data) => {
      result += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('Erro no script Python:', error);
        return res.status(500).json({
          error: 'Erro no cálculo de lucro/prejuízo',
          details: error
        });
      }

      try {
        const calculationResult = JSON.parse(result);
        res.json(calculationResult);
      } catch (parseError) {
        console.error('Erro ao fazer parse do resultado:', parseError);
        res.status(500).json({
          error: 'Erro ao processar resultado do cálculo',
          details: parseError.message
        });
      }
    });

  } catch (error) {
    console.error('Erro na rota profit-calculator:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

module.exports = router;