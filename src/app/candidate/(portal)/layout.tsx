"use client";

import { PortalLayout } from "@/components/layout/PortalLayout";
import { candidateNav } from "@/components/layout/Sidebar";

export default function CandidateLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalLayout
      navItems={candidateNav}
      portalLabel="Redfoxa Careerlink"
      requiredRole="candidate"
    >
      {children}
    </PortalLayout>
  );
}
