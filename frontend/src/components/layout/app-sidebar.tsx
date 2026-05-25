import { SidebarContent } from '@/components/layout/sidebar-content';

export function AppSidebar() {
  return (
    <aside className="hidden h-full w-64 shrink-0 flex-col border-r border-border/60 bg-sidebar md:flex">
      <SidebarContent />
    </aside>
  );
}
