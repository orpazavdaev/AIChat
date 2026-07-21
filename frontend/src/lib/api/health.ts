import { getApiBaseUrl } from '@/lib/api/base-url';

export async function checkApiHealth(signal?: AbortSignal): Promise<boolean> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/health`, {
      method: 'GET',
      cache: 'no-store',
      signal,
    });
    return response.ok;
  } catch {
    return false;
  }
}
