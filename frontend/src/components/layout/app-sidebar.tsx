'use client';

import { Logo } from '@/components/brand/logo';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import {
  FileText,
  LayoutDashboard,
  LogOut,
  MessageSquare,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, active: true },
  { href: '#', label: 'Documents', icon: FileText, active: false },
  { href: '#', label: 'Chat', icon: MessageSquare, active: false },
];

function getInitials(email?: string) {
  if (!email) return '?';
  return email.slice(0, 2).toUpperCase();
}

export function AppSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="flex h-full w-64 flex-col border-r border-border/60 bg-sidebar">
      <header className="flex h-16 items-center px-5">
        <Logo />
      </header>
      <Separator className="opacity-60" />
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.active && pathname === item.href;

          if (!item.active) {
            return (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm text-muted-foreground/70"
              >
                <span className="flex items-center gap-3">
                  <Icon className="size-4" />
                  {item.label}
                </span>
                <Badge variant="secondary" className="text-[10px]">
                  Soon
                </Badge>
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors',
                isActive
                  ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground shadow-sm'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/70',
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <Separator className="opacity-60" />
      <footer className="flex flex-col gap-3 p-4">
        <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/50 p-3">
          <Avatar className="size-9">
            <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
              {getInitials(user?.email)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">Account</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={logout} className="justify-start">
          <LogOut className="size-4" />
          Log out
        </Button>
      </footer>
    </aside>
  );
}
