const express = require('express');
const { authenticateOwner } = require('../middleware/ownerAuth');

const router = express.Router();

// GET /api/owner/verify - Verificar se o usuário tem acesso de owner
router.get('/verify', authenticateOwner, async (req, res) => {
  try {
    res.json({
      success: true,
      isOwner: true,
      message: 'Acesso de owner verificado',
      user: {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name || 'Proprietário'
      }
    });
  } catch (error) {
    console.error('Erro ao verificar acesso de owner:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// GET /api/owner/dashboard - Dados específicos do dashboard do owner
router.get('/dashboard', authenticateOwner, async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    // Aqui você pode adicionar dados específicos que só o owner deve ver
    // Como relatórios financeiros detalhados, configurações, etc.
    
    res.json({
      success: true,
      message: 'Dashboard do owner carregado',
      date: targetDate,
      ownerLevel: 'full_access',
      // Adicione aqui dados específicos do owner quando necessário
      restrictedData: {
        message: 'Área exclusiva do proprietário',
        accessLevel: 'owner'
      }
    });
  } catch (error) {
    console.error('Erro ao carregar dashboard do owner:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

module.exports = router;