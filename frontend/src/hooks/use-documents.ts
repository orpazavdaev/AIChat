'use client';

import { documentsApi } from '@/lib/api/documents';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useDocuments() {
  const queryClient = useQueryClient();

  const documentsQuery = useQuery({
    queryKey: ['documents'],
    queryFn: documentsApi.list,
  });

  const uploadMutation = useMutation({
    mutationFn: ({
      file,
      onProgress,
    }: {
      file: File;
      onProgress?: (progress: number) => void;
    }) => documentsApi.upload(file, onProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  return {
    documents: documentsQuery.data ?? [],
    isLoading: documentsQuery.isLoading,
    isError: documentsQuery.isError,
    upload: uploadMutation,
  };
}
