import React, { useState } from 'react';
import { useNavigate, useLocation, Link, Navigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LogIn, UserPlus, AlertTriangle, Loader2 } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

const AuthPage = () => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('atendente'); 

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { signInWithPassword, signUp, userRole: authUserRole, session } = useAuth();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const { data, error: authError, profile } = await signInWithPassword(email, password);
      if (authError) {
        let errorMessage = 'Falha no login. Verifique suas credenciais.';
        if (authError.message.includes('Invalid login credentials')) {
          errorMessage = 'E-mail ou senha incorretos.';
        } else if (authError.message.includes('Email not confirmed')) {
          errorMessage = 'Confirme seu e-mail antes de fazer login.';
        } else if (authError.message.includes('Too many requests')) {
          errorMessage = 'Muitas tentativas de login. Tente novamente em alguns minutos.';
        }
        setError(errorMessage);
        toast({ 
          title: 'Erro no Login', 
          description: errorMessage, 
          variant: 'destructive' 
        });
      } else if (data?.session) {
        const welcomeName = profile?.full_name || data.user.email?.split('@')[0];
        toast({ 
          title: 'Login realizado com sucesso!', 
          description: `Bem-vindo de volta, ${welcomeName}!`,
          variant: 'default'
        });
        navigate('/dashboard', { replace: true });
      } else {
         setError('Não foi possível estabelecer a sessão. Tente novamente.');
         toast({ 
           title: 'Erro no Login', 
           description: 'Não foi possível estabelecer a sessão. Tente novamente.',
           variant: 'destructive' 
         });
      }
    } catch (err) {
      console.error('Erro no login:', err);
      setError('Ocorreu um erro inesperado. Tente novamente.');
      toast({ 
        title: 'Erro Inesperado', 
        description: 'Não foi possível completar o login. Tente novamente em alguns instantes.',
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    
    // Validações de entrada
    if (!fullName.trim()) {
      setError('O nome completo é obrigatório.');
      toast({ 
        title: 'Campo Obrigatório', 
        description: 'Por favor, informe seu nome completo.', 
        variant: 'destructive' 
      });
      return;
    }
    
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      toast({ 
        title: 'Erro de Validação', 
        description: 'As senhas digitadas não coincidem.', 
        variant: 'destructive' 
      });
      return;
    }
    
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      toast({ 
        title: 'Senha Muito Curta', 
        description: 'A senha deve ter pelo menos 6 caracteres.', 
        variant: 'destructive' 
      });
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const { data, error: authError, profile } = await signUp(email, password, fullName, role);
      
      if (authError) {
        let errorMessage = 'Falha no cadastro. Verifique os dados informados.';
        let errorTitle = 'Erro no Cadastro';
        
        if (authError.message.includes('already registered') || authError.message.includes('already been registered')) {
          errorMessage = 'Esse e-mail já está cadastrado. Tente fazer login ou use outro e-mail.';
          errorTitle = 'E-mail Já Cadastrado';
        } else if (authError.message.includes('Invalid email')) {
          errorMessage = 'Formato de e-mail inválido. Verifique se digitou corretamente.';
          errorTitle = 'E-mail Inválido';
        } else if (authError.message.includes('Password')) {
          errorMessage = 'A senha não atende aos critérios de segurança.';
          errorTitle = 'Senha Inválida';
        } else if (authError.message.includes('rate limit')) {
          errorMessage = 'Muitas tentativas de cadastro. Aguarde alguns minutos.';
          errorTitle = 'Limite Excedido';
        }
        
        setError(errorMessage);
        toast({ 
          title: errorTitle, 
          description: errorMessage, 
          variant: 'destructive' 
        });
        
      } else if (data?.user) {
        if (!profile) {
          console.warn('Perfil não foi criado imediatamente. Será criado pelo trigger do banco.');
        }
        
        toast({ 
          title: 'Conta Criada com Sucesso!', 
          description: `Bem-vindo, ${fullName}! Sua conta foi criada. Agora você pode fazer login.`,
          variant: 'default'
        });
        
        setIsLoginView(true);
        resetForm();
        
      } else {
        setError('Erro ao criar conta, tente novamente.');
        toast({ 
          title: 'Erro no Cadastro', 
          description: 'Não foi possível criar sua conta. Tente novamente em alguns instantes.',
          variant: 'destructive' 
        });
      }
      
    } catch (err) {
      console.error('Erro crítico no cadastro:', err);
      setError('Ocorreu um erro inesperado durante o cadastro.');
      toast({ 
        title: 'Erro Crítico', 
        description: 'Falha no sistema durante o cadastro. Tente novamente mais tarde ou entre em contato com o suporte.',
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFullName('');
    setRole('atendente');
  };

  const toggleView = () => {
    setIsLoginView(!isLoginView);
    setError('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFullName('');
  };
  
  if (session) {
     return <Navigate to={from} replace />;
  }

  return (
    <div 
      className="flex items-center justify-center min-h-[calc(100vh-10rem)] p-4"
    >
      <Card className="w-full max-w-md shadow-2xl bg-card/90 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="inline-block p-3 bg-primary/10 rounded-full mx-auto mb-4">
            {isLoginView ? <LogIn className="h-10 w-10 text-primary" /> : <UserPlus className="h-10 w-10 text-primary" />}
          </div>
          <CardTitle className="text-3xl font-bold text-primary">
            {isLoginView ? 'Bem-vindo de Volta!' : 'Crie sua Conta'}
          </CardTitle>
          <CardDescription className="text-foreground/70">
            {isLoginView ? 'Acesse sua conta para gerenciar a pizzaria.' : 'Preencha os campos para se registrar.'}
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={isLoginView ? handleLogin : handleSignUp}>
          <CardContent className="space-y-5 p-6">
            {error && (
              <div
                className="bg-destructive/10 border border-destructive/30 text-destructive p-3 rounded-md flex items-start space-x-2"
              >
                <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <p className="text-sm break-words">{error}</p>
              </div>
            )}

            {!isLoginView && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome Completo</Label>
                <Input 
                  id="fullName" 
                  type="text" 
                  placeholder="Seu Nome Completo" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required 
                  className="bg-background/70"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="seu@email.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
                className="bg-background/70"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="********" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                className="bg-background/70"
              />
            </div>

            {!isLoginView && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                  <Input 
                    id="confirmPassword" 
                    type="password" 
                    placeholder="********" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required 
                    className="bg-background/70"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Tipo de Usuário</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger className="w-full bg-background/70">
                      <SelectValue placeholder="Selecione o tipo de usuário" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="atendente">Atendente</SelectItem>
                      <SelectItem value="entregador">Entregador</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-4 p-6">
            <Button 
              type="submit"
              className="w-full bg-gradient-to-r from-primary to-red-400 hover:from-primary/90 hover:to-red-400/90 text-white shadow-md hover:shadow-lg transition-shadow" 
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : (isLoginView ? <LogIn className="mr-2 h-5 w-5" /> : <UserPlus className="mr-2 h-5 w-5" />)}
              {isLoginView ? 'Entrar' : 'Cadastrar'}
            </Button>
            <Button variant="link" type="button" onClick={toggleView} className="text-primary hover:underline">
              {isLoginView ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Faça login'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default AuthPage;