export const dynamic = 'force-dynamic';

import { AuthShell } from '@/components/auth/auth-shell';
import { Logo } from '@/components/brand/logo';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AuthShell>{children}</AuthShell>
      <div className="fixed top-6 left-6 lg:hidden">
        <Logo href="/" />
      </div>
    </>
  );
}
