'use client';

import { authApi } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { handleSessionExpired } from '@/lib/auth/session';
import { tokenStorage } from '@/lib/auth/token-storage';
import type { LoginRequest, RegisterRequest } from '@/types/auth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);
  }, []);

  const hasToken = isReady && tokenStorage.hasToken();

  const meQuery = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authApi.me,
    enabled: hasToken,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 401) {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: (attempt) => Math.min(2000 * 2 ** attempt, 8000),
  });

  useEffect(() => {
    if (meQuery.error instanceof ApiError && meQuery.error.status === 401) {
      handleSessionExpired();
    }
  }, [meQuery.error]);

  const loginMutation = useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: (data) => {
      tokenStorage.setAccessToken(data.accessToken);
      tokenStorage.setUser(data.user);
      queryClient.setQueryData(['auth', 'me'], data.user);
      router.push('/chat');
    },
  });

  const registerMutation = useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data),
    onSuccess: (data) => {
      tokenStorage.setAccessToken(data.accessToken);
      tokenStorage.setUser(data.user);
      queryClient.setQueryData(['auth', 'me'], data.user);
      router.push('/chat');
    },
  });

  const logout = () => {
    tokenStorage.clear();
    queryClient.clear();
    router.push('/login');
  };

  const isUnauthorized =
    meQuery.error instanceof ApiError && meQuery.error.status === 401;

  return {
    user: meQuery.data ?? tokenStorage.getUser(),
    isReady,
    hasToken,
    isVerifying: hasToken && meQuery.isPending,
    isAuthenticated: hasToken && !isUnauthorized,
    isLoading: !isReady,
    login: loginMutation,
    register: registerMutation,
    logout,
    refetchMe: meQuery.refetch,
  };
}

export function useLoginRedirect() {
  const searchParams = useSearchParams();
  const expired = searchParams.get('expired') === '1';
  const returnTo = searchParams.get('returnTo');

  return { expired, returnTo };
}
