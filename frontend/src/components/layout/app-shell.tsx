import { AppSidebar } from '@/components/layout/app-sidebar';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-muted/30">
      <AppSidebar />
      <main className="flex flex-1 flex-col overflow-y-auto">{children}</main>
    </div>
  );
}
