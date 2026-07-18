export type UserRole = "admin" | "candidate";

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  crmAccess?: boolean;
}

const STORAGE_KEY = "hrms_auth_user";

/** Persist the logged-in session (not credentials — those live in the DB). */
export function setCurrentUser(user: AuthUser) {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  }
}

export function getCurrentUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function logout() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function fullName(user: AuthUser) {
  return `${user.firstName} ${user.lastName}`.trim();
}
