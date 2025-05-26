import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Pizza, ShoppingCart, Users, Truck, BarChart2, DollarSign, LogIn, LogOut, Sun, Moon, Package, Settings, ShieldCheck, Loader2, Warehouse, BadgePercent as TicketPercent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useTheme } from '@/contexts/ThemeProvider.jsx'; 
import { useAuth } from '@/contexts/AuthContext.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { useRouteLogger } from '@/hooks/useRouteLogger';
import { useAuthLogger } from '@/hooks/useAuthLogger';

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Dashboard', adminOnly: false, allowedRoles: ['admin', 'atendente', 'entregador'] },
  { href: '/produtos', icon: Package, label: 'Produtos', adminOnly: false, allowedRoles: ['admin', 'atendente'] },
  { href: '/ingredientes', icon: Warehouse, label: 'Ingredientes', adminOnly: false, allowedRoles: ['admin', 'atendente'] },
  { href: '/pedidos', icon: ShoppingCart, label: 'Pedidos', adminOnly: false, allowedRoles: ['admin', 'atendente'] },
  { href: '/clientes', icon: Users, label: 'Clientes', adminOnly: false, allowedRoles: ['admin', 'atendente'] },
  { href: '/entregas', icon: Truck, label: 'Entregas', adminOnly: false, allowedRoles: ['admin', 'atendente', 'entregador'] },
  { href: '/fechamento-caixa', icon: DollarSign, label: 'Fechamento de Caixa', adminOnly: false, allowedRoles: ['admin', 'atendente'] },
  { href: '/relatorios', icon: BarChart2, label: 'Relatórios', adminOnly: true, allowedRoles: ['admin'] },
  { href: '/cupons', icon: TicketPercent, label: 'Cupons', adminOnly: true, allowedRoles: ['admin'] },
  { href: '/tony', icon: ShieldCheck, label: 'Área do Dono', adminOnly: true, allowedRoles: ['admin'] },
];

