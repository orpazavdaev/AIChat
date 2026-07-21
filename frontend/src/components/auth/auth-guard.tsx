'use client';

import { AppBootScreen } from '@/components/layout/app-boot-screen';
import { useAuth } from '@/hooks/use-auth';
import { tokenStorage } from '@/lib/auth/token-storage';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isReady, hasToken, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!tokenStorage.hasToken() || !isAuthenticated) {
      router.replace('/login');
    }
  }, [isReady, hasToken, isAuthenticated, router]);

  if (!isReady) {
    return <AppBootScreen />;
  }

  if (!hasToken || !isAuthenticated) {
    return <AppBootScreen />;
  }

  return children;
}
