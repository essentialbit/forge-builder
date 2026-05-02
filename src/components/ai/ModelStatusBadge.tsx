'use client';

import { cn } from '@/lib/utils';
import type { AIStatusInfo } from '@/hooks/useAI';

interface Props {
  status: AIStatusInfo | null;
  loading?: boolean;
  isLearning?: boolean;
  knowledgeCount?: number;
  className?: string;
}

const PROVIDER_LABELS: Record<string, string> = {
  ollama: 'Ollama',
  webllm: 'WebLLM',
  'rules-based': 'Built-in',
};

const PROVIDER_COLORS: Record<string, string> = {
  ollama: 'bg-emerald-500',
  webllm: 'bg-blue-500',
  'rules-based': 'bg-amber-500',
};

export function ModelStatusBadge({ status, loading, isLearning, className }: Props) {
  if (loading) {
    return (
      <div className={cn('flex items-center gap-1.5 text-xs text-slate-500', className)}>
        <span className="w-1.5 h-1.5 rounded-full bg-slate-600 animate-pulse" />
        <span>Detecting AI…</span>
      </div>
    );
  }

  if (!status) return null;

  const provider = status.provider ?? 'rules-based';
  const dotColor = PROVIDER_COLORS[provider] ?? 'bg-slate-500';
  const label = PROVIDER_LABELS[provider] ?? provider;
  const modelLabel = status.activeModel ? ` · ${status.activeModel}` : '';

  return (
    <div className={cn('flex items-center gap-1.5 text-xs', className)}>
      {/* Live dot */}
      <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', dotColor)} />
      <span className="text-slate-400">
        {label}{modelLabel}
      </span>
      {isLearning && (
        <span className="ml-1 text-amber-400 animate-pulse">learning…</span>
      )}
      {status.knowledgeCount > 0 && (
        <span className="ml-1 text-slate-600 text-[10px]">
          {status.knowledgeCount} facts
        </span>
      )}
    </div>
  );
}