const Layout = ({ children }) => {
  console.log('🏗️ Layout - Iniciando renderização');
  
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { session, signOut, userRole, loading: authLoading, user, userProfile } = useAuth();
  const { toast } = useToast();
  const logoUrl = "https://storage.googleapis.com/hostinger-horizons-assets-prod/4ef0826d-37c9-4595-aa25-5fd60b9607f9/3c06c8f178277b565847dec6973b756e.jpg";

  // Hooks de logging
  useRouteLogger();
  useAuthLogger();

  console.log('🏗️ Layout - Estado atual:', {
    currentPath: location.pathname,
    hasSession: !!session,
    userRole: userRole,
    authLoading: authLoading,
    theme: theme
  });

  const toggleTheme = () => {
    console.log('🎨 Layout - Alternando tema de', theme, 'para', theme === 'light' ? 'dark' : 'light');
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleSignOut = async () => {
    console.log('🚪 Layout - Iniciando logout');
    const { error } = await signOut();
    if (error) {
      console.error('❌ Layout - Erro no logout:', error);
      toast({ title: 'Erro ao Sair', description: error.message, variant: 'destructive' });
    } else {
      console.log('✅ Layout - Logout realizado com sucesso');
      toast({ title: 'Logout Realizado', description: 'Você foi desconectado com sucesso.' });
      navigate('/login'); 
    }
  };

  const handleNavClick = (item) => {
    console.log('🔗 Layout - Clique na navegação:', {
      href: item.href,
      label: item.label,
      currentPath: location.pathname,
      userRole: userRole,
      hasPermission: item.allowedRoles.includes(userRole)
    });
  };
  
  const isAdminRoute = location.pathname.startsWith('/tony') || location.pathname.startsWith('/cupons') || location.pathname.startsWith('/relatorios');
  
  const SidebarContent = () => {
    console.log('📋 Layout - Renderizando SidebarContent');
    
    return (
      <div className="flex flex-col h-full">
        <div className="p-6 border-b border-border">
          <Link to="/dashboard" className="flex items-center gap-2" onClick={() => console.log('🏠 Layout - Clique no logo, navegando para dashboard')}>
            <img alt="Pit Stop Pizzaria Logo" width="160" height="40" className="object-contain" src={logoUrl} />
          </Link>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const hasPermission = item.allowedRoles && item.allowedRoles.includes(userRole);
            
            if (!hasPermission) {
              console.log('🚫 Layout - Item de navegação oculto por falta de permissão:', {
                item: item.label,
                userRole: userRole,
                requiredRoles: item.allowedRoles
              });
              return null;
            }

            return (
              <Link
                key={item.label}
                to={item.href}
                onClick={() => handleNavClick(item)}
                className={`flex items-center px-4 py-3 rounded-lg transition-colors duration-150 ease-in-out group
                  ${location.pathname.startsWith(item.href)
                    ? 'bg-primary/10 text-primary font-semibold shadow-sm dark:bg-primary/20'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground dark:hover:bg-muted/20'
                  }`}
              >
                <item.icon className={`w-5 h-5 mr-3 transition-transform duration-200 ease-out group-hover:scale-110 
                  ${location.pathname.startsWith(item.href) ? 'text-primary' : ''}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 mt-auto border-t border-border">
          <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground">
            <Settings className="w-5 h-5 mr-3" />
            Configurações
          </Button>
          <Button variant="ghost" onClick={toggleTheme} className="w-full justify-start text-muted-foreground hover:text-foreground mt-2">
            {theme === 'light' ? <Moon className="w-5 h-5 mr-3" /> : <Sun className="w-5 h-5 mr-3" />}
            {theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}
          </Button>
          {session ? (
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className="flex items-center px-4 py-3 mt-2 w-full justify-start rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground dark:hover:bg-muted/20 group"
            >
              <LogOut className="w-5 h-5 mr-3 group-hover:scale-110" />
              Sair
            </Button>
          ) : (
             <Link
                  to="/login"
                  onClick={() => console.log('🔑 Layout - Clique no botão de login')}
                  className="flex items-center px-4 py-3 mt-2 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground dark:hover:bg-muted/20 group"
                >
                <LogIn className="w-5 h-5 mr-3 group-hover:scale-110" />
                Login
              </Link>
          )}
        </div>
      </div>
    );
  };
  
  // Determine if the layout shell (sidebar, header) should be shown
  // It should NOT be shown on the login page.
  // It should also NOT be shown on admin-only routes if the user is not an admin AND not loading.
  const showLayoutShell = location.pathname !== '/login';
  
  console.log('🏗️ Layout - Decisões de renderização:', {
    showLayoutShell: showLayoutShell,
    authLoading: authLoading,
    currentPath: location.pathname
  });
  
  if (authLoading && location.pathname !== '/login') { 
    console.log('⏳ Layout - Mostrando tela de carregamento de autenticação');
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-muted/20 dark:from-slate-900 dark:to-primary/10">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  console.log('✅ Layout - Renderização concluída, renderizando layout principal');

  return (
    <div className="flex h-screen bg-background text-foreground">
      {showLayoutShell && (
        <aside className="hidden lg:block w-72 border-r border-border/60 shadow-md dark:border-border/20">
          <SidebarContent />
        </aside>
      )}
      <div className="flex-1 flex flex-col overflow-hidden">
      {showLayoutShell && (
        <header className="flex items-center justify-between h-16 px-6 border-b border-border/60 dark:border-border/20 lg:justify-end">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="lg:hidden" onClick={() => console.log('📱 Layout - Abrindo menu mobile')}>
                <Home className="h-6 w-6" />
                <span className="sr-only">Abrir menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SidebarContent />
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden md:inline">
              {userProfile?.full_name ? `Bem-vindo, ${userProfile.full_name.split(' ')[0]}!` : (user ? `Bem-vindo!` : 'Bem-vindo!')}
            </span>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-red-400 flex items-center justify-center text-primary-foreground font-semibold">
              {userProfile?.full_name ? userProfile.full_name.charAt(0).toUpperCase() : (user ? user.email.charAt(0).toUpperCase() : 'U')}
            </div>
          </div>
        </header>
      )}
        <main className={`flex-1 overflow-y-auto ${showLayoutShell ? 'p-6 md:p-8' : ''} bg-gradient-to-br from-background to-muted/20 dark:from-background dark:to-slate-900/30`}>
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default Layout;