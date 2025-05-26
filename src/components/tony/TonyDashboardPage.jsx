import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const TonyDashboardPage = () => {
  console.log('👑 TonyDashboardPage - Componente renderizado');
  
  const { signOut, session } = useAuth(); 
  const { toast } = useToast();

  console.log('👑 TonyDashboardPage - Estado da sessão:', {
    hasSession: !!session,
    userEmail: session?.user?.email,
    sessionData: session
  });

  useEffect(() => {
    console.log('👑 TonyDashboardPage - useEffect executado');
    
    return () => {
      console.log('👑 TonyDashboardPage - Componente desmontado (cleanup)');
    };
  }, []);

  const handleSignOut = async () => {
    console.log('🚪 TonyDashboardPage - Iniciando logout');
    const { error } = await signOut();
    if (error) {
      console.error('❌ TonyDashboardPage - Erro no logout:', error);
      toast({ title: 'Erro ao Sair', description: error.message, variant: 'destructive' });
    } else {
      console.log('✅ TonyDashboardPage - Logout realizado com sucesso');
      toast({ title: 'Logout Realizado', description: 'Você foi desconectado com sucesso.' });
    }
  };

  const userDisplayName = session?.user?.email ? session.user.email.split('@')[0] : 'Tony';
  console.log('👑 TonyDashboardPage - Nome do usuário:', userDisplayName);

  console.log('✅ TonyDashboardPage - Renderização concluída');

  return (
    <div className="p-4 md:p-8 space-y-8 min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-primary/20">
      <header className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
        <div className="text-center md:text-left">
          <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary via-red-400 to-amber-400">
            Dashboard do Dono
          </h1>
          <p className="text-muted-foreground mt-1 text-lg">
            Bem-vindo, {userDisplayName}! Visão geral e controle total do seu negócio.
          </p>
        </div>
        <Button 
          onClick={handleSignOut} 
          variant="destructive" 
          className="shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800"
        >
          <LogOut className="mr-2 h-5 w-5" /> Sair com Segurança
        </Button>
      </header>

      <div className="bg-card p-6 rounded-lg">
        <h2 className="text-2xl font-semibold text-primary mb-4">Área Administrativa</h2>
        <p className="text-muted-foreground">
          Aqui você terá acesso a relatórios financeiros detalhados, métricas de desempenho e controles administrativos avançados.
        </p>
        <p className="text-muted-foreground mt-2">
          <strong>Em desenvolvimento:</strong> Métricas financeiras, gráficos de vendas e relatórios detalhados.
        </p>
      </div>
      
      <footer className="text-center text-muted-foreground/70 pt-8">
        <p>&copy; {new Date().getFullYear()} Pit Stop Pizzaria - Área do Dono</p>
      </footer>
    </div>
  );
};

export default TonyDashboardPage;