'use client';

import { checkApiHealth } from '@/lib/api/health';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

export function useBackendHealth() {
  const queryClient = useQueryClient();
  const wasHealthy = useRef(false);

  const healthQuery = useQuery({
    queryKey: ['api', 'health'],
    queryFn: ({ signal }) => checkApiHealth(signal),
    refetchInterval: (query) => (query.state.data === true ? false : 4000),
    retry: true,
    retryDelay: 2000,
    staleTime: 0,
  });

  const isHealthy = healthQuery.data === true;
  const isChecking = healthQuery.isPending || healthQuery.isFetching;

  useEffect(() => {
    if (isHealthy && !wasHealthy.current) {
      wasHealthy.current = true;
      void queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] !== 'api',
      });
    }

    if (!isHealthy) {
      wasHealthy.current = false;
    }
  }, [isHealthy, queryClient]);

  return {
    isHealthy,
    isWaking: !isHealthy,
    isChecking,
    refetch: healthQuery.refetch,
  };
}
