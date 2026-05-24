'use client';

import { authApi } from '@/lib/api/auth';
import { tokenStorage } from '@/lib/auth/token-storage';
import type { LoginRequest, RegisterRequest } from '@/types/auth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);
  }, []);

  const meQuery = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authApi.me,
    enabled: isReady && tokenStorage.hasToken(),
  });

  const loginMutation = useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: (data) => {
      tokenStorage.setAccessToken(data.accessToken);
      tokenStorage.setUser(data.user);
      queryClient.setQueryData(['auth', 'me'], data.user);
      router.push('/dashboard');
    },
  });

  const registerMutation = useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data),
    onSuccess: (data) => {
      tokenStorage.setAccessToken(data.accessToken);
      tokenStorage.setUser(data.user);
      queryClient.setQueryData(['auth', 'me'], data.user);
      router.push('/dashboard');
    },
  });

  const logout = () => {
    tokenStorage.clear();
    queryClient.clear();
    router.push('/login');
  };

  return {
    user: meQuery.data ?? tokenStorage.getUser(),
    isLoading: !isReady || meQuery.isLoading,
    isAuthenticated: isReady && tokenStorage.hasToken(),
    login: loginMutation,
    register: registerMutation,
    logout,
  };
}
