import { CRMCandidate, generateCandidates } from "./mock-data";

const BASE_KEY = "hrms_crm_candidates_v2";

// Each employer/recruiter gets their own independent CRM list (keyed by email).
// This prevents different employees from sharing the same candidate data.
function keyFor(owner?: string) {
  return owner ? `hrms_crm_${owner.toLowerCase()}` : BASE_KEY;
}

export function loadCandidates(owner?: string): CRMCandidate[] {
  if (typeof window === "undefined") return generateCandidates(1000);
  const key = keyFor(owner);
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw) as CRMCandidate[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    /* ignore */
  }
  // First time for this user — seed their own private copy.
  const seed = generateCandidates(1000);
  localStorage.setItem(key, JSON.stringify(seed));
  return seed;
}

export function saveCandidates(rows: CRMCandidate[], owner?: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(keyFor(owner), JSON.stringify(rows));
}

export function formatElapsed(addedAt: number, now = Date.now()) {
  const sec = Math.max(0, Math.floor((now - addedAt) / 1000));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
