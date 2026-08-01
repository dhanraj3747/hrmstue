import Link from "next/link";
import { Logo } from "@/components/layout/Logo";
import { Shield, UserRound } from "lucide-react";

export function PortalSelector() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f5f6f8]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(163,29,49,0.12),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_rgba(45,27,30,0.08),_transparent_50%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-4 py-12">
        <div className="mb-10 text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-2xl bg-white px-6 py-4 shadow-card">
              <Logo />
            </div>
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Site Identity · Redfoxa Careerlink Pvt Ltd
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
            Smart HRMS 
          </h1>
          <p className="mt-2 text-gray-500">
            Choose a portal to continue Admin or Candidate
          </p>
        </div>

        <div className="grid w-full gap-5 md:grid-cols-2">
          <Link
            href="/admin/login"
            className="group rounded-2xl border border-gray-100 bg-white p-8 shadow-card transition hover:-translate-y-1 hover:border-brand-red/30 hover:shadow-lg"
          >
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-brand-red text-white">
              <Shield size={28} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 group-hover:text-brand-red">
              Admin Portal
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              Manage employees, leaves, vendors, payroll, documents, CRM access, and
              job openings.
            </p>
            <span className="mt-6 inline-flex text-sm font-semibold text-brand-red">
              Enter Admin →
            </span>
          </Link>

          <Link
            href="/candidate/login"
            className="group rounded-2xl border border-gray-100 bg-white p-8 shadow-card transition hover:-translate-y-1 hover:border-brand-red/30 hover:shadow-lg"
          >
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-[#2D1B1E] text-white">
              <UserRound size={28} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 group-hover:text-brand-red">
              Candidate Portal
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              Attendance, leaves, payroll, messages, CRM recruitment tracker, and job
              openings.
            </p>
            <span className="mt-6 inline-flex text-sm font-semibold text-brand-red">
              Enter Candidate →
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}