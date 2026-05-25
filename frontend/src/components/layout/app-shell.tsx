import { AppSidebar } from '@/components/layout/app-sidebar';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-muted/25 transition-colors duration-200 dark:bg-muted/15">
      <AppSidebar />
      <main className="flex flex-1 flex-col overflow-y-auto">{children}</main>
    </div>
  );
}
