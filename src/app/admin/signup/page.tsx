import { redirect } from "next/navigation";

export default function AdminSignupPage() {
  // Admin self-signup is disabled. Admin accounts are managed internally.
  redirect("/admin/login");
}
