import { tokenStorage } from '@/lib/auth/token-storage';
import { ApiError } from '@/lib/api/client';
import type { Document } from '@/types/document';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

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
    return fetch(`${API_BASE_URL}/documents`, {
      headers: {
        Authorization: `Bearer ${tokenStorage.getAccessToken() ?? ''}`,
      },
    }).then(async (response) => {
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new ApiError(response.status, parseErrorMessage(payload));
      }
      return response.json() as Promise<Document[]>;
    });
  },

  upload(file: File, onProgress?: (progress: number) => void) {
    const formData = new FormData();
    formData.append('file', file);

    return new Promise<Document>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_BASE_URL}/documents/upload`);

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

        reject(new ApiError(xhr.status, parseErrorMessage(payload)));
      };

      xhr.onerror = () => {
        stopMockProgress();
        reject(new ApiError(0, 'Upload failed'));
      };

      xhr.onabort = () => {
        stopMockProgress();
        reject(new ApiError(0, 'Upload cancelled'));
      };

      xhr.send(formData);
    });
  },
};
