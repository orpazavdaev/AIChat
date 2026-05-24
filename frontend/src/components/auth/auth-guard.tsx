'use client';

import { tokenStorage } from '@/lib/auth/token-storage';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    if (!tokenStorage.hasToken()) {
      router.replace('/login');
      return;
    }
    setIsAllowed(true);
  }, [router]);

  if (!isAllowed) {
    return null;
  }

  return children;
}
