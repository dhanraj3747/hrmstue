"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { getCurrentUser } from "@/lib/auth";
import {
  LayoutDashboard,
  CalendarCheck,
  Clock3,
  Wallet,
  MessageSquare,
  Crosshair,
  Briefcase,
  Users,
  FileText,
  ToggleLeft,
  Building2,
  UserCheck,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "./Logo";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
};

export const candidateNav: NavItem[] = [
  { label: "Dashboard", href: "/candidate/dashboard", icon: LayoutDashboard },
  { label: "Attendance", href: "/candidate/attendance", icon: CalendarCheck },
  { label: "Leaves", href: "/candidate/leaves", icon: Clock3 },
  { label: "Payroll", href: "/candidate/payroll", icon: Wallet },
  { label: "Messages", href: "/candidate/messages", icon: MessageSquare },
  { label: "CRM", href: "/candidate/crm", icon: Crosshair },
  { label: "Job Openings", href: "/candidate/job-openings", icon: Briefcase },
];

export const adminNav: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Employees", href: "/admin/employees", icon: Users },
  { label: "Attendance", href: "/admin/attendance", icon: CalendarCheck },
  { label: "Documents", href: "/admin/documents", icon: FileText },
  { label: "CRM Access", href: "/admin/crm-access", icon: ToggleLeft },
  { label: "Leaves", href: "/admin/leaves", icon: Clock3 },
  { label: "Vendors", href: "/admin/vendors", icon: Building2 },
  { label: "Job Openings", href: "/admin/job-openings", icon: Briefcase },
  { label: "Payroll", href: "/admin/payroll", icon: Wallet },
  { label: "Selected", href: "/admin/selected-candidates", icon: UserCheck },
  { label: "Messages", href: "/admin/messages", icon: MessageSquare },
];

export function Sidebar({
  items,
  portalLabel,
}: {
  items: NavItem[];
  portalLabel: string;
}) {
  const [unread, setUnread] = useState(0);

  const loadUnread = useCallback(async () => {
    const user = getCurrentUser();
    if (!user?.email) return;
    try {
      const res = await fetch(`/api/messages?me=${encodeURIComponent(user.email)}`);
      if (res.ok) {
        const partners = (await res.json()).partners ?? [];
        setUnread(partners.reduce((sum: number, p: { unread: number }) => sum + (p.unread || 0), 0));
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    loadUnread();
    const t = setInterval(loadUnread, 8000);
    return () => clearInterval(t);
  }, [loadUnread]);

  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col bg-sidebar-bg text-white">
      <div className="p-4">
        <div className="rounded-xl bg-white p-3 shadow-sm">
          <Logo />
          <div className="mt-2 border-t border-gray-100 pt-2">
            <p className="text-sm font-bold text-gray-900">Smart HRMS </p>
            <p className="text-xs text-gray-500">{portalLabel}</p>
          </div>
        </div>
      </div>

      <p className="px-5 pb-2 text-xs font-medium uppercase tracking-wider text-sidebar-muted">
        Navigation
      </p>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4 scrollbar-thin">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          // Messages shows the live unread count; it clears once messages are read.
          const badgeCount = item.href.endsWith("/messages") ? unread : item.badge;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "bg-brand-red text-white shadow-sm"
                  : "text-sidebar-text hover:bg-white/10"
              )}
            >
              <Icon size={18} />
              <span className="flex-1">{item.label}</span>
              {badgeCount ? (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-red px-1.5 text-[10px] font-bold text-white">
                  {badgeCount}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
