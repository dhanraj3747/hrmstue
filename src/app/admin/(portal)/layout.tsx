"use client";

import { PortalLayout } from "@/components/layout/PortalLayout";
import { adminNav } from "@/components/layout/Sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalLayout
      navItems={adminNav}
      portalLabel="Redfoxa Careerlink — Admin"
      requiredRole="admin"
    >
      {children}
    </PortalLayout>
  );
}
