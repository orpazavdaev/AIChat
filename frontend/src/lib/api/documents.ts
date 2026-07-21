import { getApiBaseUrl } from '@/lib/api/base-url';
import { ApiError } from '@/lib/api/client';
import { handleSessionExpired, isUnauthorizedStatus } from '@/lib/auth/session';
import { tokenStorage } from '@/lib/auth/token-storage';
import type { Document } from '@/types/document';

function parseErrorMessage(payload: unknown): string {
  if (!payload || typeof payload !== 'object') {
    return 'Request failed';
  }
  const message = (payload as { message?: string | string[] }).message;
  if (Array.isArray(message)) {
    return message.join(', ');
  }
  if (typeof message === 'string') {
    return message;
  }
  return 'Request failed';
}

export const documentsApi = {
  list() {
    return fetch(`${getApiBaseUrl()}/documents`, {
      headers: {
        Authorization: `Bearer ${tokenStorage.getAccessToken() ?? ''}`,
      },
    })
      .then(async (response) => {
        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          if (isUnauthorizedStatus(response.status)) {
            handleSessionExpired();
          }
          throw new ApiError(response.status, parseErrorMessage(payload));
        }
        return response.json() as Promise<Document[]>;
      })
      .catch((error) => {
        if (error instanceof ApiError) {
          throw error;
        }
        throw new ApiError(
          0,
          'Could not reach the server. It may be waking up after idle time — try again in a moment.',
        );
      });
  },

  upload(file: File, onProgress?: (progress: number) => void) {
    const formData = new FormData();
    formData.append('file', file);

    return new Promise<Document>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${getApiBaseUrl()}/documents/upload`);

      const token = tokenStorage.getAccessToken();
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      let mockProgress = 0;
      let mockTimer: ReturnType<typeof setInterval> | null = null;

      const stopMockProgress = () => {
        if (mockTimer) {
          clearInterval(mockTimer);
          mockTimer = null;
        }
      };

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          onProgress(Math.round((event.loaded / event.total) * 100));
          return;
        }

        if (!mockTimer && onProgress) {
          mockTimer = setInterval(() => {
            mockProgress = Math.min(mockProgress + 8, 90);
            onProgress(mockProgress);
          }, 120);
        }
      };

      xhr.onload = () => {
        stopMockProgress();
        if (onProgress) {
          onProgress(100);
        }

        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText) as Document);
          return;
        }

        let payload: unknown = null;
        try {
          payload = JSON.parse(xhr.responseText);
        } catch {
          payload = null;
        }

        if (isUnauthorizedStatus(xhr.status)) {
          handleSessionExpired();
        }

        reject(new ApiError(xhr.status, parseErrorMessage(payload)));
      };

      xhr.onerror = () => {
        stopMockProgress();
        reject(
          new ApiError(
            0,
            'Could not reach the server. It may be waking up after idle time — try again in a moment.',
          ),
        );
      };

      xhr.onabort = () => {
        stopMockProgress();
        reject(new ApiError(0, 'Upload cancelled'));
      };

      xhr.send(formData);
    });
  },
};
