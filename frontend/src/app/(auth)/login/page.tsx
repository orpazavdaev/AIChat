import { LoginForm } from '@/components/auth/login-form';
import { AppBootScreen } from '@/components/layout/app-boot-screen';
import { Suspense } from 'react';

export default function LoginPage() {
  return (
    <Suspense fallback={<AppBootScreen />}>
      <LoginForm />
    </Suspense>
  );
}
