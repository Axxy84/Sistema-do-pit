import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ownerService } from '@/services/ownerService';
import TonyLoginPageDirect from './TonyLoginPageDirect';
import TonyDashboardPage from './TonyDashboardPage';
import { Loader2, Shield } from 'lucide-react';

const TonyPageWrapper = () => {
  const { session } = useAuth();
  const [isOwnerVerified, setIsOwnerVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [ownerUser, setOwnerUser] = useState(null);

  useEffect(() => {
    const checkOwnerAccess = async () => {
      // Se não tem sessão, mostrar login
      if (!session) {
        setIsLoading(false);
        setIsOwnerVerified(false);
        return;
      }

      try {
        // Verificar se o usuário logado tem acesso de owner
        const ownerCheck = await ownerService.verifyOwnerAccess();
        
        if (ownerCheck.success && ownerCheck.isOwner) {
          setIsOwnerVerified(true);
          setOwnerUser(ownerCheck.user);
        } else {
          setIsOwnerVerified(false);
          setOwnerUser(null);
        }
      } catch (error) {
        console.error('Erro ao verificar acesso de owner:', error);
        setIsOwnerVerified(false);
        setOwnerUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkOwnerAccess();
  }, [session]);

  const handleOwnerVerified = (user) => {
    setIsOwnerVerified(true);
    setOwnerUser(user);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-red-900 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-slate-800/80 p-6 rounded-full border border-slate-700/50 backdrop-blur-sm mb-4">
            <Shield className="h-12 w-12 text-red-400 mx-auto" />
          </div>
          <Loader2 className="h-8 w-8 animate-spin text-red-400 mx-auto mb-4" />
          <p className="text-gray-300 text-sm">Verificando permissões de acesso...</p>
        </div>
      </div>
    );
  }

  // Se não é owner ou não tem sessão, mostrar login
  if (!isOwnerVerified) {
    return <TonyLoginPageDirect onOwnerVerified={handleOwnerVerified} />;
  }

  // Se é owner verificado, mostrar dashboard
  return <TonyDashboardPage ownerUser={ownerUser} />;
};

export default TonyPageWrapper;