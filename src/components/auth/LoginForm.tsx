"use client";

import { AuthCard } from "./AuthCard";
import { PasswordInput } from "./PasswordInput";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { setCurrentUser, UserRole } from "@/lib/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function LoginForm({
  role,
  signupHref,
  redirectTo,
}: {
  role: UserRole;
  signupHref: string;
  redirectTo: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Admin-only forgot password (Email OTP)
  const [forgot, setForgot] = useState(false);
  const [otpStep, setOtpStep] = useState<"request" | "verify">("request");
  const [fEmail, setFEmail] = useState("");
  const [fOtp, setFOtp] = useState("");
  const [fPass, setFPass] = useState("");
  const [fMsg, setFMsg] = useState("");
  const [fErr, setFErr] = useState("");
  const [fBusy, setFBusy] = useState(false);

  function resetForgot() {
    setForgot(false); setOtpStep("request");
    setFEmail(""); setFOtp(""); setFPass(""); setFMsg(""); setFErr("");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error ?? "Invalid email or password."); return; }
      setCurrentUser(data.user);
      router.push(redirectTo);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function onRequestOtp(e: FormEvent) {
    e.preventDefault();
    setFMsg(""); setFErr("");
    setFBusy(true);
    try {
      const res = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: fEmail }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setFErr(data.error ?? "Could not send OTP."); return; }
      setOtpStep("verify");
      setFMsg(
        data.devOtp
          ? `OTP sent to ${data.sentTo}. (Testing code: ${data.devOtp})`
          : `A 6-digit OTP has been sent to ${data.sentTo}.`
      );
    } finally {
      setFBusy(false);
    }
  }

  async function onVerifyOtp(e: FormEvent) {
    e.preventDefault();
    setFMsg(""); setFErr("");
    if (fPass.length < 6) { setFErr("Password must be at least 6 characters."); return; }
    setFBusy(true);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: fEmail, otp: fOtp, newPassword: fPass }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setFErr(data.error ?? "Verification failed."); return; }
      setFMsg("Password reset successfully. You can now sign in.");
      setOtpStep("request"); setFOtp(""); setFPass("");
    } finally {
      setFBusy(false);
    }
  }

  return (
    <AuthCard
      portal={role}
      title={role === "admin" ? "Admin Portal Login" : "Candidate Portal Login"}
      subtitle={
        role === "admin"
          ? "Sign in to manage employees, payroll, invoices and vendors."
          : "Sign in to view your attendance, payslips, leaves and CRM."
      }
      backHref="/"
      backLabel="Back to portal selection"
    >
      {forgot ? (
        otpStep === "request" ? (
          <form onSubmit={onRequestOtp} className="space-y-4">
            <p className="text-sm text-gray-500">Enter your admin email. A one-time code will be sent to the HR mailbox for verification.</p>
            <Input id="fEmail" label="Admin Email" type="email" placeholder="admin@company.com" value={fEmail} onChange={(e) => setFEmail(e.target.value)} required />
            {fErr && <p className="text-sm text-red-600">{fErr}</p>}
            <Button type="submit" className="w-full" disabled={fBusy}>{fBusy ? "Sending OTP..." : "Send OTP"}</Button>
            <p className="text-center text-sm">
              <button type="button" className="font-medium text-brand-red hover:underline" onClick={resetForgot}>Back to sign in</button>
            </p>
          </form>
        ) : (
          <form onSubmit={onVerifyOtp} className="space-y-4">
            {fMsg && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{fMsg}</p>}
            <Input id="fOtp" label="Enter OTP" inputMode="numeric" maxLength={6} placeholder="6-digit code" value={fOtp} onChange={(e) => setFOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} required />
            <PasswordInput id="fPass" label="New Password" placeholder="At least 6 characters" value={fPass} onChange={(e) => setFPass(e.target.value)} required minLength={6} />
            {fErr && <p className="text-sm text-red-600">{fErr}</p>}
            <Button type="submit" className="w-full" disabled={fBusy}>{fBusy ? "Verifying..." : "Verify & Reset Password"}</Button>
            <p className="flex items-center justify-between text-sm">
              <button type="button" className="font-medium text-gray-500 hover:underline" onClick={() => { setOtpStep("request"); setFErr(""); }}>Resend / change email</button>
              <button type="button" className="font-medium text-brand-red hover:underline" onClick={resetForgot}>Back to sign in</button>
            </p>
          </form>
        )
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <Input id="email" label="Email" type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <PasswordInput id="password" label="Password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>{loading ? "Signing in..." : "Sign In"}</Button>
          {role === "admin" && (
            <p className="text-center text-sm">
              <button type="button" className="font-medium text-brand-red hover:underline" onClick={() => { setForgot(true); setOtpStep("request"); setFMsg(""); setFErr(""); }}>Forgot password?</button>
            </p>
          )}
          {role !== "admin" && (
            <p className="text-center text-sm text-gray-500">
              Don&apos;t have an account?{" "}
              <Link href={signupHref} className="font-semibold text-brand-red hover:underline">Sign up</Link>
            </p>
          )}
        </form>
      )}
    </AuthCard>
  );
}
