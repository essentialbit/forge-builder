'use client';

import { ShieldAlert, ShieldCheck, AlertTriangle, Info, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { SASTFinding, DriftFinding } from '@/lib/ai/types';

// ── Severity badge ─────────────────────────────────────────────────────────

function SeverityBadge({ severity }: { severity: SASTFinding['severity'] }) {
  const map = {
    critical: 'bg-red-900/60 text-red-300 border-red-700',
    high: 'bg-orange-900/60 text-orange-300 border-orange-700',
    medium: 'bg-yellow-900/60 text-yellow-300 border-yellow-700',
    low: 'bg-slate-700 text-slate-300 border-slate-600',
    info: 'bg-blue-900/40 text-blue-300 border-blue-700',
  };
  return (
    <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wide', map[severity])}>
      {severity}
    </span>
  );
}

// ── Score ring ─────────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const radius = 22;
  const circ = 2 * Math.PI * radius;
  const dash = (score / 100) * circ;
  const color = score >= 90 ? '#34d399' : score >= 70 ? '#fbbf24' : '#f87171';

  return (
    <div className="relative w-16 h-16 flex items-center justify-center flex-shrink-0">
      <svg className="absolute inset-0 -rotate-90" width="64" height="64">
        <circle cx="32" cy="32" r={radius} fill="none" stroke="#1e293b" strokeWidth="4" />
        <circle
          cx="32" cy="32" r={radius}
          fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
      </svg>
      <span className="text-lg font-bold" style={{ color }}>{score}</span>
    </div>
  );
}

// ── Single SAST finding row ────────────────────────────────────────────────

function FindingRow({ finding }: { finding: SASTFinding }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-slate-700/50 rounded-lg overflow-hidden">
      <button
        className="w-full flex items-start gap-2 px-3 py-2 text-left hover:bg-slate-800/50 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <ChevronDown className="w-3.5 h-3.5 text-slate-500 mt-0.5 flex-shrink-0" />
               : <ChevronRight className="w-3.5 h-3.5 text-slate-500 mt-0.5 flex-shrink-0" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <SeverityBadge severity={finding.severity} />
            <span className="text-[10px] text-slate-500 capitalize">{finding.category}</span>
          </div>
          <p className="text-xs text-slate-300 mt-1 leading-snug">{finding.message}</p>
        </div>
      </button>
      {open && (
        <div className="px-3 pb-3 pt-1 border-t border-slate-700/40 bg-slate-900/50">
          <p className="text-xs text-slate-400 leading-relaxed">
            <span className="text-slate-300 font-medium">Recommendation: </span>
            {finding.recommendation}
          </p>
          {finding.wcag && (
            <p className="text-[10px] text-blue-400 mt-1">{finding.wcag}</p>
          )}
          {finding.cwe && (
            <p className="text-[10px] text-orange-400 mt-1">{finding.cwe}</p>
          )}
          {finding.sectionType && (
            <p className="text-[10px] text-slate-500 mt-1">Section: {finding.sectionType}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Drift finding row ──────────────────────────────────────────────────────

function DriftRow({ finding }: { finding: DriftFinding }) {
  const colors = { error: 'text-red-400', warning: 'text-yellow-400', info: 'text-blue-400' };
  const icons = { error: ShieldAlert, warning: AlertTriangle, info: Info };
  const Icon = icons[finding.severity];

  return (
    <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-slate-800/40 border border-slate-700/30">
      <Icon className={cn('w-3.5 h-3.5 mt-0.5 flex-shrink-0', colors[finding.severity])} />
      <div className="min-w-0">
        <p className="text-xs text-slate-300 leading-snug">{finding.message}</p>
        <p className="text-[10px] text-slate-500 mt-0.5">{finding.sectionType} · {finding.field}</p>
      </div>
    </div>
  );
}

// ── Main report ────────────────────────────────────────────────────────────

interface SASTReportProps {
  score: number;
  summary: string;
  sast: SASTFinding[];
  drift: DriftFinding[];
  analyzedAt: number | null;
  isAnalyzing: boolean;
  onReanalyze: () => void;
}

export function SASTReport({ score, summary, sast, drift, analyzedAt, isAnalyzing, onReanalyze }: SASTReportProps) {
  const [activeTab, setActiveTab] = useState<'sast' | 'drift'>('sast');

  const critical = sast.filter((f) => f.severity === 'critical').length;
  const high = sast.filter((f) => f.severity === 'high').length;
  const medium = sast.filter((f) => f.severity === 'medium').length;

  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-3">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400">Analysing your site…</p>
      </div>
    );
  }

  if (analyzedAt === null) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-3">
        <ShieldAlert className="w-8 h-8 text-slate-600" />
        <p className="text-xs text-slate-400 text-center">
          No analysis yet. Click below to scan your site for issues, accessibility problems, and configuration drift.
        </p>
        <button
          onClick={onReanalyze}
          className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs rounded-lg font-medium transition-colors"
        >
          Run Analysis
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Score header */}
      <div className="flex items-center gap-3 p-3 bg-slate-800/60 rounded-xl border border-slate-700/50">
        <ScoreRing score={score} />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-200 leading-snug">{summary}</p>
          <div className="flex gap-3 mt-2 text-[10px]">
            {critical > 0 && <span className="text-red-400">{critical} critical</span>}
            {high > 0 && <span className="text-orange-400">{high} high</span>}
            {medium > 0 && <span className="text-yellow-400">{medium} medium</span>}
            {critical === 0 && high === 0 && medium === 0 && (
              <span className="text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> No critical issues
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800/50 rounded-lg p-1">
        {(['sast', 'drift'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'flex-1 py-1.5 text-xs font-medium rounded-md transition-colors',
              activeTab === tab ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
            )}
          >
            {tab === 'sast' ? `Issues (${sast.length})` : `Drift (${drift.length})`}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-2 max-h-80 overflow-y-auto pr-0.5">
        {activeTab === 'sast' && (
          sast.length === 0
            ? <p className="text-xs text-slate-500 text-center py-4">No issues found 🎉</p>
            : sast.map((f) => <FindingRow key={f.id} finding={f} />)
        )}
        {activeTab === 'drift' && (
          drift.length === 0
            ? <p className="text-xs text-slate-500 text-center py-4">No configuration drift detected 🎉</p>
            : drift.map((f) => <DriftRow key={f.id} finding={f} />)
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-[10px] text-slate-600">
          {analyzedAt ? `Analysed ${new Date(analyzedAt).toLocaleTimeString()}` : ''}
        </span>
        <button
          onClick={onReanalyze}
          className="text-[10px] text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1"
        >
          <ExternalLink className="w-3 h-3" /> Re-analyse
        </button>
      </div>
    </div>
  );
}
