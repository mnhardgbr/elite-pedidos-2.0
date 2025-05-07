'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Verificar se existe token de autenticação
    const authToken = localStorage.getItem('authToken');
    
    // Lista de rotas públicas que não precisam de autenticação
    const publicRoutes = ['/login'];
    
    if (!authToken && !publicRoutes.includes(pathname)) {
      // Se não houver token e a rota não for pública, redireciona para o login
      router.push('/login');
    } else if (authToken && pathname === '/login') {
      // Se já estiver autenticado e tentar acessar o login, redireciona para o caixa
      router.push('/caixa');
    }
  }, [pathname]);

  return <>{children}</>;
} 