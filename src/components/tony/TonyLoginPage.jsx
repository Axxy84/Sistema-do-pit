import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LogIn, AlertTriangle, Loader2, Shield, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useToast } from '@/components/ui/use-toast';
import { ownerService } from '@/services/ownerService';

const TonyLoginPage = ({ onOwnerVerified }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { signIn } = useAuth();
  const { toast } = useToast();

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Por favor, preencha email e senha.');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      // Primeiro fazer login normal
      const { error: signInError } = await signIn(email, password);
      
      if (signInError) {
        setError(signInError.message || 'Credenciais inválidas.');
        return;
      }

      // Aguardar um pouco para o token ser salvo
      await new Promise(resolve => setTimeout(resolve, 500));

      // Verificar se tem acesso de owner
      const ownerCheck = await ownerService.verifyOwnerAccess();
      
      if (!ownerCheck.success || !ownerCheck.isOwner) {
        // Fazer logout se não for owner
        localStorage.removeItem('authToken');
        
        if (ownerCheck.userLevel === 'employee') {
          setError('❌ Acesso negado. Esta área é restrita ao proprietário da pizzaria.');
          toast({
            title: 'Acesso Negado',
            description: 'Esta área é exclusiva do proprietário.',
            variant: 'destructive'
          });
        } else {
          setError('❌ Erro de autenticação. Verifique suas credenciais.');
          toast({
            title: 'Erro de Autenticação',
            description: 'Verifique suas credenciais.',
            variant: 'destructive'
          });
        }
        return;
      }

      // Sucesso - notificar componente pai
      toast({
        title: '🎉 Acesso Autorizado!',
        description: `Bem-vindo ao Centro Financeiro, ${ownerCheck.user?.name || 'Proprietário'}!`,
        variant: 'default'
      });

      if (onOwnerVerified) {
        onOwnerVerified(ownerCheck.user);
      }

    } catch (error) {
      console.error('Erro no login de owner:', error);
      setError('❌ Erro inesperado. Tente novamente.');
      toast({
        title: 'Erro Inesperado',
        description: 'Tente novamente em alguns instantes.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      className="flex items-center justify-center min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-primary/30 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.7 }}
    >
      <Card className="w-full max-w-md shadow-2xl bg-card/90 backdrop-blur-md border-primary/30">
        <CardHeader className="text-center">
          <div className="inline-block p-4 bg-red-500/10 rounded-full mx-auto mb-4 border-2 border-red-500/50">
            <Shield className="h-12 w-12 text-red-500" />
          </div>
          <CardTitle className="text-3xl font-bold text-red-500">Centro Financeiro</CardTitle>
          <CardDescription className="text-foreground/80">
            Área Restrita ao Proprietário
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-6 p-6">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-destructive/10 border border-destructive/30 text-destructive p-3 rounded-md flex items-start space-x-2"
              >
                <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <p className="text-sm break-words">{error}</p>
              </motion.div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email-tony" className="text-foreground/90">Email do Proprietário</Label>
              <Input 
                id="email-tony" 
                type="email" 
                placeholder="proprietario@pizzaria.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
                className="bg-background/70 border-border focus:border-red-500"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password-tony" className="text-foreground/90">Senha de Acesso</Label>
              <div className="relative">
                <Input 
                  id="password-tony" 
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                  className="bg-background/70 border-border focus:border-red-500 pr-10"
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-8 w-8 p-0"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="p-6">
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-300" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verificando Acesso...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Acessar Centro Financeiro
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </motion.div>
  );
};

export default TonyLoginPage;