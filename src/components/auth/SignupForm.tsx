"use client";

import { AuthCard } from "./AuthCard";
import { PasswordInput } from "./PasswordInput";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { UserRole } from "@/lib/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function SignupForm({
  role,
  loginHref,
}: {
  role: UserRole;
  loginHref: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, password, role }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.errors?.email ?? data.errors?.password ?? data.errors?.firstName ?? data.error ?? "Failed to create account.");
        return;
      }
      // Account stored in DB — send them to login.
      router.push(`${loginHref}?registered=1`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      portal={role}
      title={role === "admin" ? "Create Admin Account" : "Create Candidate Account"}
      subtitle={
        role === "admin"
          ? "Register an admin account to manage the HRMS."
          : "Register a candidate account to track attendance, payslips and leaves."
      }
      backHref="/"
      backLabel="Back to portal selection"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input id="firstName" label="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
          <Input id="lastName" label="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        </div>
        <Input id="email" label="Email" type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <PasswordInput id="password" label="Password" placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creating..." : "Create Account"}
        </Button>
        <p className="text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link href={loginHref} className="font-semibold text-brand-red hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
