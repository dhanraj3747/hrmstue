"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { useEffect, useState } from "react";

interface Job {
  id: number;
  role: string;
  company: string | null;
  process: string | null;
  skills: string | null;
  languages: string | null;
  salary: string | null;
  ctc: string | null;
  takeHome: string | null;
  location: string | null;
  jd: string | null;
}

export default function CandidateJobOpeningsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Job | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/job-openings");
        if (res.ok) {
          const list = (await res.json()).jobs ?? [];
          setJobs(list);
          // Mark job openings as seen for the notification badge.
          try { localStorage.setItem("hrms_jobs_seen", String(list.length)); } catch {}
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Job Openings</h2>
        <p className="text-sm text-gray-500">Available roles with process, location, language, CTC, take-home & skills.</p>
      </div>

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : jobs.length === 0 ? (
        <Card><p className="text-gray-400">No job openings available right now. Check back soon.</p></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {jobs.map((job) => (
            <Card key={job.id} className="flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{job.role}</h3>
                  <p className="text-sm text-brand-red">{job.company}</p>
                </div>
                <Badge tone={job.process === "Voice" ? "red" : "blue"}>{job.process}</Badge>
              </div>
              <p className="mt-2 text-sm text-gray-500">{job.location}</p>
              <div className="mt-3 space-y-1 text-sm text-gray-600">
                <p><span className="font-medium text-gray-800">Skills:</span> {job.skills || "-"}</p>
                <p><span className="font-medium text-gray-800">Languages:</span> {job.languages || "-"}</p>
                <p><span className="font-medium text-gray-800">CTC:</span> {job.ctc || "-"}</p>
                <p><span className="font-medium text-gray-800">Take-home:</span> {job.takeHome ? `₹${job.takeHome}` : "-"}</p>
              </div>
              <Button className="mt-4 w-full" variant="outline" onClick={() => setSelected(job)}>View Details</Button>
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.role || "Job Details"} wide>
        {selected && (
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <p><span className="font-semibold">Company:</span> {selected.company || "-"}</p>
            <p><span className="font-semibold">Process:</span> {selected.process || "-"}</p>
            <p><span className="font-semibold">Location:</span> {selected.location || "-"}</p>
            <p><span className="font-semibold">Skills:</span> {selected.skills || "-"}</p>
            <p><span className="font-semibold">Languages:</span> {selected.languages || "-"}</p>
            <p><span className="font-semibold">CTC:</span> {selected.ctc || "-"}</p>
            <p><span className="font-semibold">Salary:</span> {selected.salary || "-"}</p>
            <p><span className="font-semibold">Take-home:</span> {selected.takeHome ? `₹${selected.takeHome}` : "-"}</p>
            <p className="sm:col-span-2"><span className="font-semibold">Job Description:</span> {selected.jd || "-"}</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
