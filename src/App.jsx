import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import DashboardPage from '@/pages/DashboardPage';
import ProductsPage from '@/pages/ProductsPage'; 
import CustomersPage from '@/pages/CustomersPage.jsx';
import OrdersPage from '@/pages/OrdersPage';
import DeliveriesPage from '@/pages/DeliveriesPage';
import ReportsPage from '@/pages/ReportsPage';
import CashClosingPage from '@/pages/CashClosingPage';
import AuthPage from '@/pages/AuthPage';
import TonyPage from '@/pages/TonyPage'; 
import CouponsPage from '@/pages/CouponsPage.jsx';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/contexts/ThemeProvider.jsx';
import { AuthProvider } from '@/contexts/AuthContext.jsx';
import ProtectedRoute from '@/components/ProtectedRoute.jsx';
import ErrorBoundary from '@/components/ErrorBoundary.jsx';
import MesasPage from './pages/MesasPage';

function App() {
  console.log('🚀 App - Sistema PIT STOP iniciado!');

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <AuthProvider>
          <Router>
            <ErrorBoundary>
              <Layout>
                <ErrorBoundary>
                  <Routes>
                    <Route path="/login" element={<AuthPage />} />
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    
                    <Route path="/dashboard" element={
                      <ErrorBoundary>
                        <ProtectedRoute allowedRoles={['admin', 'atendente', 'entregador']}>
                          <DashboardPage />
                        </ProtectedRoute>
                      </ErrorBoundary>
                    } />
                    
                    <Route path="/produtos" element={
                      <ErrorBoundary>
                        <ProtectedRoute allowedRoles={['admin', 'atendente']}>
                          <ProductsPage />
                        </ProtectedRoute>
                      </ErrorBoundary>
                    } />
                    <Route path="/clientes" element={
                      <ErrorBoundary>
                        <ProtectedRoute allowedRoles={['admin', 'atendente']}>
                          <CustomersPage />
                        </ProtectedRoute>
                      </ErrorBoundary>
                    } />
                    <Route path="/pedidos" element={
                      <ErrorBoundary>
                        <ProtectedRoute allowedRoles={['admin', 'atendente']}>
                          <OrdersPage />
                        </ProtectedRoute>
                      </ErrorBoundary>
                    } />
                    <Route path="/entregas" element={
                      <ErrorBoundary>
                        <ProtectedRoute allowedRoles={['admin', 'atendente', 'entregador']}>
                          <DeliveriesPage />
                        </ProtectedRoute>
                      </ErrorBoundary>
                    } />
                    <Route path="/fechamento-caixa" element={
                      <ErrorBoundary>
                        <ProtectedRoute allowedRoles={['admin', 'atendente']}>
                          <CashClosingPage />
                        </ProtectedRoute>
                      </ErrorBoundary>
                    } />
                    <Route path="/fechamento-caixa/:mode" element={
                      <ErrorBoundary>
                        <ProtectedRoute allowedRoles={['admin', 'atendente']}>
                          <CashClosingPage />
                        </ProtectedRoute>
                      </ErrorBoundary>
                    } />
                    <Route path="/fechamento-separado" element={<Navigate to="/fechamento-caixa/separado" replace />} />
                    
                    <Route 
                      path="/relatorios" 
                      element={
                        <ErrorBoundary>
                          <ProtectedRoute allowedRoles={['admin']}>
                            <ReportsPage />
                          </ProtectedRoute>
                        </ErrorBoundary>
                      } 
                    />
                    <Route 
                      path="/cupons" 
                      element={
                        <ErrorBoundary>
                          <ProtectedRoute allowedRoles={['admin']}>
                            <CouponsPage />
                          </ProtectedRoute>
                        </ErrorBoundary>
                      } 
                    />
                    <Route 
                      path="/tony" 
                      element={
                        <ErrorBoundary>
                          <ProtectedRoute allowedRoles={['admin']}>
                            <TonyPage />
                          </ProtectedRoute>
                        </ErrorBoundary>
                      } 
                    />
                    <Route path="/mesas" element={<MesasPage />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </ErrorBoundary>
              </Layout>
            </ErrorBoundary>
            <Toaster />
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;