'use client';

import Sidebar from '@/components/admin/Sidebar';
import Topbar from '@/components/admin/Topbar';
import { SidebarProvider, useSidebar } from '@/lib/sidebar-context';

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const { isOpen, close } = useSidebar();

  return (
    <div className="admin-layout">
      {/* Mobile backdrop */}
      <div
        className={`sidebar-backdrop ${isOpen ? 'open' : ''}`}
        onClick={close}
      />
      <Sidebar />
      <Topbar />
      <main className="admin-content">{children}</main>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </SidebarProvider>
  );
}
