import { tokenStorage } from '@/lib/auth/token-storage';

let redirecting = false;

export function handleSessionExpired() {
  if (typeof window === 'undefined' || redirecting) {
    return;
  }

  redirecting = true;
  tokenStorage.clear();

  const params = new URLSearchParams({ expired: '1' });
  const returnTo = window.location.pathname + window.location.search;

  if (returnTo && returnTo !== '/login' && returnTo !== '/register') {
    params.set('returnTo', returnTo);
  }

  window.location.replace(`/login?${params.toString()}`);
}

export function isUnauthorizedStatus(status: number) {
  return status === 401;
}
