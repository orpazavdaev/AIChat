'use client';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [{ href: '/dashboard', label: 'Dashboard' }];

export function AppSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="flex h-full w-64 flex-col border-r border-border bg-sidebar text-sidebar-foreground">
      <header className="flex h-14 items-center px-6">
        <span className="text-sm font-semibold tracking-tight">AIChat</span>
      </header>
      <Separator />
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-md px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
              pathname === item.href
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-foreground'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <Separator />
      <footer className="flex flex-col gap-3 p-4">
        {user?.email && (
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        )}
        <Button variant="outline" size="sm" onClick={logout}>
          Log out
        </Button>
      </footer>
    </aside>
  );
}
