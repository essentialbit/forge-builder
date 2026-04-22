"use client";

import { useEffect, useState } from "react";
import { Mail, Inbox } from "lucide-react";

type Submission = {
  id: string;
  type: string;
  payload: string;
  ip: string | null;
  user_agent: string | null;
  created_at: number;
};

export default function SubmissionsPage() {
  const [items, setItems] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    fetch("/api/forms" + (filter ? `?type=${encodeURIComponent(filter)}` : ""))
      .then((r) => r.json())
      .then(setItems)
      .finally(() => setLoading(false));
  }, [filter]);

  const types = Array.from(new Set(items.map((i) => i.type)));

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-1">Form submissions</h1>
      <p className="text-sm text-slate-400 mb-6">
        All form submissions from your published sites land here: newsletters, contact forms, checkouts.
      </p>

      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setFilter("")}
          className={`px-3 py-1 text-xs rounded-full border ${
            !filter ? "bg-amber-500/10 border-amber-500 text-amber-400" : "border-slate-700 text-slate-400"
          }`}
        >
          All
        </button>
        {types.map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-3 py-1 text-xs rounded-full border ${
              filter === t ? "bg-amber-500/10 border-amber-500 text-amber-400" : "border-slate-700 text-slate-400"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-slate-400">Loading…</p>
      ) : items.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center text-slate-400">
          <Inbox className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>No submissions yet.</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/50 text-slate-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-3">Type</th>
                <th className="text-left px-4 py-3">Payload</th>
                <th className="text-left px-4 py-3">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {items.map((s) => {
                let parsed: Record<string, unknown> = {};
                try {
                  parsed = JSON.parse(s.payload);
                } catch {}
                return (
                  <tr key={s.id} className="hover:bg-slate-800/40">
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        {s.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-300 max-w-md truncate">
                      {JSON.stringify(parsed)}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {new Date(s.created_at).toLocaleString()}
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
