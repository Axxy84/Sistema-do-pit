import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LogIn, AlertTriangle, Loader2, Shield, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const TonyLoginPageDirect = ({ onOwnerVerified }) => {
  const [email, setEmail] = useState('admin@pizzaria.com'); // Pre-filled
  const [password, setPassword] = useState('admin123'); // Pre-filled
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

      console.log('🔄 Fazendo login direto...');

      // Login direto via fetch
      const response = await fetch('http://localhost:3001/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro no login');
      }

      // Salvar token
      const { token, user } = data;
      localStorage.setItem('authToken', token);
      localStorage.setItem('userProfile', JSON.stringify(user));

      console.log('✅ Login realizado, verificando acesso owner...');

      // Verificar acesso owner
      const ownerResponse = await fetch('http://localhost:3001/api/owner/verify', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      const ownerData = await ownerResponse.json();

      if (!ownerResponse.ok || !ownerData.success || !ownerData.isOwner) {
        // Limpar token se não for owner
        localStorage.removeItem('authToken');
        localStorage.removeItem('userProfile');
        
        setError('❌ Acesso negado. Esta área é restrita ao proprietário da pizzaria.');
        toast({
          title: 'Acesso Negado',
          description: 'Esta área é exclusiva do proprietário.',
          variant: 'destructive'
        });
        return;
      }

      // Sucesso!
      toast({
        title: '🎉 Acesso Autorizado!',
        description: `Bem-vindo ao Centro Financeiro, ${user?.name || 'Proprietário'}!`,
        variant: 'default'
      });

      if (onOwnerVerified) {
        onOwnerVerified(user);
      }

    } catch (error) {
      console.error('❌ Erro no login de owner:', error);
      setError(`❌ Erro: ${error.message}`);
      toast({
        title: 'Erro no Login',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="flex items-center justify-center min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-red-900/30 p-4"
    >
      <Card className="w-full max-w-md shadow-2xl bg-card/90 backdrop-blur-md border-red-500/30">
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
              <div
                className="bg-destructive/10 border border-destructive/30 text-destructive p-3 rounded-md flex items-start space-x-2"
              >
                <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <p className="text-sm break-words">{error}</p>
              </div>
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
            <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950/30 p-3 rounded-md border border-blue-200 dark:border-blue-800">
              <p>✅ <strong>Credenciais pré-preenchidas</strong></p>
              <p>• Email: admin@pizzaria.com</p>  
              <p>• Senha: admin123</p>
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
    </div>
  );
};

export default TonyLoginPageDirect;