"use client";

import { useEffect, useState } from "react";
import { History, RotateCcw, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Revision = {
  sha: string;
  authorName: string;
  authorEmail: string;
  timestamp: number;
  message: string;
};

const DEMO_PROJECT_ID = "forge-jewellery";

export default function RevisionsPage() {
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [currentSha, setCurrentSha] = useState("");
  const [repo, setRepo] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [rollingBack, setRollingBack] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${DEMO_PROJECT_ID}/revisions`);
      const data = await res.json();
      setRevisions(data.revisions ?? []);
      setCurrentSha(data.currentSha ?? "");
      setRepo(data.repo ?? "");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function rollback(sha: string) {
    if (!confirm(`Redeploy the version from ${sha.slice(0, 7)}? This will replace the current live site.`)) return;
    setRollingBack(sha);
    setStatusMessage(null);
    try {
      const res = await fetch(`/api/projects/${DEMO_PROJECT_ID}/revisions/${sha}/rollback`, { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        setStatusMessage(`Rolled back to ${sha.slice(0, 7)}. Live site updated.`);
      } else {
        setStatusMessage(`Rollback failed: ${data.error || "unknown error"}`);
      }
    } catch (e) {
      setStatusMessage(`Rollback failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setRollingBack(null);
      load();
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-1">Revisions</h1>
      <p className="text-sm text-slate-400 mb-6">
        Every publish is a git commit. Roll back to any previous version with one click.
        {repo && <span className="ml-2 font-mono text-xs">({repo})</span>}
      </p>

      {statusMessage && (
        <div className="mb-4 bg-green-950/30 border border-green-900 text-green-300 text-sm rounded-md p-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          {statusMessage}
        </div>
      )}

      {loading ? (
        <p className="text-slate-400">Loading…</p>
      ) : revisions.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center text-slate-400">
          <History className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>No publish history yet. Publish a project first.</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/50 text-slate-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-3">SHA</th>
                <th className="text-left px-4 py-3">Message</th>
                <th className="text-left px-4 py-3">When</th>
                <th className="text-right px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {revisions.map((r) => {
                const isCurrent = r.sha === currentSha;
                return (
                  <tr key={r.sha} className={isCurrent ? "bg-amber-500/5" : ""}>
                    <td className="px-4 py-3 font-mono text-xs text-slate-300">
                      {r.sha.slice(0, 7)}
                      {isCurrent && <span className="ml-2 text-xs text-amber-400">current</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-300 max-w-md truncate">{r.message}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{new Date(r.timestamp).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">
                      {!isCurrent && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => rollback(r.sha)}
                          disabled={rollingBack !== null}
                          className="border-slate-700 text-slate-300"
                        >
                          {rollingBack === r.sha ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <RotateCcw className="w-3.5 h-3.5 mr-1" />
                          )}
                          {rollingBack === r.sha ? "Rolling back…" : "Roll back"}
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
