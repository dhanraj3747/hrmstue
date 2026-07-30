"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { useUserLabel } from "@/hooks/useAuth";
import { formatWorkedMinutes } from "@/lib/payroll-calc";
import { formatDate } from "@/lib/utils";
import type { Attendance } from "@/types/payroll";
import { Calendar, CheckCircle2, Coffee, LogOut } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

// A live session is persisted so the timer keeps running (from wall-clock
// timestamps) across page navigation. A completed snapshot is also persisted so
// the login/logout/breaks stay visible after logout, and so the employee can
// only log in ONCE per day.
interface Session {
  loginAt: string;
  state: "working" | "break";
  breaksTaken: number;
  workAccumSec: number;
  breakAccumSec: number;
  segmentStart: string;
}
interface DoneSnap {
  day: string;        // yyyy-mm-dd
  loginAt: string;
  logoutAt: string;
  breaksTaken: number;
}

const dayStr = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function hms(totalSeconds: number) {
  const t = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
function timeOnly(iso: string | null) {
  return iso ? new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "-";
}
function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function startOfWeek(d: Date) {
  const x = new Date(d); const day = (x.getDay() + 6) % 7; x.setDate(x.getDate() - day); x.setHours(0, 0, 0, 0); return x;
}
function derive(session: Session | null, nowMs: number) {
  if (!session) return { workSec: 0, breakSec: 0 };
  const seg = Math.max(0, Math.floor((nowMs - new Date(session.segmentStart).getTime()) / 1000));
  let workSec = session.workAccumSec;
  let breakSec = session.breakAccumSec;
  if (session.state === "working") workSec += seg; else breakSec += seg;
  return { workSec, breakSec };
}

export default function AttendancePage() {
  const { name, email } = useUserLabel();
  const [employeeId, setEmployeeId] = useState<number | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [done, setDone] = useState<DoneSnap | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [history, setHistory] = useState<Attendance[]>([]);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  const sessKey = email ? `hrms_att_session_${email.toLowerCase()}` : "";
  const doneKey = email ? `hrms_att_done_${email.toLowerCase()}` : "";
  const refs = useRef({ sessKey, doneKey });
  refs.current = { sessKey, doneKey };

  const saveSession = useCallback((s: Session | null) => {
    setSession(s);
    if (!refs.current.sessKey) return;
    try {
      if (s) localStorage.setItem(refs.current.sessKey, JSON.stringify(s));
      else localStorage.removeItem(refs.current.sessKey);
    } catch { /* ignore */ }
  }, []);

  const saveDone = useCallback((d: DoneSnap | null) => {
    setDone(d);
    if (!refs.current.doneKey) return;
    try {
      if (d) localStorage.setItem(refs.current.doneKey, JSON.stringify(d));
      else localStorage.removeItem(refs.current.doneKey);
    } catch { /* ignore */ }
  }, []);

  const loadHistory = useCallback(async (empId: number) => {
    const res = await fetch(`/api/attendance?employeeId=${empId}`);
    if (res.ok) setHistory((await res.json()).records ?? []);
  }, []);

  // Restore today's session / completed snapshot on mount.
  useEffect(() => {
    if (!sessKey) return;
    const today = dayStr();
    try {
      const rawDone = localStorage.getItem(doneKey);
      if (rawDone) {
        const d = JSON.parse(rawDone) as DoneSnap;
        if (d.day === today) { setDone(d); return; } // already completed today
        localStorage.removeItem(doneKey);
      }
      const rawSess = localStorage.getItem(sessKey);
      if (rawSess) {
        const s = JSON.parse(rawSess) as Session;
        if (isSameDay(new Date(s.loginAt), new Date())) setSession(s);
        else localStorage.removeItem(sessKey);
      }
    } catch { /* ignore */ }
  }, [sessKey, doneKey]);

  useEffect(() => {
    if (!email) return;
    (async () => {
      const res = await fetch(`/api/employees?q=${encodeURIComponent(email)}`);
      if (!res.ok) return;
      const data = await res.json().catch(() => ({ employees: [] }));
      const emp = (data.employees ?? []).find((e: { email: string; id: number }) => e.email.toLowerCase() === email.toLowerCase());
      if (emp) { setEmployeeId(emp.id); loadHistory(emp.id); }
    })();
  }, [email, loadHistory]);

  useEffect(() => {
    if (!session) return;
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, [session]);

  const { workSec, breakSec } = derive(session, nowMs);
  // Already completed today if we have a snapshot, or a saved record dated today.
  const completedToday = !!done || history.some((r) => isSameDay(new Date(r.date), new Date()));
  const state: "idle" | "working" | "break" | "done" =
    session ? session.state : completedToday ? "done" : "idle";

  const now = new Date();
  const weekStart = startOfWeek(now);
  let pastWeekMin = 0, pastMonthMin = 0, pastTodayWorkMin = 0, pastTodayBreakMin = 0;
  for (const r of history) {
    const d = new Date(r.date);
    if (d >= weekStart) pastWeekMin += r.workedMinutes;
    if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) pastMonthMin += r.workedMinutes;
    if (isSameDay(d, now)) { pastTodayWorkMin += r.workedMinutes; pastTodayBreakMin += r.breakMinutes; }
  }
  const todayWorkSec = pastTodayWorkMin * 60 + workSec;
  const todayBreakSec = pastTodayBreakMin * 60 + breakSec;
  const weekWorkSec = pastWeekMin * 60 + workSec;
  const monthWorkSec = pastMonthMin * 60 + workSec;

  function login() {
    if (completedToday) { setNotice("You have already logged in today. Only one login is allowed per day."); return; }
    setNotice("");
    const iso = new Date().toISOString();
    setNowMs(Date.now());
    saveSession({ loginAt: iso, state: "working", breaksTaken: 0, workAccumSec: 0, breakAccumSec: 0, segmentStart: iso });
  }
  function takeBreak() {
    if (!session) return;
    const nowIso = new Date().toISOString();
    const seg = Math.floor((Date.now() - new Date(session.segmentStart).getTime()) / 1000);
    saveSession({ ...session, state: "break", workAccumSec: session.workAccumSec + seg, breaksTaken: session.breaksTaken + 1, segmentStart: nowIso });
  }
  function resume() {
    if (!session) return;
    const nowIso = new Date().toISOString();
    const seg = Math.floor((Date.now() - new Date(session.segmentStart).getTime()) / 1000);
    saveSession({ ...session, state: "working", breakAccumSec: session.breakAccumSec + seg, segmentStart: nowIso });
  }

  async function logout() {
    if (!session) return;
    const iso = new Date().toISOString();
    const { workSec: finalWork, breakSec: finalBreak } = derive(session, Date.now());
    const snap: DoneSnap = { day: dayStr(), loginAt: session.loginAt, logoutAt: iso, breaksTaken: session.breaksTaken };
    saveSession(null);
    saveDone(snap);
    if (employeeId) {
      setSaving(true);
      try {
        await fetch("/api/attendance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            employeeId,
            date: iso,
            loginAt: snap.loginAt,
            logoutAt: iso,
            breakMinutes: Math.round(finalBreak / 60),
            workedMinutes: Math.round(finalWork / 60),
            status: "Complete",
          }),
        });
        await loadHistory(employeeId);
      } finally {
        setSaving(false);
      }
    }
  }

  // What to show in the Login/Logout/Breaks line.
  const shownLogin = session?.loginAt ?? done?.loginAt ?? null;
  const shownLogout = done?.logoutAt ?? null;
  const shownBreaks = session?.breaksTaken ?? done?.breaksTaken ?? 0;

  const statusBadge =
    state === "working" ? { tone: "green" as const, text: "Working" } :
    state === "break" ? { tone: "orange" as const, text: "On Break" } :
    state === "done" ? { tone: "gray" as const, text: "Completed" } :
    { tone: "gray" as const, text: "Not Logged In" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Attendance</h2>
          <p className="text-sm text-gray-500">Track login, break and logout for <strong>{name}</strong>. One login per day.</p>
        </div>
        <Badge tone={statusBadge.tone}>{statusBadge.text}</Badge>
      </div>

      {!employeeId && email && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700">
          No employee record is linked to {email}, so sessions will not be saved.
        </div>
      )}
      {notice && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700">{notice}</div>
      )}

      {/* Clock card */}
      <Card>
        <div className="flex flex-col gap-6 py-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            {state === "idle" && (
              <Button variant="success" size="lg" onClick={login}>Login</Button>
            )}
            {state === "working" && (
              <>
                <Button variant="warning" size="lg" onClick={takeBreak}><Coffee size={18} /> Break</Button>
                <Button variant="danger" size="lg" onClick={logout} disabled={saving}><LogOut size={18} /> {saving ? "Saving..." : "Logout"}</Button>
              </>
            )}
            {state === "break" && (
              <>
                <Button variant="success" size="lg" onClick={resume}>Resume Work</Button>
                <Button variant="danger" size="lg" onClick={logout} disabled={saving}><LogOut size={18} /> Logout</Button>
              </>
            )}
            {state === "done" && (
              <span className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-2.5 font-semibold text-emerald-700">
                <CheckCircle2 size={20} /> Day completed — you can log in again tomorrow
              </span>
            )}
          </div>
          <div className="flex gap-10 text-right">
            <div>
              <p className="text-sm text-gray-500">Work Time</p>
              <p className="font-mono text-3xl font-bold text-emerald-600">{hms(workSec)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Break Time</p>
              <p className="font-mono text-3xl font-bold text-amber-500">{hms(breakSec)}</p>
            </div>
          </div>
        </div>
        <div className="mt-3 border-t border-gray-100 pt-3 text-sm text-gray-600">
          <span className="mr-6">Login: <strong>{timeOnly(shownLogin)}</strong></span>
          <span className="mr-6">Logout: <strong>{shownLogout ? timeOnly(shownLogout) : "—"}</strong></span>
          <span>Breaks taken: <strong>{shownBreaks}</strong></span>
        </div>
      </Card>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="!p-4"><p className="text-sm text-gray-500">Today Work</p><p className="mt-1 font-mono text-2xl font-bold text-gray-900">{hms(todayWorkSec)}</p></Card>
        <Card className="!p-4"><p className="text-sm text-gray-500">Today Break</p><p className="mt-1 font-mono text-2xl font-bold text-gray-900">{hms(todayBreakSec)}</p></Card>
        <Card className="!p-4"><p className="text-sm text-gray-500">This Week Work</p><p className="mt-1 font-mono text-2xl font-bold text-gray-900">{hms(weekWorkSec)}</p></Card>
        <Card className="!p-4"><p className="text-sm text-gray-500">This Month Work</p><p className="mt-1 font-mono text-2xl font-bold text-gray-900">{hms(monthWorkSec)}</p></Card>
      </div>

      {/* History */}
      <div>
        <div className="mb-3 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700">
          <Calendar size={15} /> My History
        </div>
        <Table headers={["Date", "Login", "Logout", "Work (hrs)", "Break (hrs)", "Status"]}>
          {history.length === 0 ? (
            <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No history yet. Login and logout to record a day.</td></tr>
          ) : (
            history.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50/80">
                <td className="whitespace-nowrap px-4 py-3">{formatDate(row.date)}</td>
                <td className="px-4 py-3">{timeOnly(row.loginAt)}</td>
                <td className="px-4 py-3">{timeOnly(row.logoutAt)}</td>
                <td className="px-4 py-3">{formatWorkedMinutes(row.workedMinutes)}</td>
                <td className="px-4 py-3">{formatWorkedMinutes(row.breakMinutes)}</td>
                <td className="px-4 py-3"><Badge tone={row.status === "Active" ? "orange" : "green"}>{row.status}</Badge></td>
              </tr>
            ))
          )}
        </Table>
      </div>
    </div>
  );
}
