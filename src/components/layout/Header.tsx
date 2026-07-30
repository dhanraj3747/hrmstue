"use client";

import { Avatar } from "@/components/ui/Avatar";
import { AuthUser, fullName, logout } from "@/lib/auth";
import { LogOut, Menu } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { NotificationBell } from "./NotificationBell";

export function Header({
  user,
  onMenuClick,
}: {
  user: AuthUser;
  onMenuClick?: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const name = fullName(user);

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 md:px-6">
      <div className="flex items-center gap-3">
        <button className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden" onClick={onMenuClick}>
          <Menu size={20} />
        </button>
        <h1 className="text-base font-semibold text-gray-900 md:text-lg">Smart HRMS</h1>
      </div>

      <div className="flex items-center gap-3">
        <NotificationBell user={user} />

        <div className="relative">
          <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-50">
            <Avatar name={name} size="sm" />
            <span className="hidden text-sm font-medium text-gray-800 sm:inline">{name}</span>
          </button>
          {open && (
            <div className="absolute right-0 mt-1 w-52 rounded-lg border border-gray-100 bg-white py-1 shadow-lg">
              <p className="truncate px-3 py-2 text-xs text-gray-500">{user.email}</p>
              <button
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                onClick={() => { logout(); router.push(user.role === "admin" ? "/admin/login" : "/candidate/login"); }}
              >
                <LogOut size={14} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
