import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/layout/Logo";

export function AuthCard({
  title,
  subtitle,
  children,
  backHref = "/",
  backLabel = "Back to portal selection",
  portal,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  portal?: "admin" | "candidate";
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#f3f4f6] px-4 py-10">
      <Link
        href={backHref}
        className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:border-brand-red/30 hover:text-brand-red sm:left-6 sm:top-6"
      >
        <ArrowLeft size={16} />
        <span className="hidden sm:inline">{backLabel}</span>
        <span className="sm:hidden">Back</span>
      </Link>

      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-auth sm:p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <Logo />
          {portal ? (
            <span
              className={
                "mt-3 inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider " +
                (portal === "admin"
                  ? "bg-brand-red/10 text-brand-red"
                  : "bg-blue-50 text-blue-700")
              }
            >
              {portal === "admin" ? "Admin Portal" : "Candidate Portal"}
            </span>
          ) : (
            <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Smart HRMS · Site Identity
            </p>
          )}
          <h1 className="mt-3 text-2xl font-bold text-gray-900">{title}</h1>
          <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
}
