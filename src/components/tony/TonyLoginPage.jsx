import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LogIn, AlertTriangle, Loader2, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useToast } from '@/components/ui/use-toast';

const TonyLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { signInWithPassword, TONY_EMAIL } = useAuth();
  const { toast } = useToast();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (email.toLowerCase() !== TONY_EMAIL) {
      setError('Acesso negado. Este email não pertence ao administrador.');
      setIsLoading(false);
      toast({
        title: 'Acesso Negado',
        description: 'Este email não está autorizado para acessar a área do dono.',
        variant: 'destructive',
      });
      return;
    }

    const { data, error: authError } = await signInWithPassword(email, password);

    if (authError) {
      setError(authError.message || 'Ocorreu um erro desconhecido.');
      toast({
        title: 'Erro de Login',
        description: authError.message || 'Verifique suas credenciais ou tente novamente mais tarde.',
        variant: 'destructive',
      });
    } else if (data.session) {
      toast({
        title: 'Login Bem-sucedido!',
        description: `Bem-vindo, ${data.user.email.split('@')[0]}!`,
      });
    } else {
      setError('Falha no login. Por favor, tente novamente.');
       toast({
        title: 'Erro de Login',
        description: 'Não foi possível estabelecer uma sessão. Tente novamente.',
        variant: 'destructive',
      });
    }
    setIsLoading(false);
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
          <div className="inline-block p-4 bg-primary/10 rounded-full mx-auto mb-4 border-2 border-primary/50">
            <ShieldAlert className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold text-primary">Área Restrita do Dono</CardTitle>
          <CardDescription className="text-foreground/80">
            Acesso exclusivo para Tony.
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
              <Label htmlFor="email-tony" className="text-foreground/90">Email do Administrador</Label>
              <Input 
                id="email-tony" 
                type="email" 
                placeholder={TONY_EMAIL}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
                className="bg-background/70 border-border focus:border-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password-tony" className="text-foreground/90">Senha</Label>
              <Input 
                id="password-tony" 
                type="password" 
                placeholder="********" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                className="bg-background/70 border-border focus:border-primary"
              />
            </div>
          </CardContent>
          <CardFooter className="p-6">
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-primary to-red-500 hover:from-primary/90 hover:to-red-500/90 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105" 
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <LogIn className="mr-2 h-5 w-5" />}
              Entrar
            </Button>
          </CardFooter>
        </form>
      </Card>
    </motion.div>
  );
};

export default TonyLoginPage;